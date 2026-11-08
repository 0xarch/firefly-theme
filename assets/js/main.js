// Theme entry point: wire the modules and start them once the DOM is ready.
// Browsers load the imported modules automatically.
import { initCodeSchemeToggle, initDisplaySettings, initSystemThemeWatch, initThemeToggle } from "./theme.js";
import { initBackToTop, initDrawer, initDropdowns, initNavbar } from "./navbar.js";
import { bindTocFabDismiss } from "./toc.js";
import { initAnchors } from "./anchors.js";
import { initSegments } from "./segments.js";
import { initPage } from "./page.js";
import { initPjax } from "./pjax.js";

/* ---------- boot ---------- */
function init() {
  initThemeToggle();
  initSystemThemeWatch();
  initDisplaySettings();
  initCodeSchemeToggle();
  initNavbar();
  initBackToTop();
  initDrawer();
  initDropdowns();
  initPage();
  initAnchors();
  bindTocFabDismiss();
  initSegments(location.href);
  initPjax();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
