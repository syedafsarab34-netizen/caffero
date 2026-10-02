import { makeRecipe, ratioWater, formatGrams } from "./coffee-math.mjs";

const main = document.getElementById("main");
const $ = (query, root = document) => root.querySelector(query);
const $$ = (query, root = document) => Array.from(root.querySelectorAll(query));
const app = { content: null, user: null, saved: new Set(), methodFilter: "all", articleFilter: "all", drinkFilter: "all", step: 0, timer: null, timerUntil: 0, adminItems: [], adminDashboard: null, authMode: "login", adminFilter: "" };
let searchDelay = null;
let routeSequence = 0;

const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const urlPath = () => window.location.pathname;
const routeData = () => new URLSearchParams(window.location.search);
function media(url, alt, eager = false, className = "") {
  if (!url) return '<div class="image-placeholder" aria-hidden="true"></div>';
  let responsive = "";
  if (url.startsWith("https://images.pexels.com/") && /[?&]w=\d+/.test(url)) {
    const widths = [480, 800, 1200, 1800];
    const sources = widths.map((width) => url.replace(/([?&]w=)\d+/, "$1" + width) + " " + width + "w");
    responsive = ' srcset="' + esc(sources.join(", ")) + '" sizes="' + (eager ? "(max-width: 700px) 100vw, 50vw" : "(max-width: 700px) 48vw, (max-width: 1100px) 33vw, 28vw") + '"';
  }
  return '<img class="' + esc(className) + '" src="' + esc(url) + '"' + responsive + ' alt="' + esc(alt || "") + '" ' + (eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"') + ' decoding="async">';
}
function iconArrow() { return '<span aria-hidden="true">↗</span>'; }
function button(label, action, className = "button", extra = "") {
  return '<button class="' + esc(className) + '" type="button" data-action="' + esc(action) + '" ' + extra + '>' + label + '</button>';
}
function pill(label) { return '<span class="card-label">' + esc(label) + '</span>'; }
function eyebrow(label) { return '<span class="eyebrow">' + esc(label) + '</span>'; }
function sectionHead(label, title, description, href, cta) {
  return '<div class="section-heading"><div class="section-heading-copy">' + eyebrow(label) + '<h2>' + title + '</h2></div><p class="section-intro">' + description + '</p>' +
    (href ? '<a class="text-link" href="' + href + '">' + esc(cta || "Explore") + ' ' + iconArrow() + '</a>' : "") + '</div>';
}
function crumb(parts) {
  return '<nav class="breadcrumb" aria-label="Breadcrumb">' + parts.map((part, index) =>
    (index ? '<b aria-hidden="true">/</b>' : "") + (part.href ? '<a href="' + part.href + '">' + esc(part.label) + '</a>' : '<span aria-current="page">' + esc(part.label) + '</span>')
  ).join("") + '</nav>';
}
function pageHero(label, title, description, crumbs, itemImage) {
  const path = crumbs || [{ label: "Home", href: "/" }, { label }];
  if (itemImage) return '<section class="page-hero page-hero-photo"><div class="wrap"><div>' + crumb(path) + eyebrow(label) + '<h1>' + title + '</h1><p>' + description + '</p></div><div class="page-title-image">' + media(itemImage.image, itemImage.alt) + '</div></div></section>';
  return '<section class="page-hero"><div class="wrap">' + crumb(path) + eyebrow(label) + '<h1>' + title + '</h1><p>' + description + '</p></div></section>';
}
function setMeta(title, description) {
  document.title = title + " · CAFFERO";
  const meta = $('meta[name="description"]');
  if (meta) meta.content = description || "Thoughtful coffee education, made for your everyday brew.";
  const ogTitle = $('meta[property="og:title"]');
  const ogDescription = $('meta[property="og:description"]');
  const ogUrl = $('meta[property="og:url"]');
  const ogImage = $('meta[property="og:image"]');
  const ogType = $('meta[property="og:type"]');
  const twitterCard = $('meta[name="twitter:card"]');
  const twitterTitle = $('meta[name="twitter:title"]');
  const twitterDescription = $('meta[name="twitter:description"]');
  const twitterImage = $('meta[name="twitter:image"]');
  const canonical = $('link[rel="canonical"]');
  const robots = $('meta[name="robots"]');
  const schemaScript = $('script[type="application/ld+json"]');
  if (ogTitle) ogTitle.content = document.title;
  if (ogDescription) ogDescription.content = description || "";
  const cleanUrl = location.href.split("?")[0];
  if (ogUrl) ogUrl.content = cleanUrl;
  if (canonical) canonical.href = cleanUrl;
  const current = app.content && (
    app.content.methods.find((entry) => cleanUrl.endsWith("/brew/" + entry.slug)) ||
    app.content.articles.find((entry) => cleanUrl.endsWith("/coffee/" + entry.slug)) ||
    app.content.types.find((entry) => cleanUrl.endsWith("/coffee-types/" + entry.slug))
  );
  const heroImage = current && current.image ? current.image : "https://images.pexels.com/photos/22884699/pexels-photo-22884699.jpeg?auto=compress&cs=tinysrgb&w=1200";
  if (ogImage) ogImage.content = heroImage;
  if (ogType) ogType.content = current && current.collection === "articles" ? "article" : "website";
  if (twitterCard) twitterCard.content = "summary_large_image";
  if (twitterTitle) twitterTitle.content = document.title;
  if (twitterDescription) twitterDescription.content = description || "";
  if (twitterImage) twitterImage.content = heroImage;
  if (robots) robots.content = ["/account", "/saved", "/admin"].includes(urlPath()) ? "noindex, nofollow" : "index, follow";
  if (schemaScript) {
    let schema = { "@context": "https://schema.org", "@type": "WebSite", name: "Caffero", description: "Coffee guides and recipes for curious home brewers.", url: location.origin };
    if (urlPath() === "/faq" && app.content) schema = {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: app.content.faq.map((entry) => ({ "@type": "Question", name: entry.title, acceptedAnswer: { "@type": "Answer", text: entry.description } }))
    };
    if (current && current.collection === "methods") schema = {
      "@context": "https://schema.org", "@type": "HowTo", name: current.title + " brewing guide", description: current.description,
      step: (current.data.steps || []).map((entry, index) => ({ "@type": "HowToStep", position: index + 1, name: entry.title, text: entry.text }))
    };
    if (current && current.collection === "articles") schema = {
      "@context": "https://schema.org", "@type": "Article", headline: current.title, description: current.description, image: current.image,
      author: { "@type": "Organization", name: "Caffero" }, publisher: { "@type": "Organization", name: "Caffero" }, mainEntityOfPage: cleanUrl
    };
    schemaScript.textContent = JSON.stringify(schema);
  }
}
async function fetchData(path, options = {}) {
  const response = await fetch(path, { credentials: "same-origin", ...options });
  let payload = {};
  try { payload = await response.json(); } catch {}
  if (!response.ok) throw new Error(payload.error || "We could not complete that request.");
  return payload;
}
function toast(message, error = false) {
  const host = $("#toast-region");
  const note = document.createElement("div");
  note.className = "toast" + (error ? " error" : "");
  note.setAttribute("role", error ? "alert" : "status");
  note.textContent = message;
  host.append(note);
  window.setTimeout(() => note.remove(), 3700);
}
function observeReveal() {
  const nodes = $$("[data-reveal]", main);
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("revealed"));
    return;
  }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("revealed"); observer.unobserve(entry.target); }
  }), { threshold: 0.08, rootMargin: "0px 0px -18px 0px" });
  nodes.forEach((node) => observer.observe(node));
}
function updateNav() {
  const path = urlPath();
  $$(".desktop-nav a").forEach((link) => {
    const target = link.getAttribute("href");
    link.removeAttribute("aria-current");
    if (target === path || (target === "/coffee" && path.startsWith("/coffee/")) || (target === "/brewing" && path.startsWith("/brew/"))) link.setAttribute("aria-current", "page");
  });
  const accountLink = $("[data-account-link]");
  if (accountLink) accountLink.innerHTML = (app.user ? "My account " : "Sign in ") + "<span aria-hidden=\"true\">↗</span>";
}
function closeMenu() {
  const menu = $("#mobile-nav");
  const control = $("#menu-toggle");
  if (menu && control) {
    menu.hidden = true;
    control.setAttribute("aria-expanded", "false");
    control.setAttribute("aria-label", "Open menu");
  }
}
function updateCopyright() { const year = $("#copyright-year"); if (year) year.textContent = String(new Date().getFullYear()); }
function syncThemeControls() {
  const dark = document.documentElement.dataset.theme === "dark";
  const name = dark ? "light" : "dark";
  $$ ("[data-theme-toggle]").forEach((control) => {
    control.setAttribute("aria-label", "Switch to " + name + " mode");
    control.title = "Switch to " + name + " mode";
    control.setAttribute("aria-pressed", String(dark));
  });
  $$ ("[data-theme-icon]").forEach((icon) => { icon.textContent = dark ? "☼" : "☾"; });
  $$ ("[data-theme-label]").forEach((label) => { label.textContent = dark ? "Light mode" : "Dark mode"; });
  const themeColor = $('meta[name="theme-color"]');
  if (themeColor) themeColor.content = dark ? "#161916" : "#f6f4ee";
}
function toggleTheme() {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("caffero-theme", document.documentElement.dataset.theme); } catch {}
  syncThemeControls();
}
function showLoading() {
  main.innerHTML = '<section class="loading-screen" role="status"><span class="loading-bean" aria-hidden="true">◒</span><p>Setting the kettle on…</p></section>';
}

function favoriteButton(item) {
  const selected = app.saved.has(item.collection + ":" + item.id);
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.5c0 4.1-6.3 8.7-8.3 10.1a.8.8 0 0 1-1 0C9.5 17.2 3.2 12.6 3.2 8.5A4.2 4.2 0 0 1 11 5.9l1 1 1-1a4.2 4.2 0 0 1 7.8 2.6Z"/></svg>';
  return '<button class="card-icon-button' + (selected ? " is-saved" : "") + '" type="button" data-favorite="' + esc(item.collection) + '" data-slug="' + esc(item.slug) + '" aria-label="' + (selected ? "Remove " + esc(item.title) + " from saved guides" : "Save " + esc(item.title)) + '" title="' + (selected ? "Saved" : "Save this guide") + '">' + heart + '</button>';
}
function methodCard(item, index = 0, saved = true) {
  const data = item.data || {};
  return '<article class="method-card" data-reveal><div class="method-card-image">' + media(item.image, item.imageAlt) + (saved ? favoriteButton(item) : "") +
    pill(data.difficulty || "A good place to start") + '</div><div class="method-card-copy"><p class="card-kicker">' + esc(data.grind || "Find your rhythm") + '</p>' +
    '<h3>' + esc(item.title) + '</h3><p class="method-card-description">' + esc(item.description) + '</p><div class="card-meta">' +
    '<span><b>' + esc(data.time || "A few minutes") + '</b> brew</span><span><b>' + esc(data.ratio || "To taste") + '</b> ratio</span></div>' +
    '<div class="card-bottom"><a class="arrow-link" href="/brew/' + esc(item.slug) + '">Find your recipe ' + iconArrow() + '</a><span class="sr-only">' + esc(item.subtitle) + '</span></div></div></article>';
}
function articleCard(item, index = 0) {
  const data = item.data || {};
  return '<article class="article-card" data-reveal><a class="article-photo" href="/coffee/' + esc(item.slug) + '" aria-label="Read ' + esc(item.title) + '">' +
    media(item.image, item.imageAlt) + '</a><div class="article-meta"><span>' + esc(data.category || "Coffee notes") + '</span><span>' + esc(data.readTime || "4 min") + ' read</span></div>' +
    '<h3><a href="/coffee/' + esc(item.slug) + '">' + esc(item.title) + '</a></h3><p>' + esc(item.description) + '</p><a class="arrow-link" href="/coffee/' + esc(item.slug) + '">Take a closer look ' + iconArrow() + '</a></article>';
}
function drinkCard(item) {
  return '<article class="drink-card">' + media(item.image, item.imageAlt) + '<div class="drink-card-copy"><span>' + esc(item.data.proportion || "Made to your taste") +
    '</span><h3>' + esc(item.title) + '</h3><p>' + esc(item.data.taste || item.subtitle) + '</p></div><a class="drink-open" href="/coffee-types/' +
    esc(item.slug) + '" aria-label="Learn about ' + esc(item.title) + '"></a></article>';
}
function faqList(items, prefix = "faq") {
  return '<div class="accordion-list">' + items.map((entry, index) =>
    '<article class="accordion-item"><h3 class="sr-only">' + esc(entry.title) + '</h3><button class="accordion-button" type="button" id="' + prefix + "-button-" + index +
    '" aria-expanded="false" aria-controls="' + prefix + "-panel-" + index + '" data-accordion="' + prefix + '">' + esc(entry.title) +
    '<b aria-hidden="true">+</b></button><div class="accordion-panel" id="' + prefix + "-panel-" + index + '" hidden>' + esc(entry.description) +
    '<br><a class="text-link" href="/coffee/' + esc(entry.slug === "french-press-grind" ? "grind-size-guide" : "coffee-water-ratios") + '">Read the short guide ' + iconArrow() + '</a></div></article>'
  ).join("") + "</div>";
}
function knowledgeCard(item, index) {
  const icons = ["◉", "✳", "◌", "✦", "◈", "⌁", "◍", "✧", "◉", "◌", "✳", "◈"];
  return '<a class="knowledge-card" data-reveal href="/coffee/' + esc(item.slug) + '"><span class="knowledge-number">0' + (index + 1) +
    '</span><span class="knowledge-icon" aria-hidden="true">' + icons[index % icons.length] + '</span><h3>' + esc(item.title) + '</h3><p>' +
    esc(item.description) + '</p><span class="knowledge-arrow" aria-hidden="true">↗</span></a>';
}

function homePage() {
  const featured = ["french-press", "moka-pot", "aeropress", "espresso"];
  const methods = featured.map((slug) => app.content.methods.find((method) => method.slug === slug)).filter(Boolean);
  const articles = app.content.articles.slice(0, 3);
  const faq = app.content.faq.slice(0, 4);
  const types = app.content.types.slice(0, 5);
  return '<div class="page-shell"><section class="hero"><div class="hero-copy"><span class="eyebrow">A field guide to your next cup</span>' +
    '<h1>Brew better.<br><em>Understand coffee.</em></h1><p class="hero-description">Explore the world of coffee brewing, from French press and Moka pot to AeroPress, pour-over and espresso. Good coffee, made a little more yours.</p>' +
    '<div class="hero-actions"><a class="button" href="/brewing">Explore brewing methods ' + iconArrow() + '</a><a class="button button-outline" href="/coffee">Learn about coffee</a></div>' +
    '<p class="hero-note">A considered guide for everyday coffee people.</p></div><div class="hero-photo">' +
    media("https://images.pexels.com/photos/22884699/pexels-photo-22884699.jpeg?auto=compress&cs=tinysrgb&w=1800", "A hand pouring hot coffee beside beans and leafy branches", true) +
    '<span class="hero-index">ISSUE 01&nbsp; · &nbsp;THE MORNING RITUAL</span><div class="hero-image-note"><span>One cup, a little more considered</span><p>Let the kettle slow you down.</p></div><div class="hero-stamp" aria-label="Read, brew, repeat"><b>Read.<br>Brew.</b><small>Repeat</small></div></div></section>' +
    '<div class="trust-strip" aria-label="Our approach"><span class="trust-point"><i>✳</i> Clear, practical recipes</span><span class="trust-point"><i>✳</i> Curious, never precious</span><span class="trust-point"><i>✳</i> Your cup, your way</span><span class="trust-point"><i>✳</i> Fresh ideas for home</span></div>' +
    '<section class="section editorial-pick"><div class="wrap">' + sectionHead("Explore your brew", "Find a brew that feels like you.", "Different days call for different cups. Pick a brewing style, meet its little rituals and make the first cup your own.", "/brewing", "All the methods") +
    '<div class="method-grid method-grid-four">' + methods.map(methodCard).join("") + '</div></div></section>' +
    '<section class="feature-band"><div class="feature-band-image">' + media("https://images.pexels.com/photos/16466219/pexels-photo-16466219.jpeg?auto=compress&cs=tinysrgb&w=1200", "Espresso falling into a ceramic cup beneath a coffee machine") +
    '<span class="feature-quote">There’s pleasure in the little things.</span></div><div class="feature-band-copy">' + eyebrow("A good cup starts with a few small things") +
    '<h2>Beans, water, time.<br>A little curiosity.</h2><p>A scale, fresh water and a small tweak at a time can change everything. No lab coat or perfect technique required.</p><a class="button" href="/brew-guide">Find your brew recipe ' + iconArrow() + '</a></div></section>' +
    '<section class="section knowledge-section"><div class="wrap">' + sectionHead("Coffee 101", "A little knowledge goes a long way.", "Beans, roast, water and grind size — get to know the details that turn a recipe into a cup you love.", "/coffee", "Visit Coffee 101") +
    '<div class="knowledge-grid">' + app.content.articles.slice(0, 8).map(knowledgeCard).join("") + '</div></div></section>' +
    '<section class="ratio-section"><div class="wrap ratio-layout"><div class="ratio-copy">' + eyebrow("Measure once, brew happily") +
    '<h2>A little math.<br>A lot more coffee.</h2><p>A coffee-to-water ratio is an easy starting point. Try a few grams more, taste the difference and make it yours.</p></div>' + ratioCalculator() + '</div></section>' +
    '<section class="section brew-guide-section"><div class="wrap">' + sectionHead("Your own little ritual", "What sounds good today?", "Choose your brewer and the number of cups. We’ll work out a starting recipe that adjusts when you ask for it a little stronger.", "/brew-guide", "Meet the brew guide") + guideBuilder() + '</div></section>' +
    '<section class="section coffee-types"><div class="wrap">' + sectionHead("Coffee, by name", "A café favorite, explained.", "A flat white or a cortado: learn what goes into the cup and how each drink gets its character.", "/coffee-types", "See all the drinks") +
    '<div class="drink-grid">' + types.map(drinkCard).join("") + '</div></div></section>' +
    '<section class="section-sm faq-section"><div class="wrap faq-layout"><div class="faq-copy">' + eyebrow("Small questions, good answers") + '<h2>Let’s clear a few things up.</h2>' +
    '<p>Every great brewer once made a cup that tasted a little… surprising. We’ve been there.</p><a class="text-link" href="/faq">The full coffee FAQ ' + iconArrow() + '</a></div><div>' + faqList(faq, "home-faq") + '</div></div></section>' +
    '<section class="section-sm"><div class="wrap">' + sectionHead("From the coffee notebook", "More good reads, at your own pace.", "Notes on beans, better brewing and all the small decisions that make your morning cup feel like yours.", "/coffee", "All coffee notes") +
    '<div class="article-rail">' + articles.map(articleCard).join("") + '</div></div></section>' +
    '<section class="signup-band"><div><span class="eyebrow">Your cup is a good place to start</span><h2>Come for a better brew.<br>Stay because you love coffee.</h2></div><div class="signup-band-side"><p>Make a little recipe of your own, save the guides you come back to and explore one thoughtful cup at a time.</p><a class="button" href="/account">Make yourself at home ' + iconArrow() + '</a></div></section></div>';
}
function ratioCalculator() {
  return '<div class="calculator" aria-labelledby="calc-title"><div class="calc-topline"><b id="calc-title">Coffee ratio calculator</b><span>Ready when you are</span></div>' +
    '<div class="preset-row" role="group" aria-label="Choose a brewing method"><button class="preset-chip active" type="button" data-ratio="15">French press</button><button class="preset-chip" type="button" data-ratio="16">Pour-over</button><button class="preset-chip" type="button" data-ratio="10">Moka pot</button><button class="preset-chip" type="button" data-ratio="8">Cold brew</button></div>' +
    '<div class="calc-inputs"><div class="field"><label for="calc-coffee">Coffee</label><div class="input-frame"><input id="calc-coffee" data-calc="coffee" type="number" min="1" max="500" value="20" inputmode="decimal"><span class="input-unit">g</span></div></div>' +
    '<div class="field"><label for="calc-ratio">Your ratio</label><div class="input-frame"><span class="input-unit">1 :</span><input id="calc-ratio" data-calc="ratio" type="number" min="1" max="80" value="15" inputmode="decimal"></div></div>' +
    '<div class="field"><label for="calc-water">Water needed</label><div class="input-frame"><output id="calc-water" aria-live="polite">300</output><span class="input-unit">ml</span></div></div></div>' +
    '<div class="calc-result"><span>That’s about</span><strong id="calc-cups">1 generous cup</strong></div><p class="calc-footnote">One gram of water weighs almost exactly one milliliter.</p></div>';
}
function guideBuilder() {
  return '<div class="guide-builder"><div class="guide-controls">' + eyebrow("Your recipe, in a moment") + '<h3>A brew with your name on it.</h3><p>Choose the brewer. We’ll do the weighing.</p>' +
    '<div class="guide-fields"><div class="field"><label for="guide-method">Your method</label><select class="select-control" id="guide-method" data-guide="method">' +
    app.content.methods.map((method) => '<option value="' + esc(method.slug) + '">' + esc(method.title) + '</option>').join("") + '</select></div>' +
    '<div class="field"><label for="guide-cups">Cups</label><select class="select-control" id="guide-cups" data-guide="cups"><option value="1">1 cup</option><option value="2" selected>2 cups</option><option value="4">4 cups</option><option value="6">6 cups</option></select></div>' +
    '<div class="field"><label for="guide-strength">Strength</label><div class="range-line"><input id="guide-strength" data-guide="strength" type="range" min="85" max="120" value="100"><output id="strength-value">Just right</output></div></div></div></div>' +
    '<div class="guide-preview"><div id="generated-recipe"></div></div></div>';
}

function strengthLabel(value) { return value < 95 ? "A little lighter" : value > 109 ? "A little bolder" : value > 102 ? "A little stronger" : "Just right"; }
function recipeCard(recipe, compact = false) {
  return '<article class="recipe-card"><div class="recipe-top"><div><p class="recipe-recipe-label">' + recipe.servings + (recipe.servings === 1 ? " cup" : " cups") + ' · STARTING RECIPE</p><h3>' + esc(recipe.method) + '</h3></div><span class="recipe-yield">Ratio<br><b>' + esc(recipe.ratio) + '</b></span></div>' +
    '<div class="recipe-stats"><div class="recipe-stat"><span>Fresh coffee</span><strong>' + formatGrams(recipe.coffee) + ' g</strong></div><div class="recipe-stat"><span>' + esc(recipe.unit) + '</span><strong>' + recipe.liquid + ' ml</strong></div>' +
    '<div class="recipe-stat"><span>Grind size</span><strong>' + esc(recipe.grind.split("·")[0].trim()) + '</strong></div><div class="recipe-stat"><span>Brew time</span><strong>' + esc(recipe.time) + '</strong></div></div>' +
    '<div class="recipe-next"><p>' + esc(recipe.note) + '</p>' + (compact ? "" : '<a class="button" href="/brew/' + app.content.methods.find((method) => method.title === recipe.method).slug + '">Make this brew ' + iconArrow() + '</a>') + '</div></article>';
}
function updateCalculator() {
  const coffeeInput = $("#calc-coffee");
  const ratioInput = $("#calc-ratio");
  const waterOutput = $("#calc-water");
  if (!coffeeInput || !ratioInput || !waterOutput) return;
  const coffee = Math.max(1, Math.min(500, Number(coffeeInput.value) || 1));
  const ratio = Math.max(1, Math.min(80, Number(ratioInput.value) || 1));
  waterOutput.value = String(ratioWater(coffee, ratio));
  waterOutput.textContent = String(ratioWater(coffee, ratio));
  const cups = ratioWater(coffee, ratio) / 240;
  const rounded = Math.max(1, Math.round(cups));
  const cupsOutput = $("#calc-cups");
  if (cupsOutput) cupsOutput.textContent = rounded + (rounded === 1 ? " generous cup" : " generous cups");
}
function updateGuide() {
  const methodEl = $("#guide-method");
  const cupsEl = $("#guide-cups");
  const strengthEl = $("#guide-strength");
  const target = $("#generated-recipe");
  if (!methodEl || !cupsEl || !strengthEl || !target) return;
  const method = app.content.methods.find((entry) => entry.slug === methodEl.value) || app.content.methods[0];
  const strength = Number(strengthEl.value) / 100;
  const servings = Number(cupsEl.value);
  const value = $("#strength-value");
  if (value) value.textContent = strengthLabel(Number(strengthEl.value));
  target.innerHTML = recipeCard(makeRecipe(method, servings, strength));
}

function homeRender() {
  main.innerHTML = homePage();
  setMeta("Brew better. Understand coffee.", "Explore the world of coffee brewing, thoughtful recipes, and the small details behind a better cup.");
  updateCalculator();
  updateGuide();
  updateSavedButtons();
  observeReveal();
}

function filteredMethods() {
  const filter = app.methodFilter;
  return app.content.methods.filter((entry) => {
    if (filter === "all") return true;
    if (filter === "beginner") return /easy|beginner/i.test(entry.data.difficulty || "");
    if (filter === "under-five") {
      const label = String(entry.data.time || "");
      const minutes = label.match(/(\d+)\s*(?:[–-]\s*(\d+)\s*)?min/i);
      if (minutes) return Number(minutes[2] || minutes[1]) <= 5;
      const seconds = label.match(/(\d+)\s*(?:[–-]\s*(\d+)\s*)?sec/i);
      return Boolean(seconds && Number(seconds[2] || seconds[1]) <= 300);
    }
    return true;
  });
}
function methodsPage() {
  const filters = [["all", "All methods"], ["beginner", "Good for beginners"], ["under-five", "Five minutes or less"]];
  return '<div class="page-shell">' + pageHero("The brewer’s guide", "Your next favorite cup is closer than you think.", "Each method brings out something different. Choose the ritual that fits your kitchen, your coffee and the pace of your morning.") +
    '<section class="section-sm"><div class="wrap"><div class="filter-bar" role="group" aria-label="Filter brewing methods">' +
    filters.map((entry) => '<button class="filter-tag" type="button" data-method-filter="' + entry[0] + '" aria-pressed="' + (app.methodFilter === entry[0]) + '">' + entry[1] + '</button>').join("") +
    '<span class="form-help">' + filteredMethods().length + ' thoughtful recipes</span></div>' +
    (filteredMethods().length ? '<div class="method-grid method-grid-four">' + filteredMethods().map(methodCard).join("") + '</div>' : emptyState("No methods in that collection yet.")) +
    '</div></section><section class="ratio-section"><div class="wrap ratio-layout"><div class="ratio-copy">' + eyebrow("A lovely place to start") +
    '<h2>Know the amount.<br>Find your taste.</h2><p>Use the ratio calculator to scale a starting recipe for your kitchen, then see where good coffee takes you.</p></div>' + ratioCalculator() + '</div></section></div>';
}
function categoryFilters(items, active, attribute) {
  const categories = ["all", ...new Set(items.map((entry) => (entry.data || {}).category).filter(Boolean))];
  return '<div class="filter-bar" role="group" aria-label="Filter coffee notes">' + categories.map((category) =>
    '<button type="button" class="filter-tag" data-' + attribute + '-filter="' + esc(category) + '" aria-pressed="' + (active === category) + '">' + (category === "all" ? "All notes" : esc(category)) + '</button>'
  ).join("") + '</div>';
}
function coffeePage() {
  const selected = app.articleFilter === "all" ? app.content.articles : app.content.articles.filter((article) => article.data.category === app.articleFilter);
  return '<div class="page-shell">' + pageHero("Coffee 101", "The story behind your favorite cup.", "A friendly, hands-on guide to beans, roast, origins and brewing. Read a little, taste a little and make it yours.") +
    '<section class="section-sm"><div class="wrap">' + categoryFilters(app.content.articles, app.articleFilter, "article") +
    (selected.length ? '<div class="article-rail">' + selected.map(articleCard).join("") + '</div>' : emptyState("More good coffee notes are steeping. Try another collection.")) +
    '</div></section><section class="signup-band"><div><span class="eyebrow">For the life of your next bag of beans</span><h2>Storage is part of the ritual, too.</h2></div><div class="signup-band-side"><p>Keep beans away from air, light, heat and steam. Small bags are a lovely thing.</p><a class="button" href="/coffee/keep-coffee-fresh">Keep coffee fresh ' + iconArrow() + '</a></div></section></div>';
}
function typesPage() {
  const types = app.content.types;
  return '<div class="page-shell">' + pageHero("Coffee, by name", "Something on the menu for every mood.", "What’s a cortado? How much milk goes in a flat white? Get to know the recipes and flavors behind the familiar favorites.") +
    '<section class="section-sm"><div class="wrap">' + categoryFilters(types.map((type) => ({ ...type, data: { category: type.data.method } })), app.drinkFilter, "drink") +
    '<div class="drink-grid">' + types.filter((type) => app.drinkFilter === "all" || type.data.method === app.drinkFilter).map(drinkCard).join("") + '</div></div></section></div>';
}
function emptyState(message, link) {
  return '<div class="empty-state"><h3>A quiet moment.</h3><p>' + esc(message) + '</p>' + (link ? '<a class="button button-outline" href="' + link.href + '">' + esc(link.label) + ' ' + iconArrow() + '</a>' : "") + '</div>';
}
function coffeeDetail(entry) {
  const data = entry.data || {};
  const sections = data.sections || [];
  const related = app.content.articles.filter((article) => article.id !== entry.id && article.data.category === data.category).slice(0, 3);
  const methodRelated = app.content.methods.filter((method) => /brew better/i.test(data.category || "")).slice(0, 3);
  return '<div class="page-shell">' + pageHero(data.category || "Coffee notebook", esc(entry.title), esc(entry.description), [
    { label: "Home", href: "/" }, { label: "Coffee 101", href: "/coffee" }, { label: entry.title }
  ], { image: entry.image, alt: entry.imageAlt }) +
  '<section><div class="wrap detail-layout"><article class="detail-main"><p class="detail-lede">' + esc(entry.description) + '</p>' +
  '<div class="image-wide">' + media(entry.image, entry.imageAlt) + '</div><div class="detail-specs"><div class="spec-item"><span>On the menu</span><b>' + esc(data.category || "The coffee notebook") + '</b></div><div class="spec-item"><span>A gentle read</span><b>' + esc(data.readTime || "4 min") + '</b></div></div>' +
  sections.map((section) => '<section class="prose-block" data-reveal><h2>' + esc(section.heading) + '</h2><p>' + esc(section.text) + '</p>' + (section.callout ? '<aside class="detail-callout">' + esc(section.callout) + '</aside>' : "") + '</section>').join("") +
  '<aside class="detail-callout">One small change at a time. That is how a recipe becomes your recipe.</aside>' +
  '<section class="prose-block"><h2>Want to take this into the kitchen?</h2><p>Choose a method, find a starting recipe and let taste do the rest. Good coffee is what you like in your cup.</p><a class="button" href="/brew-guide">Build a recipe of your own ' + iconArrow() + '</a></section>' +
  (related.length ? '<section class="prose-block"><h2>Keep exploring</h2><div class="related-row">' + related.map(relatedCard).join("") + '</div></section>' : "") +
  '</article><aside class="detail-sidebar"><div class="detail-sidebar-card"><h3>A thoughtful cup, step by step.</h3><p>A scale and small, repeatable changes make it much easier to find the recipe you like.</p><a class="arrow-link" href="/brew-guide">Meet the brew guide ' + iconArrow() + '</a></div>' +
  '<div class="detail-sidebar-card"><h3>Coming up next</h3><p>Read a few minutes, brew something new and trust your own taste.</p><a class="arrow-link" href="/brewing">Find a brewing method ' + iconArrow() + '</a></div></aside></div></section></div>';
}
function relatedCard(entry) {
  const articlePath = entry.collection === "articles" ? "/coffee/" : "/brew/";
  return '<a class="related-card" href="' + articlePath + esc(entry.slug) + '">' + media(entry.image, entry.imageAlt) + '<div class="related-card-copy"><span>' + esc(entry.collection === "methods" ? "Make this brew" : (entry.data || {}).category || "From the journal") + '</span><h3>' + esc(entry.title) + '</h3></div></a>';
}
function drinkDetail(entry) {
  const data = entry.data || {};
  const suggested = app.content.methods.find((method) => method.slug === (data.method === "Espresso" ? "espresso" : (data.method || "french-press").toLowerCase().replaceAll(" ", "-"))) || app.content.methods[0];
  return '<div class="page-shell">' + pageHero("Coffee, by name", esc(entry.title), esc(entry.description), [
    { label: "Home", href: "/" }, { label: "The menu", href: "/coffee-types" }, { label: entry.title }
  ], { image: entry.image, alt: entry.imageAlt }) +
  '<section><div class="wrap detail-layout"><article class="detail-main"><p class="detail-lede">' + esc(entry.subtitle) + '</p><div class="image-wide">' + media(entry.image, entry.imageAlt) + '</div>' +
  '<div class="detail-specs"><div class="spec-item"><span>The feeling</span><b>' + esc(data.taste || "Made to your taste") + '</b></div><div class="spec-item"><span>Made with</span><b>' + esc(data.proportion || "Measure to taste") + '</b></div></div>' +
  '<section class="prose-block"><h2>Into the cup</h2><p>' + esc(entry.description) + ' The numbers below make a generous starting point, not a strict rule. Change them to suit the coffee and the moment.</p>' +
  '<ul>' + (data.ingredients || []).map((ingredient) => '<li>' + esc(ingredient) + '</li>').join("") + '</ul></section>' +
  '<aside class="detail-callout">' + esc(data.notes || "A little room to make the recipe your own.") + '</aside>' +
  '<section class="prose-block"><h2>Make the coffee behind it</h2><p>A good espresso starts with a few small steps. Use our guide to make the base of this drink, then add what makes it yours.</p>' +
  '<a class="button" href="/brew/' + esc(suggested.slug) + '">Learn ' + esc(suggested.title.toLowerCase()) + ' ' + iconArrow() + '</a> <a class="button button-outline" href="/brew-guide">Scale a recipe</a></section></article>' +
  '<aside class="detail-sidebar"><div class="detail-sidebar-card"><h3>In a little more detail</h3><p>' + esc(data.proportion || "The balance is up to you.") + '</p><p>' + esc(data.taste || "") + '</p></div><div class="detail-sidebar-card"><h3>Its brewing method</h3><a class="arrow-link" href="/brew/' + esc(suggested.slug) + '">' + esc(suggested.title) + ' guide ' + iconArrow() + '</a></div></aside></div></section></div>';
}
function difficultyOf(item) { return String((item.data || {}).difficulty || "").toLowerCase(); }
function stepDurationSeconds(label) {
  const match = String(label || "").match(/(\d+(?:\.\d+)?)\s*(hr|hours?|min|minutes?|sec|seconds?)/i);
  if (!match) return 60;
  let amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("hr")) amount *= 3600;
  else if (unit.startsWith("min")) amount *= 60;
  return Math.min(Math.max(Math.round(amount), 10), 3600);
}
function formattedTimer(seconds) {
  const safe = Math.max(0, seconds);
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
}
function stopTimer() {
  if (app.timer) clearInterval(app.timer);
  app.timer = null;
  app.timerUntil = 0;
}
function tickTimer() {
  const display = $("#step-timer-display");
  const control = $('[data-action="timer"]', main);
  if (!display || !control) return;
  const remaining = Math.max(0, Math.ceil((app.timerUntil - Date.now()) / 1000));
  display.textContent = formattedTimer(remaining);
  if (!remaining) {
    stopTimer();
    display.textContent = "All done";
    control.textContent = "Start again";
    toast("Timer’s up. On to the next step.");
  }
}
function methodDetail(entry) {
  const data = entry.data || {};
  const steps = data.steps || [];
  const currentIndex = Math.max(0, Math.min(app.step, steps.length - 1));
  const current = steps[currentIndex] || { title: "Take a moment", text: "Make a cup that feels right to you.", duration: "1 min" };
  const progress = Math.round(((currentIndex + 1) / Math.max(steps.length, 1)) * 100);
  const facts = [
    ["A lovely challenge", data.difficulty || "Find your own pace"], ["Brew time", data.time || "A few minutes"],
    ["Coffee to water", data.ratio || "Start to taste"], ["A good grind", data.grind || "Try your grinder"],
    ["Water", data.temperature || "Fresh and clean"], ["A happy starting dose", data.dose || "Weigh for consistency"],
    ["Expected yield", data.yield || "Pour, taste, adjust"]
  ];
  if (data.extraction) facts.push(["Extraction time", data.extraction]);
  const recipeServings = { "french-press": 2, "moka-pot": 2, "aeropress": 1, "espresso": 1, "pour-over": 2, "cold-brew": 5 };
  const servings = recipeServings[entry.slug] || Math.max(1, Math.min(8, Math.round((Number(data.dose && data.dose.match(/[\d.]+/) ? data.dose.match(/[\d.]+/)[0] : 30)) / 15)));
  const waterRatio = Number(String(data.ratio || "1:15").split(":")[1]) || 15;
  const suggested = {
    servings: servings, method: entry.title, coffee: Number((String(data.dose || "30 g").match(/[\d.]+/) || [30])[0]),
    liquid: Number((String(data.yield || "450 ml").match(/[\d.]+/) || [450])[0]), ratio: "1:" + waterRatio,
    grind: data.grind || "Coarse", time: data.time || "4 min", unit: entry.slug === "espresso" ? "Shot yield" : "Water",
    note: "A dependable starting recipe. Follow the steps, taste and make it yours."
  };
  return '<div class="page-shell">' + pageHero("The brewer’s guide", esc(entry.title), esc(entry.subtitle), [
    { label: "Home", href: "/" }, { label: "Brewing", href: "/brewing" }, { label: entry.title }
  ], { image: entry.image, alt: entry.imageAlt }) +
  '<section><div class="wrap detail-layout"><article class="detail-main"><p class="detail-lede">' + esc(entry.description) + '</p>' +
  '<div class="image-wide">' + media(entry.image, entry.imageAlt) + '</div>' +
  '<section class="prose-block"><h2>A little about this brew</h2><p>' + esc(entry.description) + ' ' + esc(data.tips && data.tips[0] || "") + '</p></section>' +
  '<section class="prose-block"><h2>What you’ll need</h2><div class="equipment-chips">' + (data.equipment || ["Fresh coffee", "Kettle", "A few unhurried minutes"]).map((tool) => '<span class="equipment-chip">' + esc(tool) + '</span>').join("") + '</div></section>' +
  '<div class="detail-specs">' + facts.map((fact) => '<div class="spec-item"><span>' + esc(fact[0]) + '</span><b>' + esc(fact[1]) + '</b></div>').join("") + '</div>' +
  '<section class="prose-block"><h2>Your recipe to start with</h2><p>' + esc(data.coffee || "A fresh, well-rested coffee. A good place to start is the roast and flavor you already enjoy.") + '</p><div class="inline-recipe">' +
  '<strong>' + esc(entry.title) + ', for ' + esc(suggested.servings) + ' cups</strong><dl><dt>Coffee</dt><dd>' + esc(suggested.coffee) + ' g</dd><dt>' + esc(suggested.unit) + '</dt><dd>' + esc(suggested.liquid) + ' ml</dd><dt>Grind</dt><dd>' + esc(suggested.grind) + '</dd><dt>Temperature</dt><dd>' + esc(data.temperature || "Just off the boil") + '</dd><dt>Brew time</dt><dd>' + esc(data.time || "4 min") + '</dd></dl></div></section>' +
  '<section class="prose-block" id="interactive-guide"><h2>Let’s brew it together.</h2><p>Take the next step when you’re ready. Good coffee is a slow, very forgiving thing.</p>' +
  '<div class="guide-progress" aria-label="Brew steps, step ' + (currentIndex + 1) + ' of ' + steps.length + '"><div class="guide-progress-fill" style="width:' + progress + '%"></div></div>' +
  '<article class="interactive-step" id="instruction-card" tabindex="-1" aria-live="polite"><p class="step-number">STEP ' + String(currentIndex + 1).padStart(2, "0") + ' OF ' + String(steps.length).padStart(2, "0") +
  ' &nbsp;·&nbsp; ' + esc(entry.title.toUpperCase()) + '</p><h3>' + esc(current.title) + '</h3><p>' + esc(current.text) + '</p></article>' +
  '<div class="step-footer"><small>Step time: ' + esc(current.duration || "Take your time") + '</small><div class="step-footer-actions">' +
  (current.duration ? '<button class="button button-outline" type="button" data-action="timer">Start timer</button><output id="step-timer-display" role="timer">' + formattedTimer(stepDurationSeconds(current.duration)) + '</output>' : "") +
  (currentIndex ? '<button class="button button-outline" type="button" data-action="prev-step">Previous</button>' : "") +
  '<button class="button" type="button" data-action="next-step" ' + (currentIndex === steps.length - 1 ? 'data-finish="true"' : "") + '>' + (currentIndex === steps.length - 1 ? "Finish brew" : "Next step →") + '</button></div></div></section>' +
  '<section class="prose-block"><h2>A few easy things to miss</h2><ul class="error-list">' + (data.mistakes || []).map((mistake) => '<li>' + esc(mistake) + '</li>').join("") + '</ul></section>' +
  '<section class="prose-block"><h2>Notes from Caffero</h2><ul class="error-list">' + (data.tips || []).map((tip) => '<li>' + esc(tip) + '</li>').join("") + '</ul></section>' +
  '<section class="prose-block step-faq"><h2>A little more detail</h2>' + faqList((data.faq || []).map((faq) => ({ title: faq.q, description: faq.a, slug: entry.slug })), "method-faq") + '</section>' +
  '<div class="section-sm"><h2>A brewer for another day.</h2><div class="related-row">' + app.content.methods.filter((method) => method.id !== entry.id).slice(0, 3).map(relatedCard).join("") + '</div></div></article>' +
  '<aside class="detail-sidebar"><div class="detail-sidebar-card"><h3>Save this recipe</h3><p>Keep the brews you come back to in one little place.</p>' + favoriteButton(entry) + '<span class="form-help" data-save-label></span></div><div class="detail-sidebar-card"><h3>Good beans make good company.</h3><p>' + esc(data.coffee || "Fresh, good-quality beans are always a lovely place to start.") + '</p><a class="arrow-link" href="/coffee">Learn about the bean ' + iconArrow() + '</a></div></aside></div></section></div>';
}
function faqPage() {
  return '<div class="page-shell">' + pageHero("A better cup, one answer at a time", "Questions we’ve all asked before.", "A clear, reassuring answer to the little coffee questions that can make a big difference to what’s in your cup.") +
  '<section class="section-sm"><div class="wrap faq-layout"><div class="faq-copy">' + eyebrow("Coffee is easier than it looks") + '<h2>A curious question is a good place to start.</h2>' +
  '<p>Good coffee does not ask you to be an expert. Start with what tastes nice. Explore the rest when you’re curious.</p><a class="button button-outline" href="/brew-guide">Build a coffee recipe</a></div><div>' + faqList(app.content.faq, "all-faq") + '</div></div></section></div>';
}
function brewGuidePage() {
  return '<div class="page-shell">' + pageHero("A recipe that starts with you", "Let’s make your next cup feel right.", "Choose a method, pick how many cups and set the strength. We’ll work out an easy recipe you can save, brew and fine-tune.") +
  '<section class="section-sm"><div class="wrap">' + guideBuilder() + '<div class="section-heading" style="margin-top:74px"><div class="section-heading-copy">' +
  eyebrow("When you feel like trying something new") + '<h2>Follow the good coffee.</h2></div><p class="section-intro">A few guides for curious mornings. Pick one and start with the simplest step.</p></div><div class="method-grid method-grid-four">' +
  app.content.methods.map(methodCard).join("") + '</div></div></section></div>';
}

async function showStep(index) {
  app.step = index;
  stopTimer();
  await renderRoute(false);
  const step = $("#instruction-card");
  if (step) step.focus({ preventScroll: true });
}
function startStepTimer() {
  const step = app.content.methods.find((method) => location.pathname === "/brew/" + method.slug);
  const duration = step && step.data.steps[app.step] ? stepDurationSeconds(step.data.steps[app.step].duration) : 60;
  stopTimer();
  app.timerUntil = Date.now() + duration * 1000;
  app.timer = window.setInterval(tickTimer, 500);
  tickTimer();
  const buttonEl = $('[data-action="timer"]', main);
  if (buttonEl) buttonEl.textContent = "Restart timer";
}

function articleSearchResults(results) {
  if (!results.length) return emptyState("We couldn’t find that exact phrase. Try “grind,” “French press” or “water.”", { href: "/coffee", label: "Browse Coffee 101" });
  return '<div class="search-result-list">' + results.map((entry) => {
    const paths = { methods: "/brew/", articles: "/coffee/", types: "/coffee-types/", faq: "/faq" };
    const href = entry.collection === "faq" ? paths.faq : paths[entry.collection] + entry.slug;
    return '<a class="search-result-card" href="' + href + '">' + media(entry.image, entry.imageAlt) + '<div><span class="search-result-type">' +
      esc(entry.collection === "methods" ? "Brewing method" : entry.collection === "articles" ? "Coffee 101" : entry.collection === "faq" ? "Quick answer" : "Coffee menu") +
      '</span><h3>' + esc(entry.title) + '</h3><p>' + esc(entry.subtitle || entry.description) + '</p></div></a>';
  }).join("") + '</div>';
}
async function renderSearchPage(query) {
  const id = ++routeSequence;
  main.innerHTML = '<div class="page-shell">' + pageHero("Find your coffee notes", "What are you curious about?", "Search brewing guides, coffee types, recipes and simple answers from around the Caffero notebook.") +
    '<section class="section-sm"><div class="wrap"><form class="search-page-form" data-form="search"><label class="sr-only" for="page-search-input">Search Caffero</label><input id="page-search-input" type="search" name="q" value="' +
    esc(query) + '" placeholder="Try “Moka pot”, “sour coffee” or “grind size”"><button class="button" type="submit">Search ' + iconArrow() + '</button></form><p id="page-search-label" class="form-help" aria-live="polite"></p>' +
    '<div id="page-search-results"><div class="loading-screen" role="status"><p>Finding the good notes…</p></div></div></div></section></div>';
  setMeta("Search", "Search Caffero brewing guides, coffee types, simple recipes and quick answers.");
  if (!query.trim()) return;
  try {
    const result = await fetchData("/api/search?q=" + encodeURIComponent(query));
    if (id !== routeSequence) return;
    $("#page-search-label").textContent = result.results.length ? result.results.length + " thoughtful " + (result.results.length === 1 ? "result" : "results") : "Nothing in the notebook by that exact name.";
    $("#page-search-results").innerHTML = articleSearchResults(result.results);
    observeReveal();
  } catch (error) {
    if (id === routeSequence) $("#page-search-results").innerHTML = emptyState(error.message);
  }
}
function quickSearches() {
  return '<div class="quick-searches"><button type="button" data-search-term="French press">French press</button><button type="button" data-search-term="Arabica">Arabica & robusta</button><button type="button" data-search-term="Moka pot">Moka pot</button><button type="button" data-search-term="coffee ratio">Coffee ratio</button></div>';
}
function showGlobalResults(items) {
  const container = $("#global-search-results");
  if (!container) return;
  if (!items.length) { container.innerHTML = '<p class="search-message">No notes on that just yet. Try a shorter search.</p>'; return; }
  container.innerHTML = items.slice(0, 8).map((entry) => {
    const collectionName = { methods: "Brewing method", articles: (entry.data || {}).category || "Coffee 101", types: "Coffee, by name", faq: "Quick answer" }[entry.collection];
    const href = entry.collection === "faq" ? "/faq" : (entry.collection === "methods" ? "/brew/" : entry.collection === "articles" ? "/coffee/" : "/coffee-types/") + entry.slug;
    return '<a class="search-suggestion" href="' + href + '">' + media(entry.image, entry.imageAlt) + '<span><small>' + esc(collectionName) + '</small><br><b>' + esc(entry.title) + '</b></span><i aria-hidden="true">↗</i></a>';
  }).join("");
}
function openSearch() {
  const dialog = $("#search-dialog");
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  const input = $("#global-search");
  input.value = "";
  $("#global-search-results").innerHTML = '<p class="search-hint">A method, a bean, a better morning. Start anywhere.</p>' + quickSearches();
  window.setTimeout(() => input.focus(), 20);
}
function closeSearch() { const dialog = $("#search-dialog"); if (dialog && dialog.open) dialog.close(); }
async function globalSearch(value) {
  const normalized = value.trim();
  if (normalized.length < 2) {
    $("#global-search-results").innerHTML = '<p class="search-hint">A method, a bean, a better morning. Start anywhere.</p>' + quickSearches();
    return;
  }
  $("#global-search-results").innerHTML = '<p class="search-message">One moment while we look…</p>';
  try {
    const result = await fetchData("/api/search?q=" + encodeURIComponent(normalized));
    if ($("#global-search") && $("#global-search").value.trim() === normalized) showGlobalResults(result.results);
  } catch (error) {
    $("#global-search-results").innerHTML = '<p class="search-message">' + esc(error.message) + '</p>';
  }
}

function accountPage() {
  if (app.user) {
    return '<div class="page-shell">' + pageHero("A familiar little corner", "Good to see you, " + esc(app.user.name.split(" ")[0]) + ".", "The guides you like, all kept here. Edit your details or head straight back into a brew.") +
      '<div class="account-wrap"><section class="account-card"><span class="eyebrow">YOUR CAFFERO ACCOUNT</span><h2>Your details.</h2><p>Just the basics. Your saved guides are always right here.</p>' +
      '<form class="form-stack" data-form="profile"><div class="form-field"><label for="profile-name">Name</label><input id="profile-name" name="name" autocomplete="name" minlength="2" maxlength="80" value="' + esc(app.user.name) + '" required></div>' +
      '<div class="form-field"><label for="profile-email">Email</label><input id="profile-email" name="email" type="email" autocomplete="email" maxlength="254" value="' + esc(app.user.email) + '" required></div>' +
      '<p class="form-message" data-form-message></p><button class="button form-submit" type="submit">Save your details</button></form>' +
      '<p class="account-switch"><a href="/saved">Your saved guides ' + iconArrow() + '</a>' + (app.user.role === "admin" ? ' &nbsp;·&nbsp; <a href="/admin">Open the editor ' + iconArrow() + '</a>' : "") + ' &nbsp;·&nbsp; <button type="button" data-action="logout">Sign out</button></p></section>' +
      '<section class="account-card" style="margin-top:14px"><span class="eyebrow">A fresh key for the door</span><h2>Change your password.</h2><p>Changing your password signs out your other Caffero sessions.</p>' +
      '<form class="form-stack" data-form="password"><div class="form-field"><label for="password-current">Current password</label><input id="password-current" name="currentPassword" type="password" autocomplete="current-password" maxlength="128" required></div>' +
      '<div class="form-field"><label for="password-new">New password</label><input id="password-new" name="newPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128" required><p class="form-help">Use at least 10 characters.</p></div>' +
      '<p class="form-message" data-form-message></p><button class="button button-outline form-submit" type="submit">Update password</button></form></section></div></div>';
  }
  const register = app.authMode === "register";
  return '<div class="page-shell">' + pageHero("Something good is brewing", "Keep a little piece of Caffero.", "Create an account to save the recipes and guides you’d like to come back to. Good coffee, no rush.") +
    '<div class="account-wrap"><section class="account-card"><span class="eyebrow">' + (register ? "A FRESH START" : "YOUR LITTLE COFFEE NOTEBOOK") + '</span><h2>' + (register ? "Make yourself at home." : "Welcome back.") +
    '</h2><p>' + (register ? "One small step. Your first favorite guide is just ahead." : "Sign in to pick up right where your coffee left off.") + '</p><form class="form-stack" data-form="auth">' +
    (register ? '<div class="form-field"><label for="auth-name">Your name</label><input id="auth-name" name="name" autocomplete="name" minlength="2" maxlength="80" required></div>' : "") +
    '<div class="form-field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>' +
    '<div class="form-field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="' + (register ? "new-password" : "current-password") + '" minlength="' + (register ? "10" : "1") + '" maxlength="128" required>' +
    (register ? '<p class="form-help">Use at least 10 characters for a stronger password.</p>' : "") + '</div>' +
    '<p class="form-message" data-form-message></p><button class="button form-submit" type="submit">' + (register ? "Create your Caffero account" : "Sign in") + ' ' + iconArrow() + '</button></form>' +
    '<p class="account-switch">' + (register ? "Already have an account?" : "New to Caffero?") + ' <button type="button" data-action="auth-toggle">' + (register ? "Sign in" : "Make an account") + '</button></p></section></div></div>';
}
async function savedPage(renderToken = routeSequence) {
  if (!app.user) return '<div class="page-shell">' + pageHero("A guide worth keeping", "Your saved coffee notes.", "Sign in to see your collection of recipes and brewing ideas.") + '<div class="section-sm wrap">' +
    emptyState("Your recipe notebook is waiting for you.", { href: "/account", label: "Sign in or create an account" }) + '</div></div>';
  main.innerHTML = '<div class="page-shell">' + pageHero("A good note for another morning", "The guides you’ve saved.", "Keep the little details in one place, then come back whenever the kettle is on.") +
    '<section class="section-sm"><div class="wrap" id="saved-guides"><div class="loading-screen" role="status"><p>Finding your saved notes…</p></div></div></section></div>';
  try {
    const response = await fetchData("/api/favorites");
    if (renderToken !== routeSequence) return;
    const host = $("#saved-guides");
    if (!host) return "";
    host.innerHTML = response.items.length ? '<div class="saved-list">' + response.items.map((entry) => entry.collection === "methods" ? methodCard(entry) : articleCard(entry)).join("") + '</div>' :
      emptyState("You haven’t saved any guides yet. Find one you love, and keep it close.", { href: "/brewing", label: "Explore the brewing methods" });
    updateSavedButtons();
    observeReveal();
  } catch (error) {
    if (renderToken !== routeSequence) return;
    const host = $("#saved-guides");
    if (host) host.innerHTML = emptyState(error.message, { href: "/account", label: "Your account" });
  }
}

function contactPage() {
  return '<div class="page-shell">' + pageHero("We’re happy you stopped by", "There’s always room at the table.", "A question about a method? An idea for a guide? Leave us a note. We read each one with a little coffee in hand.") +
    '<section><div class="wrap contact-layout"><aside class="contact-aside">' + eyebrow("The nice, human kind of inbox") + '<h2>Let’s talk coffee.</h2>' +
    '<p>Thoughts on a recipe, something you’d like to learn, a small correction or a friendly hello — all welcome here.</p><p class="contact-detail">No robots making decisions over here. We’ll read your note and get back to you as soon as we can.</p></aside>' +
    '<form class="form-stack" data-form="contact"><div class="form-field"><label for="contact-name">Your name</label><input id="contact-name" name="name" autocomplete="name" required minlength="2" maxlength="100"></div>' +
    '<div class="form-field"><label for="contact-email">Email address</label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254"></div>' +
    '<div class="form-field"><label for="contact-subject">What’s on your mind?</label><input id="contact-subject" name="subject" required minlength="3" maxlength="120"></div>' +
    '<div class="form-field"><label for="contact-message">A little more, if you like</label><textarea id="contact-message" name="message" required minlength="12" maxlength="4000"></textarea><p class="form-help">A sentence or two helps us get straight to it.</p></div>' +
    '<p class="form-message" data-form-message></p><button class="button" type="submit">Send your note ' + iconArrow() + '</button></form></div></section></div>';
}
function aboutPage() {
  return '<div class="page-shell">' + pageHero("A good cup is a good place to begin", "Coffee brings us together. Knowledge should too.", "Caffero is an independent corner of the internet for people who love coffee — or are just starting to wonder what makes a really good cup.") +
    '<section class="section"><div class="wrap ratio-layout"><div class="ratio-copy">' + eyebrow("Why Caffero") + '<h2>All the good stuff.<br>None of the gatekeeping.</h2>' +
    '<p>Coffee can be as simple or as particular as you want it to be. A brew is not a test to pass. It’s a little chance to learn something, enjoy the moment and make the cup yours.</p></div><div><div class="image-wide" style="aspect-ratio:1.4">' +
    media("https://images.pexels.com/photos/22608922/pexels-photo-22608922.jpeg?auto=compress&cs=tinysrgb&w=1300", "Coffee set out for a slow, considered brewing ritual") +
    '</div><div class="detail-callout">Good coffee is not a secret to keep. It’s a story worth sharing.</div></div></div></section>' +
    '<section class="feature-band"><div class="feature-band-image">' + media("https://images.pexels.com/photos/14792389/pexels-photo-14792389.jpeg?auto=compress&cs=tinysrgb&w=1000", "A moka pot ready for a quiet morning") +
    '</div><div class="feature-band-copy">' + eyebrow("The Caffero promise") + '<h2>Practical, thoughtful, made for your kitchen.</h2><p>Real recipes, everyday tools and room to find what you enjoy. That’s it. Pour something good.</p><a class="button" href="/brewing">Let’s find your brew ' + iconArrow() + '</a></div></section></div>';
}
function policyPage(type) {
  const privacy = type === "privacy";
  const title = privacy ? "Your data, with care." : "A few good ground rules.";
  const details = privacy
    ? '<h2>The information we keep</h2><p>If you choose to make an account, we store your name, email and a salted, hashed password so that your account works. Saved guides are attached to your account. We store notes sent through the contact form so someone can respond.</p><h2>What we do with it</h2><p>Account details are used to provide your profile and saved guides. Contact details are used to respond to the note you sent. We do not sell your information or use it to personalize advertising. We do not build tracking profiles or serve third-party ad trackers.</p><p>Photos are delivered by Pexels and the site’s display fonts by Google Fonts. Your browser sends the ordinary network information needed to request those files to their providers. We do not embed third-party analytics.</p><h2>Your choices</h2><p>Sign out whenever you like. Ask us to update or remove your account through the contact form. The site’s owner can see the information needed to administer accounts and respond to messages.</p><h2>How long we keep it</h2><p>Information remains while the account or the message is active. The site owner can delete an account and its saved guides in the database. Contact messages are reviewed and closed from the editor’s desk.</p><h2>Security and cookies</h2><p>Sign-in uses a protected, HTTP-only, same-site session cookie. Passwords are never stored in plain text. No browser cookie is needed for public browsing or search.</p>'
    : '<h2>Use this site thoughtfully</h2><p>Caffero shares coffee education for home brewing. Recipes are good starting points. Your grinder, beans, water and taste may lead you to adjust them.</p><h2>Your account</h2><p>Keep your password private and provide an email address you can access. You are responsible for activity under your sign-in.</p><h2>Our writing and images</h2><p>Caffero’s original writing and design are for personal, non-commercial learning. Our photographic assets are sourced under their respective free-to-use licenses. See the project’s image credits for individual sources.</p><h2>Changes</h2><p>We may improve or update guides as we learn. Contact us with a correction, question or concern.</p>';
  return '<div class="page-shell">' + pageHero(privacy ? "Your coffee is yours" : "The little details", title, privacy ? "A plain-English note about the choices behind your Caffero account." : "A few simple notes to help everyone feel comfortable and at home.") +
    '<article class="legal-copy"><p>Last updated October 2026.</p>' + details + '<p>Questions or requests? <a class="text-link" href="/contact">Send us a note ' + iconArrow() + '</a>.</p></article></div>';
}

function editorForm(item = null) {
  const draft = item || { collection: "methods", slug: "", title: "", subtitle: "", description: "", image: "", imageAlt: "", data: {}, published: false };
  const objectText = JSON.stringify(draft.data || {}, null, 2);
  return '<section class="admin-editor"><div class="admin-list-header"><h2>' + (item ? "Edit a note" : "A fresh note") + '</h2>' +
    (item ? '<button class="plain-action" type="button" data-action="new-content">Start a new one</button>' : "") + '</div>' +
    '<form class="form-stack" data-form="admin"><input type="hidden" name="id" value="' + (item ? item.id : "") + '">' +
    '<div class="form-field"><label for="admin-collection">What are we editing?</label><select class="admin-input" id="admin-collection" name="collection">' +
    [["methods", "Brewing method"], ["articles", "Coffee article"], ["types", "Coffee drink"], ["faq", "FAQ answer"]].map((entry) => '<option value="' + entry[0] + '" ' + (draft.collection === entry[0] ? "selected" : "") + '>' + entry[1] + '</option>').join("") +
    '</select></div><div class="form-field"><label for="admin-title">Title</label><input class="admin-input" id="admin-title" name="title" required minlength="2" maxlength="140" value="' + esc(draft.title) + '"></div>' +
    '<div class="form-field"><label for="admin-slug">Page address</label><input class="admin-input" id="admin-slug" name="slug" required pattern="[a-z0-9][a-z0-9-]*" maxlength="64" value="' + esc(draft.slug) + '" placeholder="a-little-coffee-note"><p class="form-help">Lowercase letters and hyphens work nicely.</p></div>' +
    '<div class="form-field"><label for="admin-subtitle">A little subtitle</label><input class="admin-input" id="admin-subtitle" name="subtitle" maxlength="240" value="' + esc(draft.subtitle) + '"></div>' +
    '<div class="form-field"><label for="admin-description">Short description</label><textarea class="admin-input" name="description" required minlength="12" maxlength="1600">' + esc(draft.description) + '</textarea></div>' +
    '<div class="form-field"><label for="admin-image">Image URL</label><input class="admin-input" id="admin-image" name="image" type="url" value="' + esc(draft.image && draft.image.startsWith("https://") ? draft.image : "") + '" placeholder="https://…"><input type="hidden" name="uploadedImage" value="' + esc(draft.image && draft.image.startsWith("/uploads/") ? draft.image : "") + '"></div>' +
    '<div class="admin-image-tools"><label class="form-help" for="admin-upload">Or choose a JPEG, PNG or WebP image (up to 5 MB)</label><input id="admin-upload" type="file" accept="image/jpeg,image/png,image/webp" data-admin-upload><img class="admin-preview" src="' + (draft.image ? esc(draft.image) : "") + '" alt="" ' + (draft.image ? "" : "hidden") + '></div>' +
    '<div class="form-field"><label for="admin-alt">Describe the image</label><input class="admin-input" id="admin-alt" name="imageAlt" maxlength="280" value="' + esc(draft.imageAlt) + '"></div>' +
    '<div class="form-field"><label for="admin-data">Structured details <span class="form-help">Valid JSON; the editor changes the method steps, recipe, or article sections.</span></label><textarea class="admin-input" id="admin-data" name="data" spellcheck="false" required>' + esc(objectText) + '</textarea></div>' +
    '<label class="form-help"><input type="checkbox" name="published" ' + (draft.published ? "checked" : "") + '> Show this item on the public site</label>' +
    '<p class="form-message" data-form-message></p><button class="button form-submit" type="submit">' + (item ? "Save your changes" : "Add to the notebook") + ' ' + iconArrow() + '</button></form></section>';
}
async function adminPage(renderToken = routeSequence) {
  if (!app.user) return '<div class="page-shell">' + pageHero("CAFFERO OWNER ACCESS", "The editor’s desk.", "Sign in with the owner account to manage Caffero’s coffee notebook.") +
    '<div class="account-wrap"><section class="account-card"><span class="eyebrow">PRIVATE ADMIN SIGN IN</span><h2>Welcome back, editor.</h2><p>This sign-in is for the site owner. Public Caffero accounts cannot edit website content.</p>' +
    '<form class="form-stack" data-form="auth"><div class="form-field"><label for="auth-email">Admin email</label><input id="auth-email" name="email" type="email" autocomplete="username" maxlength="254" required></div>' +
    '<div class="form-field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="current-password" maxlength="128" required></div>' +
    '<p class="form-message" data-form-message></p><button class="button form-submit" type="submit">Sign in to the editor ' + iconArrow() + '</button></form>' +
    '<p class="form-help">Use the owner email and password set in Render as <strong>CAFFERO_ADMIN_EMAIL</strong> and <strong>CAFFERO_ADMIN_PASSWORD</strong>. If this email already had a Caffero account, it keeps its original password. If you added the owner settings after deployment, redeploy the service to create or promote the account.</p>' +
    '<p class="account-switch"><a href="/">Back to the Caffero website ' + iconArrow() + '</a></p></section></div></div>';
  if (app.user.role !== "admin") return '<div class="page-shell">' + pageHero("CAFFERO OWNER ACCESS", "This account is for brewing.", "The signed-in account does not have permission to edit website content.") +
    '<div class="account-wrap"><section class="account-card"><span class="eyebrow">MEMBER ACCOUNT</span><h2>Owner access only.</h2><p>You’re signed in as <strong>' + esc(app.user.email) + '</strong>. Sign out, then use the owner email and password configured in Render.</p>' +
    '<button class="button" type="button" data-action="logout">Sign out and switch account ' + iconArrow() + '</button><p class="form-help">If the owner account has not been created yet, add <strong>CAFFERO_ADMIN_EMAIL</strong> and <strong>CAFFERO_ADMIN_PASSWORD</strong> in the Render service environment, then redeploy.</p></section></div></div>';
  main.innerHTML = '<div class="page-shell"><section class="admin-page"><div class="wrap">' + eyebrow("CAFFERO · CONTENT STUDIO") + '<h1 style="font-size:clamp(45px,6vw,68px)">The editor’s desk.</h1><p class="section-intro">A good collection grows one thoughtful note at a time.</p>' +
    '<div class="admin-toolbar"><span class="eyebrow">Only you can see this page.</span><button class="button button-outline" type="button" data-action="logout">Sign out</button></div><div id="admin-root"><div class="loading-screen" role="status"><p>Getting the notebook ready…</p></div></div></div></section></div>';
  try {
    const response = await fetchData("/api/admin/content");
    if (renderToken !== routeSequence) return;
    app.adminItems = response.items;
    app.adminDashboard = response.dashboard;
    paintAdmin();
  } catch (error) {
    if (renderToken !== routeSequence) return;
    const root = $("#admin-root");
    if (root) root.innerHTML = emptyState(error.message, { href: "/account", label: "Your account" });
  }
}
function paintAdmin(selectedId = null) {
  const dashboard = app.adminDashboard;
  if (!dashboard) return;
  const current = selectedId ? app.adminItems.find((entry) => entry.id === Number(selectedId)) : null;
  const counts = dashboard.counts;
  const visible = app.adminItems.filter((entry) => (app.adminFilter === "" || entry.collection === app.adminFilter) &&
    (!$("#admin-search-input") || !$("#admin-search-input").value || (entry.title + " " + entry.description).toLowerCase().includes($("#admin-search-input").value.toLowerCase())));
  $("#admin-root").innerHTML = '<div class="admin-stats">' + [["Brew guides", counts.methods], ["Coffee notes", counts.articles], ["Coffee types", counts.types], ["FAQ answers", counts.faq], ["Member accounts", counts.users], ["Unread notes", counts.messages]].map((entry) =>
    '<div class="admin-stat"><span>' + entry[0] + '</span><strong>' + entry[1] + '</strong></div>').join("") + '</div><div class="admin-workspace"><section class="admin-list"><div class="admin-list-header"><h2>In the notebook (' + visible.length + ')</h2>' +
    '<select class="admin-search" data-admin-collection><option value="">All collections</option><option value="methods" ' + (app.adminFilter === "methods" ? "selected" : "") + '>Brewing</option><option value="articles" ' + (app.adminFilter === "articles" ? "selected" : "") + '>Articles</option><option value="types" ' + (app.adminFilter === "types" ? "selected" : "") + '>Coffee types</option><option value="faq" ' + (app.adminFilter === "faq" ? "selected" : "") + '>FAQ</option></select></div>' +
    '<input class="admin-search" id="admin-search-input" type="search" placeholder="Find a note in the notebook" value="' + esc($("#admin-search-input") ? $("#admin-search-input").value : "") + '">' +
    (visible.length ? visible.map((entry) => '<article class="admin-content-row"><div class="admin-content-name"><b>' + esc(entry.title) + '</b><span>' + esc(entry.collection) + ' · /' + esc(entry.collection === "methods" ? "brew" : entry.collection === "types" ? "coffee-types" : "coffee") + '/' + esc(entry.slug) + '</span></div><span class="status-pill">' +
      (entry.published ? "Published" : "Draft") + '</span><div class="admin-row-actions"><button type="button" data-edit-item="' + entry.id + '">Edit</button><button type="button" data-delete-item="' + entry.id + '">Delete</button></div></article>').join("") : '<p class="form-help">No notes here just yet.</p>') +
    '</section>' + editorForm(current) + '</div><section class="admin-records"><h2>Member accounts & inbox</h2><div class="admin-record-list">' +
    '<div class="admin-list"><h3>Members (' + dashboard.users.length + ' recent)</h3>' + (dashboard.users.length ? dashboard.users.map((user) => '<article class="admin-record"><div class="admin-record-head"><strong>' + esc(user.name) + '</strong><span class="status-pill">' + esc(user.role) + '</span></div><p>' + esc(user.email) + '</p><p>Joined ' + esc(user.createdAt) + '</p></article>').join("") : '<p class="form-help">No member accounts yet.</p>') + '</div>' +
    '<div class="admin-list"><h3>Your notes (' + dashboard.messages.length + ' recent)</h3>' + (dashboard.messages.length ? dashboard.messages.map((message) => '<article class="admin-record"><div class="admin-record-head"><strong>' + esc(message.subject) + '</strong><span class="status-pill">' + esc(message.status) + '</span></div>' +
      '<p>' + esc(message.name) + ' · ' + esc(message.email) + '</p><p>' + esc(message.message) + '</p><div class="admin-row-actions">' +
      ["new", "read", "resolved"].map((status) => '<button type="button" data-message-status="' + status + '" data-message-id="' + message.id + '">' + status + '</button>').join("") + '</div></article>').join("") : '<p class="form-help">No new notes in the inbox. It’s a lovely quiet morning.</p>') + '</div></div></section>';
}
async function refreshAdmin() {
  const [response, publicContent] = await Promise.all([fetchData("/api/admin/content"), fetchData("/api/content")]);
  app.adminItems = response.items;
  app.adminDashboard = response.dashboard;
  app.content = publicContent;
  paintAdmin();
}

async function toggleFavorite(collection, slug) {
  if (!app.user) {
    toast("Sign in to keep the guides you love.");
    const returnTo = encodeURIComponent(location.pathname + location.search);
    await navigate("/account?returnTo=" + returnTo);
    return;
  }
  const entry = app.content[collection] && app.content[collection].find((value) => value.slug === slug);
  if (!entry) return;
  const key = entry.collection + ":" + entry.id;
  try {
    if (app.saved.has(key)) {
      await fetchData("/api/favorites/" + entry.id, { method: "DELETE" });
      app.saved.delete(key);
      toast("Removed from your saved guides.");
    } else {
      await fetchData("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collection: collection, slug: slug }) });
      app.saved.add(key);
      toast("Saved for another morning.");
    }
    updateSavedButtons();
    if (location.pathname === "/saved") await savedPage();
  } catch (error) {
    toast(error.message, true);
  }
}
function updateSavedButtons() {
  $$("[data-favorite]").forEach((control) => {
    const collection = control.dataset.favorite;
    const entry = app.content && app.content[collection] ? app.content[collection].find((value) => value.slug === control.dataset.slug) : null;
    if (!entry) return;
    const selected = app.saved.has(collection + ":" + entry.id);
    control.classList.toggle("is-saved", selected);
    control.title = selected ? "Saved" : "Save this guide";
    control.setAttribute("aria-label", (selected ? "Remove " : "Save ") + entry.title + (selected ? " from saved guides" : ""));
  });
}
async function refreshFavorites() {
  if (!app.user) { app.saved.clear(); return; }
  try {
    const result = await fetchData("/api/favorites");
    app.saved = new Set(result.items.map((entry) => entry.collection + ":" + entry.id));
  } catch { app.saved = new Set(); }
}

async function renderRoute(loader = false) {
  const path = urlPath();
  const id = ++routeSequence;
  if (loader) showLoading();
  if (!app.content) {
    try {
      const response = await fetchData("/api/content");
      app.content = response;
      const session = await fetchData("/api/auth/session");
      app.user = session.user;
      await refreshFavorites();
    } catch (error) {
      main.innerHTML = '<section class="not-found"><span class="eyebrow">THE KETTLE CAN WAIT</span><h1>Our notebook is taking a moment.</h1><p>' + esc(error.message) + '</p>' + button("Try again", "retry", "button") + '</section>';
      return;
    }
  }
  if (id !== routeSequence) return;
  updateNav();
  if (path === "/") homeRender();
  else if (path === "/brewing") { main.innerHTML = methodsPage(); setMeta("Brewing methods", "Choose a coffee brewing method, discover its recipe and learn one step at a time."); updateCalculator(); updateSavedButtons(); observeReveal(); }
  else if (path === "/coffee") { main.innerHTML = coffeePage(); setMeta("Coffee 101", "Meet coffee origins, roast, beans, water, grind size, freshness and the small choices behind your cup."); observeReveal(); }
  else if (path === "/coffee-types") { main.innerHTML = typesPage(); setMeta("Coffee, by name", "Discover espresso, cappuccino, flat white, latte and other familiar coffees."); }
  else if (path === "/brew-guide") { main.innerHTML = brewGuidePage(); setMeta("Your personal brew guide", "Build a simple coffee recipe around your brewing method, cup count and preferred strength."); updateGuide(); updateSavedButtons(); observeReveal(); }
  else if (path === "/faq") { main.innerHTML = faqPage(); setMeta("Coffee questions, answered", "Friendly answers to coffee grind, temperature, water ratios, storage and brewing questions."); }
  else if (path === "/search") await renderSearchPage(routeData().get("q") || "");
  else if (path === "/account") { main.innerHTML = accountPage(); setMeta("Your Caffero account", "Sign in, create an account or manage your saved Caffero recipes."); }
  else if (path === "/saved") { setMeta("Your saved guides", "Keep your favorite Caffero recipes and coffee guides close at hand."); await savedPage(id); }
  else if (path === "/contact") { main.innerHTML = contactPage(); setMeta("Say hello", "Send the Caffero team a coffee question, recipe idea or a friendly note."); }
  else if (path === "/about") { main.innerHTML = aboutPage(); setMeta("Our coffee philosophy", "Caffero is a welcoming coffee education space for curious everyday brewers."); observeReveal(); }
  else if (path === "/privacy" || path === "/terms") { main.innerHTML = policyPage(path.slice(1)); setMeta(path === "/privacy" ? "Privacy" : "Terms", "The simple details behind Caffero."); }
  else if (path === "/admin") { setMeta("The editor's desk", "Edit Caffero guides, articles, coffee recipes, and contact notes."); await adminPage(id); }
  else if (path.startsWith("/brew/")) {
    const entry = app.content.methods.find((method) => method.slug === path.slice(6));
    if (entry) { main.innerHTML = methodDetail(entry); setMeta(entry.title + " brewing guide", entry.description); updateSavedButtons(); observeReveal(); }
    else showNotFound();
  } else if (path.startsWith("/coffee-types/")) {
    const entry = app.content.types.find((type) => type.slug === path.slice(13));
    if (entry) { main.innerHTML = drinkDetail(entry); setMeta(entry.title, entry.description); observeReveal(); }
    else showNotFound();
  } else if (path.startsWith("/coffee/")) {
    const entry = app.content.articles.find((article) => article.slug === path.slice(8));
    if (entry) { main.innerHTML = coffeeDetail(entry); setMeta(entry.title, entry.description); observeReveal(); }
    else showNotFound();
  } else showNotFound();
}
function showNotFound() {
  main.innerHTML = '<section class="not-found"><span class="eyebrow">A LITTLE DETOUR</span><h1>This page wandered off.</h1><p>Let’s find the right coffee note together.</p><a class="button" href="/">Back to Caffero ' + iconArrow() + '</a></section>';
}
async function navigate(href, push = true) {
  closeMenu();
  closeSearch();
  const destination = new URL(href, location.href);
  if (destination.origin !== location.origin || destination.pathname.startsWith("/api/")) return;
  if (push) history.pushState({}, "", destination.pathname + destination.search + destination.hash);
  if (destination.hash && destination.pathname === location.pathname) {
    $(destination.hash)?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  stopTimer();
  await renderRoute(false);
  window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

async function submitForm(form) {
  const kind = form.dataset.form;
  const values = new FormData(form);
  const message = $("[data-form-message]", form);
  const send = async (path, method = "POST", body = Object.fromEntries(values)) => fetchData(path, {
    method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  if (message) { message.textContent = ""; message.classList.remove("error"); }
  const submit = $('button[type="submit"]', form);
  const original = submit ? submit.textContent : "";
  if (submit) { submit.disabled = true; submit.textContent = "One little moment…"; }
  try {
    if (kind === "auth") {
      const adminLogin = urlPath() === "/admin";
      const registering = !adminLogin && app.authMode === "register";
      const result = await send(registering ? "/api/auth/register" : "/api/auth/login", "POST", { name: values.get("name"), email: values.get("email"), password: values.get("password") });
      app.user = result.user;
      await refreshFavorites();
      toast(registering ? "Welcome to Caffero. Here’s to a good first cup." : "Welcome back, " + app.user.name.split(" ")[0] + ".");
      const destination = adminLogin ? "/admin" : routeData().get("returnTo");
      await navigate(destination && destination.startsWith("/") ? destination : "/saved");
    } else if (kind === "password") {
      await send("/api/auth/change-password", "POST", { currentPassword: values.get("currentPassword"), newPassword: values.get("newPassword") });
      form.reset();
      if (message) message.textContent = "Your password has been changed. Other sessions have been signed out.";
      toast("Password updated. You’re signed in here.");
    } else if (kind === "profile") {
      const result = await send("/api/me", "PATCH", { name: values.get("name"), email: values.get("email") });
      app.user = result.user;
      if (message) message.textContent = "Your details are tucked away safely.";
      updateNav();
      toast("Your details have been updated.");
    } else if (kind === "contact") {
      const result = await send("/api/contact", "POST");
      form.reset();
      if (message) message.textContent = result.message;
    } else if (kind === "search") {
      const query = String(values.get("q") || "").trim();
      await navigate("/search?q=" + encodeURIComponent(query));
    } else if (kind === "admin") {
      let parsedData;
      try { parsedData = JSON.parse(String(values.get("data") || "{}")); }
      catch { throw new Error("The structured details need valid JSON. Check the quotes and commas."); }
      const collection = String(values.get("collection"));
      const id = String(values.get("id") || "");
      const uploaded = String(values.get("uploadedImage") || "");
      const image = uploaded || String(values.get("image") || "");
      const record = { slug: values.get("slug"), title: values.get("title"), subtitle: values.get("subtitle"), description: values.get("description"), image: image, imageAlt: values.get("imageAlt"), data: parsedData, published: values.has("published") };
      const result = await send("/api/admin/content/" + encodeURIComponent(collection) + (id ? "/" + encodeURIComponent(id) : ""), id ? "PUT" : "POST", record);
      toast(id ? "Your changes are saved." : "A fresh note for the notebook.");
      await refreshAdmin();
      const editor = $('input[name="id"]', $("#admin-root"));
      if (editor) paintAdmin(result.item.id);
    }
  } catch (error) {
    if (message) { message.textContent = error.message; message.classList.add("error"); }
    else toast(error.message, true);
  } finally {
    if (submit && submit.isConnected) { submit.disabled = false; submit.textContent = original; }
  }
}
function updateUploadPreview(file) {
  const preview = $(".admin-preview");
  if (!file || !preview) return;
  if (file.size > 5 * 1024 * 1024) { toast("Choose an image smaller than 5 MB.", true); return; }
  const local = URL.createObjectURL(file);
  preview.src = local;
  preview.hidden = false;
}
async function uploadAdminImage(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const preview = $(".admin-preview");
  if (preview) {
    const local = URL.createObjectURL(file);
    preview.src = local;
    preview.hidden = false;
  }
  const form = input.closest("form");
  const message = $("[data-form-message]", form);
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error("Choose an image smaller than 5 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG or WebP image.");
    const result = await fetchData("/api/admin/images", { method: "POST", headers: { "Content-Type": file.type }, body: file });
    $('input[name="uploadedImage"]', form).value = result.image;
    $('input[name="image"]', form).value = "";
    if (message) { message.classList.remove("error"); message.textContent = "Image uploaded. Save the note to publish the change."; }
    toast("Your image is ready in the Caffero library.");
  } catch (error) {
    if (message) { message.textContent = error.message; message.classList.add("error"); }
    else toast(error.message, true);
  }
}
async function removeContent(id) {
  const entry = app.adminItems.find((item) => item.id === Number(id));
  if (!entry) return;
  if (!window.confirm("Remove “" + entry.title + "” from the Caffero notebook? This also removes saved links to this note.")) return;
  try {
    await fetchData("/api/admin/content/" + encodeURIComponent(entry.collection) + "/" + encodeURIComponent(entry.id), { method: "DELETE" });
    toast("That note has been removed.");
    await refreshAdmin();
  } catch (error) { toast(error.message, true); }
}
async function updateMessage(id, status) {
  try {
    await fetchData("/api/admin/messages/" + encodeURIComponent(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: status }) });
    await refreshAdmin();
    toast("Inbox note marked " + status + ".");
  } catch (error) { toast(error.message, true); }
}
async function logOut() {
  try { await fetchData("/api/auth/logout", { method: "POST" }); } catch {}
  app.user = null;
  app.saved.clear();
  updateNav();
  toast("You’ve signed out. Have a lovely cup.");
  await navigate(urlPath() === "/admin" ? "/admin" : "/");
}

document.addEventListener("click", async (event) => {
  const themeToggle = event.target.closest("[data-theme-toggle]");
  if (themeToggle) { toggleTheme(); return; }
  const open = event.target.closest("[data-open-search]");
  if (open) { openSearch(); return; }
  const close = event.target.closest("[data-close-search]");
  if (close) { closeSearch(); return; }
  const routeLink = event.target.closest("a[href]");
  if (routeLink && routeLink.origin === location.origin && !routeLink.hasAttribute("download") && !routeLink.target && !routeLink.getAttribute("href").startsWith("#")) {
    event.preventDefault();
    await navigate(routeLink.pathname + routeLink.search + routeLink.hash);
    return;
  }
  const filter = event.target.closest("[data-method-filter]");
  if (filter) { app.methodFilter = filter.dataset.methodFilter; main.innerHTML = methodsPage(); updateCalculator(); updateSavedButtons(); observeReveal(); return; }
  const articleFilter = event.target.closest("[data-article-filter]");
  if (articleFilter) { app.articleFilter = articleFilter.dataset.articleFilter; main.innerHTML = coffeePage(); observeReveal(); return; }
  const drinkFilter = event.target.closest("[data-drink-filter]");
  if (drinkFilter) { app.drinkFilter = drinkFilter.dataset.drinkFilter; main.innerHTML = typesPage(); return; }
  const preset = event.target.closest("[data-ratio]");
  if (preset) {
    $("#calc-ratio").value = preset.dataset.ratio;
    $$(".preset-chip").forEach((chip) => chip.classList.toggle("active", chip === preset));
    updateCalculator();
    return;
  }
  const faqButton = event.target.closest("[data-accordion]");
  if (faqButton) {
    const wasOpen = faqButton.getAttribute("aria-expanded") === "true";
    faqButton.setAttribute("aria-expanded", String(!wasOpen));
    const panel = $("#" + CSS.escape(faqButton.getAttribute("aria-controls")));
    if (panel) panel.hidden = wasOpen;
    return;
  }
  const saved = event.target.closest("[data-favorite]");
  if (saved) { await toggleFavorite(saved.dataset.favorite, saved.dataset.slug); return; }
  const next = event.target.closest('[data-action="next-step"]');
  if (next) {
    const entry = app.content.methods.find((method) => urlPath() === "/brew/" + method.slug);
    const count = entry && entry.data.steps ? entry.data.steps.length : 0;
    if (next.dataset.finish) { app.step = 0; toast("Well brewed. Pour it, taste it, make it yours."); }
    else if (app.step < count - 1) { await showStep(app.step + 1); return; }
    else return;
    await showStep(0);
    return;
  }
  if (event.target.closest('[data-action="prev-step"]')) { await showStep(Math.max(0, app.step - 1)); return; }
  if (event.target.closest('[data-action="timer"]')) { startStepTimer(); return; }
  if (event.target.closest('[data-action="auth-toggle"]')) {
    app.authMode = app.authMode === "login" ? "register" : "login";
    const returnTo = routeData().get("returnTo");
    await navigate("/account" + (returnTo ? "?returnTo=" + encodeURIComponent(returnTo) : ""));
    return;
  }
  if (event.target.closest('[data-action="logout"]')) { await logOut(); return; }
  if (event.target.closest('[data-action="retry"]')) { app.content = null; app.user = null; await renderRoute(true); return; }
  if (event.target.closest('[data-action="new-content"]')) { paintAdmin(null); return; }
  const edit = event.target.closest("[data-edit-item]");
  if (edit) { paintAdmin(edit.dataset.editItem); $(".admin-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  const remove = event.target.closest("[data-delete-item]");
  if (remove) { await removeContent(remove.dataset.deleteItem); return; }
  const message = event.target.closest("[data-message-status]");
  if (message) { await updateMessage(message.dataset.messageId, message.dataset.messageStatus); return; }
  const quick = event.target.closest("[data-search-term]");
  if (quick) { $("#global-search").value = quick.dataset.searchTerm; await navigate("/search?q=" + encodeURIComponent(quick.dataset.searchTerm)); return; }
  const menuToggle = event.target.closest("#menu-toggle");
  if (menuToggle) {
    const menu = $("#mobile-nav");
    const openMenu = menu.hidden;
    menu.hidden = !openMenu;
    menuToggle.setAttribute("aria-expanded", String(openMenu));
    menuToggle.setAttribute("aria-label", openMenu ? "Close menu" : "Open menu");
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  await submitForm(form);
});
document.addEventListener("input", (event) => {
  if (event.target.matches("[data-calc]")) updateCalculator();
  if (event.target.matches("[data-guide]")) updateGuide();
  if (event.target.matches("#global-search")) {
    clearTimeout(searchDelay);
    const value = event.target.value;
    searchDelay = window.setTimeout(() => globalSearch(value), 170);
  }
  if (event.target.matches("#admin-search-input")) {
    const selection = $('[data-admin-collection]') ? $('[data-admin-collection]').value : "";
    app.adminFilter = selection;
    const focusedValue = event.target.value;
    paintAdmin();
    const search = $("#admin-search-input");
    if (search) { search.focus(); search.value = focusedValue; search.setSelectionRange(focusedValue.length, focusedValue.length); }
  }
});
document.addEventListener("change", async (event) => {
  if (event.target.matches("[data-guide]")) updateGuide();
  if (event.target.matches("[data-admin-upload]")) await uploadAdminImage(event.target);
  if (event.target.matches("[data-admin-collection]")) {
    app.adminFilter = event.target.value;
    paintAdmin();
  }
});
document.addEventListener("keydown", (event) => {
  const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (shortcut) { event.preventDefault(); openSearch(); }
  if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { event.preventDefault(); openSearch(); }
});
window.addEventListener("popstate", async () => {
  app.step = 0;
  stopTimer();
  await renderRoute(false);
});
const searchDialog = $("#search-dialog");
if (searchDialog) searchDialog.addEventListener("click", (event) => {
  if (event.target === searchDialog) closeSearch();
});
updateCopyright();
syncThemeControls();
renderRoute(true);
