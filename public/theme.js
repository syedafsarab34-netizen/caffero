(() => {
  const root = document.documentElement;
  let preference = "";
  try { preference = localStorage.getItem("caffero-theme") || ""; } catch {}
  const valid = preference === "dark" || preference === "light";
  root.dataset.theme = valid ? preference : (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.content = root.dataset.theme === "dark" ? "#161916" : "#f6f4ee";
})();
