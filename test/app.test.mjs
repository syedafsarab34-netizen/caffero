import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const scratch = await mkdtemp(join(tmpdir(), "caffero-e2e-"));
const database = join(scratch, "site.sqlite");
const ownerEmail = "editor@caffero.test";
const ownerPassword = "test-editor-password-2026";
const memberPassword = "one-good-coffee-2026";
const nextPassword = "two-better-morning-2026";
let origin = "";
let serverProcess;
let processOutput = "";
let ownerCookie = "";
let memberCookie = "";
let savedMethodId;

async function portNumber() {
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolveClose, reject) => probe.close((error) => error ? reject(error) : resolveClose()));
  return port;
}

function wait(ms) { return new Promise((resolveWait) => setTimeout(resolveWait, ms)); }

before(async () => {
  const port = await portNumber();
  origin = "http://127.0.0.1:" + port;
  serverProcess = spawn(process.execPath, ["server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      NODE_ENV: "test",
      CAFFERO_DATABASE: database,
      CAFFERO_UPLOADS_DIRECTORY: join(scratch, "uploads"),
      CAFFERO_ADMIN_EMAIL: ownerEmail,
      CAFFERO_ADMIN_PASSWORD: ownerPassword,
      CAFFERO_SESSION_SECRET: "a-test-only-secret-with-more-than-32-characters"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  serverProcess.stdout.on("data", (chunk) => { processOutput += chunk.toString(); });
  serverProcess.stderr.on("data", (chunk) => { processOutput += chunk.toString(); });
  for (let attempt = 0; attempt < 70; attempt += 1) {
    if (serverProcess.exitCode !== null) throw new Error("The test server exited before starting.\n" + processOutput);
    try {
      const response = await fetch(origin + "/api/health");
      if (response.ok) return;
    } catch {}
    await wait(120);
  }
  throw new Error("The test server did not become ready.\n" + processOutput);
});

after(async () => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill("SIGTERM");
    await Promise.race([once(serverProcess, "exit"), wait(5000)]);
  }
  await rm(scratch, { recursive: true, force: true });
});

async function call(method, path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.cookie) headers.set("Cookie", options.cookie);
  if (options.origin) headers.set("Origin", options.origin);
  let body = options.body;
  if (body && !Buffer.isBuffer(body) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  const response = await fetch(origin + path, { method, headers, body });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("json") ? await response.json() : await response.text();
  const cookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [response.headers.get("set-cookie")].filter(Boolean);
  const session = cookies.find((value) => value.startsWith("caffero_session=")) || "";
  return { response, payload, cookie: session.split(";")[0] || "", setCookie: session };
}

test("public discovery, account security, saved guides and owner publishing work end to end", async () => {
  const healthy = await call("GET", "/api/health");
  assert.deepEqual(healthy.payload, { status: "ok", database: "connected" });

  const catalog = await call("GET", "/api/content");
  assert.equal(catalog.response.status, 200);
  assert.ok(catalog.payload.methods.length >= 6);
  assert.ok(catalog.payload.methods.some((method) => method.slug === "aeropress"));
  assert.ok(catalog.payload.articles.length >= 12);
  assert.ok(catalog.payload.types.length >= 10);
  assert.ok(catalog.payload.faq.length >= 10);

  const homepage = await call("GET", "/", { headers: { Accept: "text/html" } });
  assert.equal(homepage.response.status, 200);
  assert.match(homepage.payload, /Brew better\. Understand coffee\./);
  assert.match(homepage.payload, /application\/ld\+json/);
  assert.match(homepage.response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(homepage.response.headers.get("content-security-policy"), /fonts.googleapis.com/);

  for (const [path, title, schema] of [
    ["/brew/french-press", "French press", '"@type":"HowTo"'],
    ["/brew/aeropress", "AeroPress", '"@type":"HowTo"'],
    ["/coffee/arabica-vs-robusta", "Arabica &amp; robusta", '"@type":"Article"'],
    ["/coffee-types/cappuccino", "Cappuccino", '"@type":"WebSite"']
  ]) {
    const page = await call("GET", path, { headers: { Accept: "text/html" } });
    assert.equal(page.response.status, 200);
    assert.ok(page.payload.includes(title), "Expected route title for " + path);
    assert.ok(page.payload.includes(schema), "Expected structured data for " + path);
  }
  const noPage = await call("GET", "/brew/does-not-exist", { headers: { Accept: "text/html" } });
  assert.equal(noPage.response.status, 404);
  assert.match(noPage.payload, /noindex, nofollow/);

  const results = await call("GET", "/api/search?q=french%20press");
  assert.ok(results.payload.results.some((entry) => entry.slug === "french-press"));
  assert.ok(results.payload.results.some((entry) => entry.slug === "french-press-grind"));

  const badOrigin = await call("POST", "/api/contact", {
    origin: "https://a-different-site.example",
    body: { name: "Coffee guest", email: "guest@example.test", subject: "A recipe note", message: "A note about coffee for the team." }
  });
  assert.equal(badOrigin.response.status, 403);

  const registration = await call("POST", "/api/auth/register", {
    origin, body: { name: "Coffee Guest", email: "guest@caffero.test", password: memberPassword }
  });
  assert.equal(registration.response.status, 201);
  assert.ok(registration.setCookie.includes("HttpOnly"));
  assert.ok(registration.setCookie.includes("SameSite=Strict"));
  memberCookie = registration.cookie;
  const profile = await call("GET", "/api/me", { cookie: memberCookie });
  assert.equal(profile.payload.user.email, "guest@caffero.test");
  assert.equal(profile.payload.savedCount, 0);

  const forbidden = await call("GET", "/api/admin/content", { cookie: memberCookie });
  assert.equal(forbidden.response.status, 403);

  const favorite = await call("POST", "/api/favorites", {
    origin, cookie: memberCookie, body: { collection: "methods", slug: "french-press" }
  });
  assert.equal(favorite.response.status, 201);
  savedMethodId = favorite.payload.item.id;
  const savedList = await call("GET", "/api/favorites", { cookie: memberCookie });
  assert.equal(savedList.payload.items[0].slug, "french-press");
  const unsaved = await call("DELETE", "/api/favorites/" + savedMethodId, { origin, cookie: memberCookie });
  assert.equal(unsaved.payload.saved, false);
  assert.equal((await call("GET", "/api/favorites", { cookie: memberCookie })).payload.items.length, 0);

  const changedProfile = await call("PATCH", "/api/me", {
    origin, cookie: memberCookie, body: { name: "Nora Brewer", email: "nora@caffero.test" }
  });
  assert.equal(changedProfile.payload.user.name, "Nora Brewer");

  const changedPassword = await call("POST", "/api/auth/change-password", {
    origin, cookie: memberCookie, body: { currentPassword: memberPassword, newPassword: nextPassword }
  });
  assert.equal(changedPassword.response.status, 200);
  const updatedCookie = changedPassword.cookie;
  assert.ok(updatedCookie);
  assert.equal((await call("GET", "/api/me", { cookie: memberCookie })).response.status, 401);
  assert.equal((await call("GET", "/api/me", { cookie: updatedCookie })).response.status, 200);
  const wrongPassword = await call("POST", "/api/auth/login", {
    origin, body: { email: "nora@caffero.test", password: memberPassword }
  });
  assert.equal(wrongPassword.response.status, 401);
  const login = await call("POST", "/api/auth/login", { origin, body: { email: "nora@caffero.test", password: nextPassword } });
  assert.equal(login.response.status, 200);
  const logout = await call("POST", "/api/auth/logout", { origin, cookie: login.cookie });
  assert.match(logout.setCookie, /Max-Age=0/);
  assert.equal((await call("GET", "/api/me", { cookie: login.cookie })).response.status, 401);

  const contact = await call("POST", "/api/contact", {
    origin, body: { name: "Mina", email: "mina@example.test", subject: "A brighter brew", message: "I have a practical coffee question for Caffero." }
  });
  assert.equal(contact.response.status, 201);

  const ownerLogin = await call("POST", "/api/auth/login", {
    origin, body: { email: ownerEmail, password: ownerPassword }
  });
  assert.equal(ownerLogin.response.status, 200);
  ownerCookie = ownerLogin.cookie;
  const overview = await call("GET", "/api/admin/content", { cookie: ownerCookie });
  assert.equal(overview.response.status, 200);
  assert.ok(overview.payload.dashboard.counts.users >= 2);
  assert.ok(overview.payload.dashboard.users.some((entry) => entry.email === "nora@caffero.test"));
  assert.ok(overview.payload.dashboard.messages.some((entry) => entry.subject === "A brighter brew"));

  const invalidEditorRequest = await call("POST", "/api/admin/content/methods", {
    origin: "https://a-different-site.example", cookie: ownerCookie,
    body: { slug: "blocked", title: "Blocked", description: "A cross-origin edit should not be accepted.", data: {} }
  });
  assert.equal(invalidEditorRequest.response.status, 403);

  const draftData = {
    difficulty: "Easy", time: "3 min", ratio: "1:16", grind: "Medium",
    temperature: "93°C", dose: "20 g", yield: "320 ml",
    equipment: ["A dripper", "A kettle"], steps: [{ title: "Pour gently", text: "Wet the coffee evenly.", duration: "30 sec" }],
    mistakes: ["Do not pour too quickly."], tips: ["Change one thing at a time."]
  };
  const draft = await call("POST", "/api/admin/content/methods", {
    origin, cookie: ownerCookie, body: {
      collection: "methods", slug: "test-bloom", title: "Test bloom", subtitle: "A draft for verification.",
      description: "A small administrator-created brew guide for this test.", image: "", imageAlt: "",
      data: draftData, published: false
    }
  });
  assert.equal(draft.response.status, 201);
  const draftId = draft.payload.item.id;
  assert.equal(draft.payload.item.published, false);
  assert.ok(!(await call("GET", "/api/content")).payload.methods.some((entry) => entry.slug === "test-bloom"));
  assert.equal((await call("GET", "/brew/test-bloom", { headers: { Accept: "text/html" } })).response.status, 404);

  const published = await call("PUT", "/api/admin/content/methods/" + draftId, {
    origin, cookie: ownerCookie, body: {
      collection: "methods", slug: "test-bloom", title: "Test bloom", subtitle: "A tested, published brew guide.",
      description: "A practical test brew guide published from the Caffero admin editor.", image: "",
      imageAlt: "", data: draftData, published: true
    }
  });
  assert.equal(published.response.status, 200);
  assert.equal((await call("GET", "/api/content")).payload.methods.find((entry) => entry.slug === "test-bloom").title, "Test bloom");
  const indexed = await call("GET", "/api/search?q=test%20bloom");
  assert.ok(indexed.payload.results.some((entry) => entry.slug === "test-bloom"));
  assert.equal((await call("GET", "/brew/test-bloom", { headers: { Accept: "text/html" } })).response.status, 200);

  const uploadBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/5q8AAAAASUVORK5CYII=", "base64");
  const uploaded = await call("POST", "/api/admin/images", {
    cookie: ownerCookie, headers: { "Content-Type": "image/png" }, body: uploadBytes
  });
  assert.equal(uploaded.response.status, 201);
  assert.match(uploaded.payload.image, /^\/uploads\/[a-f0-9]+\.png$/);
  const uploadedAsset = await call("GET", uploaded.payload.image);
  assert.equal(uploadedAsset.response.status, 200);
  assert.equal(uploadedAsset.response.headers.get("content-type"), "image/png");

  const inboxNote = overview.payload.dashboard.messages.find((entry) => entry.subject === "A brighter brew");
  const messageStatus = await call("PATCH", "/api/admin/messages/" + inboxNote.id, {
    origin, cookie: ownerCookie, body: { status: "read" }
  });
  assert.equal(messageStatus.payload.updated, true);
  const updatedInbox = await call("GET", "/api/admin/content", { cookie: ownerCookie });
  assert.equal(updatedInbox.payload.dashboard.messages.find((entry) => entry.id === inboxNote.id).status, "read");

  const removed = await call("DELETE", "/api/admin/content/methods/" + draftId, { origin, cookie: ownerCookie });
  assert.equal(removed.payload.deleted, true);
  assert.ok(!(await call("GET", "/api/content")).payload.methods.some((entry) => entry.slug === "test-bloom"));
  assert.equal((await call("GET", "/api/admin/content", { cookie: ownerCookie })).response.status, 200);

  const ownerLogout = await call("POST", "/api/auth/logout", { origin, cookie: ownerCookie });
  assert.match(ownerLogout.setCookie, /Max-Age=0/);
  assert.equal((await call("GET", "/api/admin/content", { cookie: ownerCookie })).response.status, 401);
});
