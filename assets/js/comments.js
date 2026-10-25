// Giscus comments: lazy-load the iframe and forward theme changes.
import { $ } from "./core.js";

function loadGiscus() {
  const host = $(".giscus");
  if (!host || host.dataset.loaded) return;
  const repo = host.getAttribute("data-repo");
  const repoId = host.getAttribute("data-repo-id");
  if (!repo || !repoId) return;
  host.dataset.loaded = "1";
  const s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true;
  s.crossOrigin = "anonymous";
  ["repo", "repo-id", "category", "category-id", "mapping", "reactions-enabled", "input-position", "theme", "lang", "loading"].forEach(function (k) {
    const v = host.getAttribute("data-" + k);
    if (v !== null) s.setAttribute("data-" + k, v);
  });
  const dark = document.documentElement.classList.contains("dark");
  s.setAttribute("data-theme", dark ? "dark" : "light");
  host.appendChild(s);
}
// giscus renders in an iframe; its theme can only be changed by message
function updateGiscusTheme() {
  const frame = $("iframe.giscus-frame");
  if (!frame || !frame.contentWindow) return;
  const dark = document.documentElement.classList.contains("dark");
  frame.contentWindow.postMessage(
    { giscus: { setConfig: { theme: dark ? "dark" : "light" } } },
    "https://giscus.app",
  );
}


export { loadGiscus, updateGiscusTheme };
