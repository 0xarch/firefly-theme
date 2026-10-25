// In-page fragment links (TOC, footnotes, heading permalinks): scroll smoothly
// and rewrite the hash without a history entry; hand missing targets to the
// segment loader.
import { findAnchor, segmentHash, state } from "./core.js";

// Fragment links (TOC items, footnotes, heading permalinks, …) scroll
// smoothly and rewrite the url hash without adding a history entry. A target
// that sits in a long-post fragment not spliced in yet is handed to the
// segment loader, which scrolls once that fragment arrives.
function jumpToAnchor(id) {
  if (!id) return;
  var target = findAnchor(id);
  if (target) {
    state.anchorWait = null;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    state.anchorWait = id;
  }
  history.replaceState(history.state, "", "#" + id);
}

function initAnchors() {
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a");
    if (!a || a.target || a.hasAttribute("download")) return;
    // the skip link must keep moving keyboard focus; a scroll does not
    if (a.classList.contains("skip-link")) return;
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) !== "#") return;
    var id = segmentHash(href);
    if (!id) return;
    e.preventDefault();
    jumpToAnchor(id);
  });
}


export { initAnchors };
