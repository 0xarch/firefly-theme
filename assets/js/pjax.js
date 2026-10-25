// Pjax navigation: swap the content panel, re-run the page-bound modules and
// keep hash-only history entries from re-fetching the page.
import { CFG, findAnchor, segmentHash, state } from "./core.js";
import { initNavActive, syncNavbarHidden, syncProgressBar } from "./navbar.js";
import { buildToc, initTocToggle, initTocFab } from "./toc.js";
import { initTypewriter } from "./banner.js";
import { initAnnouncement, initStats, initWidgetCollapse } from "./widgets.js";
import { initSearch } from "./search.js";
import { initSegments } from "./segments.js";
import { initCodeCopy } from "./code-copy.js";
import { loadGiscus } from "./comments.js";
import { initPagination } from "./pagination.js";
import { hideHeatTip, initRecent } from "./recent.js";
import { initDynamic } from "./dynamic.js";

function applyPage(doc, url) {
  document.title = doc.title;
  const html = document.documentElement;
  ["data-wallpaper-mode"].forEach(function (a) {
    const v = doc.documentElement.getAttribute(a);
    if (v === null) html.removeAttribute(a); else html.setAttribute(a, v);
  });
  const body = document.body;
  body.className = doc.body.className;
  ["data-view", "data-navbar-mode", "data-sidebar-position", "data-tablet-sidebar"].forEach(function (a) {
    const v = doc.body.getAttribute(a);
    if (v === null) body.removeAttribute(a); else body.setAttribute(a, v);
  });
  // the navbar survives pjax, so keep its home/non-home flag in sync (the
  // mobile banner glass is only used on the home page)
  const nav = document.getElementById("navbar");
  if (nav) nav.setAttribute("data-is-home", body.getAttribute("data-view") === "home" ? "true" : "false");
  // the body class is reset with className above; the navbar element survives
  // pjax, so re-derive the sidebar offset state from it
  syncNavbarHidden(nav);

  const anchor = document.getElementById("back-to-top");
  const oldWall = document.getElementById("wallpaper-wrapper");
  const oldPanel = document.getElementById("content-panel");
  if (oldWall) oldWall.remove();
  if (oldPanel) oldPanel.remove();
  const frag = document.createDocumentFragment();
  const newWall = doc.getElementById("wallpaper-wrapper");
  const newPanel = doc.getElementById("content-panel");
  if (newWall) frag.appendChild(document.importNode(newWall, true));
  if (newPanel) frag.appendChild(document.importNode(newPanel, true));
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(frag, anchor);
  else body.appendChild(frag);

  initNavActive();
  initTocToggle();
  buildToc();
  initTocFab();
  initTypewriter();
  initAnnouncement();
  initWidgetCollapse();
  initSearch();
  initCodeCopy();
  initStats();
  loadGiscus();
  initPagination();
  initRecent();
  initDynamic();
  hideHeatTip();
  syncProgressBar();
  window.scrollTo(0, 0);
  // a swap does not replay the browser's hash navigation: land on the target
  // now, or let the segment loader carry the link into a later fragment
  const hash = segmentHash(url);
  if (hash) {
    const target = findAnchor(hash);
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
  }
  initSegments(url);
}

function navigate(url, push) {
  const panel = document.getElementById("content-panel");
  if (panel) panel.classList.add("pjax-leaving");
  fetch(url, { headers: { "X-Requested-With": "pjax" } })
    .then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      const type = r.headers.get("content-type") || "";
      if (type.indexOf("html") === -1) throw new Error("not html");
      return r.text();
    })
    .then(function (text) {
      const doc = new DOMParser().parseFromString(text, "text/html");
      applyPage(doc, url);
      if (push) history.pushState({ pjax: true }, "", url);
      pjaxKey = pageKey(url);
    })
    .catch(function () { window.location.href = url; });
}

function sameOriginLink(a) {
  if (a.target && a.target !== "_self" && a.target !== "") return false;
  if (a.hasAttribute("download")) return false;
  if (a.hasAttribute("data-no-pjax")) return false;
  const href = a.getAttribute("href") || "";
  if (!href || href.charAt(0) === "#") return false;
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
  let url;
  try { url = new URL(href, location.href); } catch (e) { return false; }
  if (url.origin !== location.origin) return false;
  if (url.pathname === location.pathname && url.search === location.search) return false;
  if (url.pathname.indexOf("/assets/") === 0) return false;
  if (!/\/$|\/[^./]*$|\.html$/.test(url.pathname) && url.pathname !== "/") return false;
  return true;
}

// pathname+search identifies a page; the hash is a position inside it
function pageKey(url) {
  const u = new URL(url, location.href);
  return u.pathname + u.search;
}

let pjaxKey = null;

function initPjax() {
  if (!CFG.pjax) return;
  window.__fireflyNavigate = navigate;
  pjaxKey = pageKey(location.href);
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a");
    if (!a || !sameOriginLink(a)) return;
    e.preventDefault();
    navigate(a.href, true);
  });
  window.addEventListener("popstate", function () {
    // a fragment entry changes only the hash: the browser has already moved
    // to the anchor, so re-fetching the page would rebuild the article and
    // throw the reader back to the top
    if (pageKey(location.href) === pjaxKey) {
      const hash = segmentHash(location.href);
      if (hash && !findAnchor(hash)) state.anchorWait = hash;
      return;
    }
    navigate(location.href, false);
  });
}

export { initPjax };
