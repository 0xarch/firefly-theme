// Giscus comments: lazy-load the iframe and forward theme changes.
import { $ } from "./core.js";

function loadGiscus() {
  var host = $(".giscus");
  if (!host || host.dataset.loaded) return;
  var repo = host.getAttribute("data-repo");
  var repoId = host.getAttribute("data-repo-id");
  if (!repo || !repoId) return;
  host.dataset.loaded = "1";
  var s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  s.async = true;
  s.crossOrigin = "anonymous";
  ["repo", "repo-id", "category", "category-id", "mapping", "reactions-enabled", "input-position", "theme", "lang", "loading"].forEach(function (k) {
    var v = host.getAttribute("data-" + k);
    if (v !== null) s.setAttribute("data-" + k, v);
  });
  var dark = document.documentElement.classList.contains("dark");
  s.setAttribute("data-theme", dark ? "dark" : "light");
  host.appendChild(s);
}
// giscus renders in an iframe; its theme can only be changed by message
function updateGiscusTheme() {
  var frame = $("iframe.giscus-frame");
  if (!frame || !frame.contentWindow) return;
  var dark = document.documentElement.classList.contains("dark");
  frame.contentWindow.postMessage(
    { giscus: { setConfig: { theme: dark ? "dark" : "light" } } },
    "https://giscus.app",
  );
}


export { loadGiscus, updateGiscusTheme };
