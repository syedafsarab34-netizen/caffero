import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("site shell includes accessible navigation and responsive design safeguards", async () => {
  const [html, css, script, theme] = await Promise.all([
    readFile(resolve(root, "public/index.html"), "utf8"),
    readFile(resolve(root, "public/styles.css"), "utf8"),
    readFile(resolve(root, "public/app.js"), "utf8"),
    readFile(resolve(root, "public/theme.js"), "utf8")
  ]);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
  assert.match(html, /aria-label="Main navigation"/);
  assert.match(html, /aria-controls="mobile-nav"/);
  assert.match(html, /id="search-dialog"/);
  assert.match(html, /data-theme-toggle/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(theme, /localStorage/);
  assert.match(css, /min-width:320px/);
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /@media\(max-width:390px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(script, /loading="lazy"/);
  assert.match(script, /srcset=/);
  assert.match(script, /IntersectionObserver/);
  assert.doesNotMatch(html + css + script, /lorem ipsum/i);
});
