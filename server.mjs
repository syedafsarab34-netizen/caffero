import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { createHmac, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { seedContent } from "./content.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "public");
const uploadDir = resolve(root, process.env.CAFFERO_UPLOADS_DIRECTORY || "./public/uploads");
try { process.loadEnvFile(join(root, ".env")); } catch (error) { if (error.code !== "ENOENT") throw error; }
const dbPath = resolve(root, process.env.CAFFERO_DATABASE || "./data/caffero.sqlite");
const port = Number(process.env.PORT || 4173);
const production = process.env.NODE_ENV === "production";
const publicOrigin = (process.env.CAFFERO_ORIGIN || process.env.RENDER_EXTERNAL_URL || "").replace(/\/+$/, "");
const trustProxy = process.env.CAFFERO_TRUST_PROXY === "true";
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");
if (production && (!process.env.CAFFERO_SESSION_SECRET || process.env.CAFFERO_SESSION_SECRET.length < 32)) {
  throw new Error("Set CAFFERO_SESSION_SECRET to a unique random value of at least 32 characters in production.");
}
mkdirSync(dirname(dbPath), { recursive: true });
mkdirSync(uploadDir, { recursive: true });
const secret = Buffer.from(process.env.CAFFERO_SESSION_SECRET || randomBytes(48).toString("hex"));
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
db.exec(
  "CREATE TABLE IF NOT EXISTS content (" +
  "id INTEGER PRIMARY KEY, collection TEXT NOT NULL CHECK(collection IN ('methods','articles','types','faq')), slug TEXT NOT NULL, " +
  "title TEXT NOT NULL, subtitle TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '', " +
  "image_alt TEXT NOT NULL DEFAULT '', data_json TEXT NOT NULL DEFAULT '{}', published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)), " +
  "created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(collection,slug));" +
  "CREATE INDEX IF NOT EXISTS content_collection_published_idx ON content(collection,published,slug);" +
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL COLLATE NOCASE UNIQUE, " +
  "password_salt BLOB NOT NULL, password_hash BLOB NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')), " +
  "session_version INTEGER NOT NULL DEFAULT 0, " +
  "created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));" +
  "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, " +
  "expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));" +
  "CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);" +
  "CREATE TABLE IF NOT EXISTS favorites (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, " +
  "content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY(user_id,content_id));" +
  "CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, " +
  "message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','resolved')), created_at TEXT NOT NULL DEFAULT (datetime('now')));"
);
if (!db.prepare("PRAGMA table_info(users)").all().some((column) => column.name === "session_version")) {
  db.exec("ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;");
}
db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Math.floor(Date.now() / 1000));
let fts = true;
try { db.exec("CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(title,subtitle,description,data,tokenize='unicode61 remove_diacritics 2');"); }
catch { fts = false; }
const collections = new Set(["methods", "articles", "types", "faq"]);
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"], [".png", "image/png"],
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".webp", "image/webp"], [".ico", "image/x-icon"]
]);
const indexHtml = readFileSync(join(publicDir, "index.html"), "utf8");
const authLimit = new Map();
const sessionName = "caffero_session";
const sessionLifetime = 60 * 60 * 24 * 30;

function item(row) {
  if (!row) return null;
  let data = {};
  try { data = JSON.parse(row.data_json || "{}"); } catch {}
  return {
    id: row.id, collection: row.collection, slug: row.slug, title: row.title, subtitle: row.subtitle,
    description: row.description, image: row.image_url, imageAlt: row.image_alt, data,
    published: Boolean(row.published), updatedAt: row.updated_at
  };
}
function reindex(row) {
  if (!fts || !row) return;
  db.prepare("DELETE FROM content_fts WHERE rowid=?").run(row.id);
  db.prepare("INSERT INTO content_fts(rowid,title,subtitle,description,data) VALUES(?,?,?,?,?)")
    .run(row.id, row.title, row.subtitle, row.description, row.data_json);
}
const findItem = db.prepare("SELECT * FROM content WHERE collection=? AND slug=? AND published=1");
const findStored = db.prepare("SELECT * FROM content WHERE id=?");
function bySlug(collection, slug) {
  return collections.has(collection) ? item(findItem.get(collection, slug)) : null;
}
const insertSeed = db.prepare("INSERT OR IGNORE INTO content(collection,slug,title,subtitle,description,image_url,image_alt,data_json) VALUES(?,?,?,?,?,?,?,?)");
db.exec("BEGIN");
try {
  for (const group of seedContent) for (const entry of group.items) {
    insertSeed.run(group.collection, entry.slug, entry.title, entry.subtitle || "", entry.description || "", entry.image || "", entry.imageAlt || "", JSON.stringify(entry.data || {}));
  }
  for (const row of db.prepare("SELECT * FROM content").all()) reindex(row);
  db.exec("COMMIT");
} catch (error) { db.exec("ROLLBACK"); throw error; }

function hashPassword(password, salt = randomBytes(16)) {
  return { salt, hash: scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 }) };
}
function provisionOwner() {
  const email = (process.env.CAFFERO_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.CAFFERO_ADMIN_PASSWORD || "";
  if (!email && !password) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) throw new Error("Set both CAFFERO_ADMIN_EMAIL and CAFFERO_ADMIN_PASSWORD (at least 12 characters).");
  const existing = db.prepare("SELECT id FROM users WHERE email=? COLLATE NOCASE").get(email);
  if (existing) db.prepare("UPDATE users SET role='admin' WHERE id=?").run(existing.id);
  else {
    const credentials = hashPassword(password);
    db.prepare("INSERT INTO users(name,email,password_salt,password_hash,role) VALUES(?,?,?,?,'admin')").run("Caffero editor", email, credentials.salt, credentials.hash);
  }
}
provisionOwner();

function bodyHeaders(status, contentType, cache, extra = {}) {
  const headers = {
    "Content-Type": contentType, "Cache-Control": cache, "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()", "Cross-Origin-Resource-Policy": "same-site",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https: data:; connect-src 'self'; font-src 'self' https://fonts.gstatic.com data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
  };
  if (production) {
    headers["Strict-Transport-Security"] = "max-age=31536000";
    headers["Content-Security-Policy"] += "; upgrade-insecure-requests";
  }
  return { ...headers, ...extra };
}
function send(req, res, status, body, contentType = "application/json; charset=utf-8", cache = "no-store", extra = {}) {
  if (res.headersSent || res.destroyed) return;
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body || "");
  const compressible = contentType.startsWith("text/") || contentType.includes("javascript") || contentType.includes("json");
  const gzip = compressible && buffer.length > 1024 && String(req.headers["accept-encoding"] || "").includes("gzip");
  const output = gzip ? gzipSync(buffer) : buffer;
  const headers = bodyHeaders(status, contentType, cache, { ...extra, "Content-Length": output.length });
  if (gzip) { headers["Content-Encoding"] = "gzip"; headers.Vary = "Accept-Encoding"; }
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : output);
}
function json(req, res, status, value, headers = {}) {
  send(req, res, status, JSON.stringify(value), "application/json; charset=utf-8", "no-store", headers);
}
function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function ensure(condition, message, status = 400) { if (!condition) fail(message, status); }
function clean(value, max = 6000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
async function readBuffer(req, maximum = 64 * 1024) {
  let length = 0;
  const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > maximum) fail("That request is too large. Please shorten it and try again.", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function readJson(req, maximum = 96 * 1024) {
  const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  ensure(type === "application/json", "Send this form as JSON.", 415);
  try {
    const result = JSON.parse((await readBuffer(req, maximum)).toString("utf8") || "{}");
    ensure(result && typeof result === "object" && !Array.isArray(result), "We could not read that form.");
    return result;
  } catch (error) {
    if (error.status) throw error;
    fail("We could not read that request. Please try again.");
  }
}
function sendError(req, res, error) {
  const status = Number(error.status) || 500;
  if (status >= 500) console.error("[caffero]", error.message);
  json(req, res, status, { error: status >= 500 ? "Something went wrong. Please try again." : error.message });
}
function limit(req, name, max, duration = 15 * 60 * 1000) {
  const forwarded = trustProxy ? String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() : "";
  const client = forwarded || req.socket.remoteAddress || "unknown";
  const key = name + ":" + client;
  const now = Date.now();
  let value = authLimit.get(key);
  if (!value || value.until < now) { value = { count: 0, until: now + duration }; authLimit.set(key, value); }
  value.count += 1;
  if (authLimit.size > 10000) for (const [entry, record] of authLimit) if (record.until < now) authLimit.delete(entry);
  ensure(value.count <= max, "Too many attempts. Please wait a few minutes and try again.", 429);
}
function originFor(req) {
  if (publicOrigin) return publicOrigin;
  const host = String(req.headers.host || "");
  ensure(/^[a-zA-Z0-9.:[\]-]{1,255}$/.test(host), "This request could not be verified.", 400);
  return (req.socket.encrypted ? "https://" : "http://") + host;
}
function sameOrigin(req) {
  if (!req.headers.origin) return;
  let origin = "";
  try { origin = new URL(req.headers.origin).origin; } catch {}
  ensure(origin && origin === originFor(req), "Reload the page and try that again.", 403);
}
function signature(value) { return createHmac("sha256", secret).update(value).digest("base64url"); }
function sessionCookie(user) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetime;
  const nonce = randomBytes(18).toString("base64url");
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Math.floor(Date.now() / 1000));
  db.prepare("INSERT INTO sessions(id,user_id,expires_at) VALUES(?,?,?)").run(nonce, user.id, expiresAt);
  const data = Buffer.from(JSON.stringify({ sub: user.id, ver: user.sessionVersion || 0, exp: expiresAt, nonce: nonce })).toString("base64url");
  return sessionName + "=" + data + "." + signature(data) + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + sessionLifetime + (production ? "; Secure" : "");
}
function expireCookie() { return sessionName + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" + (production ? "; Secure" : ""); }
function cookieMap(req) {
  const found = Object.create(null);
  for (const part of String(req.headers.cookie || "").split(";")) {
    const at = part.indexOf("=");
    if (at >= 0) found[part.slice(0, at).trim()] = part.slice(at + 1).trim();
  }
  return found;
}
function who(req) {
  const token = cookieMap(req)[sessionName];
  if (!token || token.length > 2048) return null;
  const [payload, proof, extra] = token.split(".");
  if (!payload || !proof || extra) return null;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(proof);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Number.isInteger(data.sub) || !Number.isInteger(data.exp) || data.exp < Date.now() / 1000) return null;
    const row = db.prepare("SELECT id,name,email,role,created_at AS createdAt,session_version AS sessionVersion FROM users WHERE id=?").get(data.sub);
    const active = db.prepare("SELECT id FROM sessions WHERE id=? AND user_id=? AND expires_at>?").get(data.nonce, data.sub, Math.floor(Date.now() / 1000));
    return row && active && (data.ver || 0) === row.sessionVersion ? { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.createdAt } : null;
  } catch { return null; }
}
function destroySession(req) {
  const token = cookieMap(req)[sessionName];
  if (!token || token.length > 2048) return;
  const [payload, proof, extra] = token.split(".");
  if (!payload || !proof || extra) return;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(proof);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return;
  try {
    const details = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof details.nonce === "string") db.prepare("DELETE FROM sessions WHERE id=?").run(details.nonce);
  } catch {}
}
function userRequired(req) { const user = who(req); ensure(Boolean(user), "Sign in to continue.", 401); return user; }
function adminRequired(req) { const user = userRequired(req); ensure(user.role === "admin", "You need an editor account to manage this page.", 403); return user; }
function listPublic(collection) { return db.prepare("SELECT * FROM content WHERE collection=? AND published=1 ORDER BY id").all(collection).map(item); }
function saveItem(collection, input, id) {
  ensure(collections.has(collection), "Choose a valid content type.");
  const slug = clean(input.slug, 64).toLowerCase();
  const title = clean(input.title, 140);
  const subtitle = clean(input.subtitle, 240);
  const description = clean(input.description, 1600);
  const image = clean(input.image, 1000);
  const imageAlt = clean(input.imageAlt, 280);
  const data = input.data && typeof input.data === "object" && !Array.isArray(input.data) ? input.data : {};
  ensure(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug), "Use lowercase letters, numbers and hyphens for the page address.");
  ensure(title.length >= 2, "Add a title of at least two characters.");
  ensure(description.length >= 12, "Add a short, useful description.");
  ensure(JSON.stringify(data).length < 30000, "Those details are too long. Shorten them and try again.");
  ensure(!image || image.startsWith("/uploads/") || /^https:\/\//i.test(image), "Add a secure image URL or upload an image.");
  const published = input.published === false || input.published === 0 || input.published === "false" ? 0 : 1;
  let row;
  if (id) {
    ensure(Boolean(db.prepare("SELECT id FROM content WHERE id=? AND collection=?").get(id, collection)), "We could not find that item.", 404);
    try {
      db.prepare("UPDATE content SET slug=?,title=?,subtitle=?,description=?,image_url=?,image_alt=?,data_json=?,published=?,updated_at=datetime('now') WHERE id=? AND collection=?")
        .run(slug, title, subtitle, description, image, imageAlt, JSON.stringify(data), published, id, collection);
    } catch (error) {
      if (String(error.code || "").includes("CONSTRAINT")) return fail("Another note already uses that page address.", 409);
      throw error;
    }
    row = findStored.get(id);
  } else {
    try {
      db.prepare("INSERT INTO content(collection,slug,title,subtitle,description,image_url,image_alt,data_json,published) VALUES(?,?,?,?,?,?,?,?,?)")
        .run(collection, slug, title, subtitle, description, image, imageAlt, JSON.stringify(data), published);
    } catch (error) {
      if (String(error.code || "").includes("CONSTRAINT")) return fail("Another note already uses that page address.", 409);
      throw error;
    }
    row = db.prepare("SELECT * FROM content WHERE collection=? AND slug=?").get(collection, slug);
  }
  reindex(row);
  return item(row);
}
function search(query) {
  const q = clean(query, 120).replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim();
  if (!q) return [];
  let rows = [];
  if (fts) {
    try {
      const queryString = q.split(" ").filter(Boolean).map((word) => '"' + word.replace(/"/g, "") + '"*').join(" ");
      rows = db.prepare("SELECT c.* FROM content_fts JOIN content c ON c.id=content_fts.rowid WHERE content_fts MATCH ? AND c.published=1 ORDER BY bm25(content_fts),c.title LIMIT 36").all(queryString);
    } catch {}
  }
  if (!rows.length) {
    const words = q.toLowerCase().split(" ").filter(Boolean);
    const where = words.map(() => "lower(title||' '||subtitle||' '||description||' '||data_json||' '||slug) LIKE ?").join(" AND ");
    rows = db.prepare("SELECT * FROM content WHERE published=1 AND (" + where + ") ORDER BY collection,title LIMIT 36").all(...words.map((word) => "%" + word + "%"));
  }
  return [...new Map(rows.map(item).map((entry) => [entry.collection + ":" + entry.id, entry])).values()].slice(0, 36);
}
function stats() {
  const count = (query) => db.prepare(query).get().count;
  return {
    counts: { methods: count("SELECT COUNT(*) count FROM content WHERE collection='methods'"), articles: count("SELECT COUNT(*) count FROM content WHERE collection='articles'"), types: count("SELECT COUNT(*) count FROM content WHERE collection='types'"), faq: count("SELECT COUNT(*) count FROM content WHERE collection='faq'"), users: count("SELECT COUNT(*) count FROM users"), messages: count("SELECT COUNT(*) count FROM contact_messages WHERE status='new'") },
    users: db.prepare("SELECT id,name,email,role,created_at AS createdAt FROM users ORDER BY id DESC LIMIT 50").all(),
    messages: db.prepare("SELECT id,name,email,subject,message,status,created_at AS createdAt FROM contact_messages ORDER BY id DESC LIMIT 50").all()
  };
}
function schema(pathname, current) {
  if (pathname === "/faq") return JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: listPublic("faq").map((faq) => ({ "@type": "Question", name: faq.title, acceptedAnswer: { "@type": "Answer", text: faq.description } })) });
  if (current && current.collection === "methods") return JSON.stringify({
    "@context": "https://schema.org", "@type": "HowTo", name: current.title + " brewing guide", description: current.description,
    image: current.image || undefined,
    step: (current.data.steps || []).map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.title, text: step.text }))
  });
  if (current && current.collection === "articles") return JSON.stringify({
    "@context": "https://schema.org", "@type": "Article", headline: current.title, description: current.description,
    image: current.image || undefined, author: { "@type": "Organization", name: "Caffero" },
    publisher: { "@type": "Organization", name: "Caffero" }, mainEntityOfPage: (publicOrigin || "") + pathname
  });
  return JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Caffero", description: "A calm, practical guide to brewing better coffee.",
    url: publicOrigin || undefined, potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: (publicOrigin || "") + "/search?q={search_term_string}" }, "query-input": "required name=search_term_string" } });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
function routeItem(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  if (parts[0] === "brew") return bySlug("methods", parts[1]);
  if (parts[0] === "coffee") return bySlug("articles", parts[1]);
  if (parts[0] === "coffee-types") return bySlug("types", parts[1]);
  return null;
}
const staticTitles = {
  "/": "Caffero — Brew better. Understand coffee.", "/brewing": "Find your brewing method · Caffero",
  "/coffee": "Coffee, explained · Caffero", "/coffee-types": "Coffee drinks, made understandable · Caffero",
  "/brew-guide": "Your personal brew guide · Caffero", "/faq": "Coffee questions, answered · Caffero",
  "/search": "Search coffee guides · Caffero", "/about": "Our coffee philosophy · Caffero",
  "/contact": "Say hello · Caffero", "/account": "Your coffee account · Caffero", "/saved": "Your saved guides · Caffero",
  "/admin": "The editor's desk · Caffero", "/privacy": "Privacy · Caffero", "/terms": "Terms · Caffero"
};
function renderPage(req, pathname, status = 200) {
  const current = routeItem(pathname);
  const title = current ? current.title + " · Caffero" : staticTitles[pathname] || "Page not found · Caffero";
  const description = current ? current.description : pathname === "/" ?
    "A more thoughtful cup begins here. Explore hands-on brewing guides, coffee stories and recipes shaped to your taste." :
    "Explore practical coffee guides, trustworthy recipes and everyday brewing wisdom from Caffero.";
  const host = String(req.headers.host || "");
  const base = publicOrigin || (/^[a-zA-Z0-9.:[\]-]{1,255}$/.test(host) ? (req.socket.encrypted ? "https://" : "http://") + host : "");
  const replacements = {
    "__PAGE_TITLE__": escapeHtml(title), "__PAGE_DESCRIPTION__": escapeHtml(description),
    "__PAGE_URL__": escapeHtml(base + pathname), "__PAGE_IMAGE__": escapeHtml(current && current.image ? current.image : "https://images.pexels.com/photos/22884699/pexels-photo-22884699.jpeg?auto=compress&cs=tinysrgb&w=1600"),
    "__PAGE_ROBOTS__": ["/account", "/saved", "/admin"].includes(pathname) || status === 404 ? "noindex, nofollow" : "index, follow",
    "__PAGE_SCHEMA__": schema(pathname, current).replace(/</g, "\\u003c")
  };
  let html = indexHtml;
  for (const key of Object.keys(replacements)) html = html.replaceAll(key, replacements[key]);
  return html;
}
function imageSignature(buffer, type) {
  if (type === "image/png") return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/jpeg") return buffer.length > 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  return type === "image/webp" && buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
}

async function api(req, res, url) {
  const path = url.pathname;
  const parts = path.split("/").filter(Boolean);
  const method = req.method;
  if (method === "GET" && path === "/api/health") return json(req, res, 200, { status: "ok", database: "connected" });
  if (method === "GET" && path === "/api/content") return json(req, res, 200, { methods: listPublic("methods"), articles: listPublic("articles"), types: listPublic("types"), faq: listPublic("faq") });
  if (method === "GET" && path === "/api/search") return json(req, res, 200, { query: clean(url.searchParams.get("q") || "", 120), results: search(url.searchParams.get("q") || "") });
  if (method === "GET" && parts.length === 4 && parts[1] === "content") {
    const result = bySlug(parts[2], parts[3]);
    ensure(Boolean(result), "We could not find that guide.", 404);
    return json(req, res, 200, { item: result });
  }
  if (method === "GET" && path === "/api/auth/session") return json(req, res, 200, { user: who(req) });
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    (path.startsWith("/api/auth/") || path === "/api/me" || path.startsWith("/api/favorites") || path === "/api/contact" || path.startsWith("/api/admin/"))) sameOrigin(req);
  if (method === "POST" && path === "/api/auth/register") {
    limit(req, "register", 8);
    const input = await readJson(req);
    const name = clean(input.name, 80);
    const email = clean(input.email, 254).toLowerCase();
    const password = typeof input.password === "string" ? input.password : "";
    ensure(name.length >= 2, "Add your name so we know what to call you.");
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email address.");
    ensure(password.length >= 10 && password.length <= 128, "Choose a password between 10 and 128 characters.");
    const credentials = hashPassword(password);
    let result;
    try { result = db.prepare("INSERT INTO users(name,email,password_salt,password_hash) VALUES(?,?,?,?)").run(name, email, credentials.salt, credentials.hash); }
    catch (error) {
      if (String(error.code || "").includes("CONSTRAINT")) return fail("An account with that email already exists. Sign in instead.", 409);
      throw error;
    }
    const user = { id: Number(result.lastInsertRowid), name, email, role: "user", sessionVersion: 0 };
    return json(req, res, 201, { user }, { "Set-Cookie": sessionCookie(user) });
  }
  if (method === "POST" && path === "/api/auth/change-password") {
    limit(req, "password-change", 8);
    const user = userRequired(req);
    const input = await readJson(req);
    const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword.slice(0, 128) : "";
    const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
    const stored = db.prepare("SELECT password_salt,password_hash FROM users WHERE id=?").get(user.id);
    const candidate = hashPassword(currentPassword || "invalid-password", stored.password_salt).hash;
    ensure(candidate.length === stored.password_hash.length && timingSafeEqual(candidate, stored.password_hash), "Your current password did not match.", 401);
    ensure(newPassword.length >= 10 && newPassword.length <= 128, "Choose a new password between 10 and 128 characters.");
    const replacement = hashPassword(newPassword);
    db.prepare("UPDATE users SET password_salt=?,password_hash=?,session_version=session_version+1,updated_at=datetime('now') WHERE id=?")
      .run(replacement.salt, replacement.hash, user.id);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
    const updated = db.prepare("SELECT id,name,email,role,session_version AS sessionVersion FROM users WHERE id=?").get(user.id);
    return json(req, res, 200, { changed: true }, { "Set-Cookie": sessionCookie(updated) });
  }
  if (method === "POST" && path === "/api/auth/login") {
    limit(req, "login", 12);
    const input = await readJson(req);
    const email = clean(input.email, 254).toLowerCase();
    const password = typeof input.password === "string" ? input.password.slice(0, 128) : "";
    const stored = db.prepare("SELECT id,name,email,role,password_salt,password_hash,session_version AS sessionVersion FROM users WHERE email=? COLLATE NOCASE").get(email);
    if (!stored) { hashPassword(password || "constant-time-unknown-login"); return fail("That email and password combination could not be found.", 401); }
    const candidate = hashPassword(password || "invalid-password", stored.password_salt).hash;
    ensure(candidate.length === stored.password_hash.length && timingSafeEqual(candidate, stored.password_hash), "That email and password combination could not be found.", 401);
    const user = { id: stored.id, name: stored.name, email: stored.email, role: stored.role, sessionVersion: stored.sessionVersion };
    return json(req, res, 200, { user }, { "Set-Cookie": sessionCookie(user) });
  }
  if (method === "POST" && path === "/api/auth/logout") {
    destroySession(req);
    return json(req, res, 200, { user: null }, { "Set-Cookie": expireCookie() });
  }
  if (method === "GET" && path === "/api/me") {
    const user = userRequired(req);
    return json(req, res, 200, { user, savedCount: db.prepare("SELECT COUNT(*) count FROM favorites WHERE user_id=?").get(user.id).count });
  }
  if (method === "PATCH" && path === "/api/me") {
    const user = userRequired(req);
    const input = await readJson(req);
    const name = clean(input.name, 80);
    const email = clean(input.email, 254).toLowerCase();
    ensure(name.length >= 2, "Add a name with at least two characters.");
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email address.");
    try { db.prepare("UPDATE users SET name=?,email=?,updated_at=datetime('now') WHERE id=?").run(name, email, user.id); }
    catch (error) {
      if (String(error.code || "").includes("CONSTRAINT")) return fail("An account with that email already exists.", 409);
      throw error;
    }
    return json(req, res, 200, { user: who(req) });
  }
  if (method === "GET" && path === "/api/favorites") {
    const user = userRequired(req);
    return json(req, res, 200, { items: db.prepare("SELECT c.* FROM favorites f JOIN content c ON c.id=f.content_id WHERE f.user_id=? AND c.published=1 ORDER BY f.created_at DESC").all(user.id).map(item) });
  }
  if (method === "POST" && path === "/api/favorites") {
    const user = userRequired(req);
    const input = await readJson(req);
    const collection = clean(input.collection, 24);
    const slug = clean(input.slug, 64);
    ensure(collections.has(collection), "Choose a published guide to save.");
    const savedItem = bySlug(collection, slug);
    ensure(Boolean(savedItem), "We could not find that guide.", 404);
    db.prepare("INSERT OR IGNORE INTO favorites(user_id,content_id) VALUES(?,?)").run(user.id, savedItem.id);
    return json(req, res, 201, { saved: true, item: savedItem });
  }
  if (method === "DELETE" && parts[0] === "api" && parts[1] === "favorites" && parts.length === 3) {
    const user = userRequired(req);
    const id = Number(parts[2]);
    ensure(Number.isSafeInteger(id) && id > 0, "That saved guide could not be found.", 404);
    db.prepare("DELETE FROM favorites WHERE user_id=? AND content_id=?").run(user.id, id);
    return json(req, res, 200, { saved: false });
  }
  if (method === "POST" && path === "/api/contact") {
    limit(req, "contact", 8, 60 * 60 * 1000);
    const input = await readJson(req, 16 * 1024);
    const name = clean(input.name, 100);
    const email = clean(input.email, 254).toLowerCase();
    const subject = clean(input.subject, 120);
    const message = clean(input.message, 4000);
    ensure(name.length >= 2, "Add your name.");
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email address.");
    ensure(subject.length >= 3, "Add a subject.");
    ensure(message.length >= 12, "Tell us a little more in your message.");
    db.prepare("INSERT INTO contact_messages(name,email,subject,message) VALUES(?,?,?,?)").run(name, email, subject, message);
    return json(req, res, 201, { sent: true, message: "Your note is in our inbox. Thanks for stopping by." });
  }
  if (parts[0] === "api" && parts[1] === "admin") {
    adminRequired(req);
    if (method === "GET" && path === "/api/admin/content") {
      return json(req, res, 200, { items: db.prepare("SELECT * FROM content ORDER BY collection,title").all().map(item), dashboard: stats() });
    }
    if (method === "POST" && path === "/api/admin/images") {
      const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      ensure(["image/jpeg", "image/png", "image/webp"].includes(type), "Choose a JPEG, PNG or WebP image.");
      const buffer = await readBuffer(req, 5 * 1024 * 1024);
      ensure(imageSignature(buffer, type), "That file does not appear to be a valid image.");
      const suffix = type === "image/png" ? ".png" : type === "image/webp" ? ".webp" : ".jpg";
      const filename = createHash("sha256").update(buffer).digest("hex").slice(0, 18) + suffix;
      const target = join(uploadDir, filename);
      if (!existsSync(target)) writeFileSync(target, buffer, { flag: "wx" });
      return json(req, res, 201, { image: "/uploads/" + filename });
    }
    if (method === "POST" && parts[2] === "content" && parts.length === 4) return json(req, res, 201, { item: saveItem(parts[3], await readJson(req)) });
    if (method === "PUT" && parts[2] === "content" && parts.length === 5) {
      const id = Number(parts[4]);
      ensure(Number.isSafeInteger(id) && id > 0, "That item could not be found.", 404);
      return json(req, res, 200, { item: saveItem(parts[3], await readJson(req), id) });
    }
    if (method === "DELETE" && parts[2] === "content" && parts.length === 5) {
      const id = Number(parts[4]);
      ensure(Number.isSafeInteger(id) && id > 0 && Boolean(db.prepare("SELECT id FROM content WHERE id=? AND collection=?").get(id, parts[3])), "We could not find that item.", 404);
      db.prepare("DELETE FROM content WHERE id=? AND collection=?").run(id, parts[3]);
      if (fts) db.prepare("DELETE FROM content_fts WHERE rowid=?").run(id);
      return json(req, res, 200, { deleted: true });
    }
    if (method === "PATCH" && parts[2] === "messages" && parts.length === 4) {
      const input = await readJson(req, 4 * 1024);
      const status = clean(input.status, 16);
      ensure(["new", "read", "resolved"].includes(status), "Choose new, read or resolved.");
      const changed = db.prepare("UPDATE contact_messages SET status=? WHERE id=?").run(status, Number(parts[3]));
      ensure(changed.changes === 1, "We could not find that message.", 404);
      return json(req, res, 200, { updated: true });
    }
  }
  return fail("That page or service was not found.", 404);
}

const appRoutes = new Set(["/", "/brewing", "/coffee", "/coffee-types", "/brew-guide", "/faq", "/search", "/about", "/contact", "/account", "/saved", "/admin", "/privacy", "/terms"]);
function staticFile(req, res, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  if (decoded.startsWith("/uploads/")) {
    const name = decoded.slice("/uploads/".length);
    if (!/^[a-f0-9]{18}\.(?:jpg|png|webp)$/.test(name)) return false;
    const uploaded = join(uploadDir, name);
    if (!existsSync(uploaded) || !statSync(uploaded).isFile()) return false;
    send(req, res, 200, readFileSync(uploaded), mimeTypes.get(extname(uploaded).toLowerCase()) || "application/octet-stream", "public, max-age=31536000, immutable");
    return true;
  }
  const relative = decoded === "/" ? "index.html" : decoded.slice(1);
  const target = resolve(publicDir, relative);
  if (target !== publicDir && !target.startsWith(publicDir + sep)) return false;
  if (!existsSync(target) || !statSync(target).isFile()) return false;
  const upload = target.startsWith(uploadDir + sep);
  send(req, res, 200, readFileSync(target), mimeTypes.get(extname(target).toLowerCase()) || "application/octet-stream", upload ? "public, max-age=31536000, immutable" : production ? "public, max-age=3600" : "no-cache");
  return true;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://caffero.local");
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      await api(req, res, url);
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") return send(req, res, 405, "Method not allowed.", "text/plain; charset=utf-8");
    if (url.pathname !== "/" && staticFile(req, res, url.pathname)) return;
    const parts = url.pathname.split("/").filter(Boolean);
    const dynamic = parts.length === 2 && (
      (parts[0] === "brew" && bySlug("methods", parts[1])) ||
      (parts[0] === "coffee" && bySlug("articles", parts[1])) ||
      (parts[0] === "coffee-types" && bySlug("types", parts[1]))
    );
    if (appRoutes.has(url.pathname) || dynamic) return send(req, res, 200, renderPage(req, url.pathname), "text/html; charset=utf-8", "no-cache");
    if ((req.headers.accept || "").includes("text/html") && !extname(url.pathname)) return send(req, res, 404, renderPage(req, url.pathname, 404), "text/html; charset=utf-8", "no-cache");
    return send(req, res, 404, "Not found.", "text/plain; charset=utf-8");
  } catch (error) { sendError(req, res, error); }
});
server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.listen(port, process.env.HOST || "127.0.0.1", () => {
  console.log("CAFFERO web service is listening on port " + port + ".");
  console.log("SQLite database: " + dbPath);
});
function close() {
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
