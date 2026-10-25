// Theme entry point: wire the modules and start them once the DOM is ready.
// Browsers load the imported modules automatically.
import { initDisplaySettings, initSystemThemeWatch, initThemeToggle } from "./theme.js";
import { initBackToTop, initDrawer, initDropdowns, initNavActive, initNavbar } from "./navbar.js";
import { initTypewriter } from "./banner.js";
import { initAnnouncement, initStats, initWidgetCollapse } from "./widgets.js";
import { initSearch } from "./search.js";
import { bindTocFabDismiss, buildToc, initTocFab, initTocToggle } from "./toc.js";
import { initAnchors } from "./anchors.js";
import { initSegments } from "./segments.js";
import { initCodeCopy } from "./code-copy.js";
import { loadGiscus } from "./comments.js";
import { initPagination } from "./pagination.js";
import { initRecent } from "./recent.js";
import { initDynamic } from "./dynamic.js";
import { initPjax } from "./pjax.js";

/* ---------- boot ---------- */
function init() {
  initThemeToggle();
  initSystemThemeWatch();
  initDisplaySettings();
  initNavbar();
  initBackToTop();
  initDrawer();
  initDropdowns();
  initNavActive();
  initTypewriter();
  initAnnouncement();
  initWidgetCollapse();
  initSearch();
  initTocToggle();
  initAnchors();
  buildToc();
  initTocFab();
  bindTocFabDismiss();
  initSegments(location.href);
  initCodeCopy();
  initStats();
  loadGiscus();
  initPagination();
  initRecent();
  initDynamic();
  initPjax();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
