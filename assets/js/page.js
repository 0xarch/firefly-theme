// Page-bound modules: run once on load and again after every pjax swap.
// Keeping the list in one place stops the first load and a navigation from
// drifting apart as modules are added.
import { initNavActive } from "./navbar.js";
import { buildToc, initTocFab, initTocToggle } from "./toc.js";
import { initTypewriter } from "./banner.js";
import { initAnnouncement, initStats, initWidgetCollapse } from "./widgets.js";
import { initSearch } from "./search.js";
import { initCodeCopy } from "./code-copy.js";
import { initTabs } from "./tabs.js";
import { initMermaid } from "./mermaid.js";
import { loadGiscus } from "./comments.js";
import { initPagination } from "./pagination.js";
import { initRecent } from "./recent.js";
import { initDynamic } from "./dynamic.js";

function initPage() {
  initNavActive();
  initTocToggle();
  buildToc();
  initTocFab();
  initTypewriter();
  initAnnouncement();
  initWidgetCollapse();
  initSearch();
  initCodeCopy();
  initTabs();
  initMermaid();
  initStats();
  loadGiscus();
  initPagination();
  initRecent();
  initDynamic();
}

export { initPage };
