// Table of contents: build the heading lists, track the active heading and
// drive the floating panel on narrow viewports.
import { $, $$ } from "./core.js";

var spyHeads = [];
function tocLink(heading) {
  var a = document.createElement("a");
  a.className = "toc-item level-" + heading.tagName.charAt(1);
  a.href = "#" + heading.id;
  var label = document.createElement("span");
  label.className = "toc-label";
  label.textContent = heading.textContent;
  a.appendChild(label);
  return a;
}
function buildToc() {
  var body = $("#post-body");
  var lists = $$(".toc-list");
  var card = $("#toc");
  if (!body || !lists.length) return;
  var heads = $$("h2, h3, h4", body);
  lists.forEach(function (list) { list.textContent = ""; });
  if (card) card.style.display = heads.length ? "" : "none";
  heads.forEach(function (hh, idx) {
    if (!hh.id) hh.id = "h-" + idx + "-" + (hh.textContent || "").trim().slice(0, 12).replace(/\s+/g, "-");
    // the sidebar card and the floating panel list the same headings
    lists.forEach(function (list) { list.appendChild(tocLink(hh)); });
  });
  spyHeads = heads;
  spy();
  syncTocFab();
}
function spy() {
  if (!spyHeads.length) return;
  var lists = $$(".toc-list");
  if (!lists.length) return;
  var offset = 120;
  var current = -1;
  for (var i = 0; i < spyHeads.length; i++) {
    if (spyHeads[i].getBoundingClientRect().top - offset <= 0) current = i;
    else break;
  }
  // the card and the floating panel hold the same headings in the same order,
  // so each list marks its own copy of the active one
  lists.forEach(function (list) {
    $$(".toc-item", list).forEach(function (it, i) { it.classList.toggle("visible", i === current); });
  });
}
function initTocToggle() {
  var card = $("#toc");
  var btn = card && $(".toc-toggle", card);
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", function () {
    var collapsed = card.classList.toggle("collapsed");
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  });
}

/* ---------- floating TOC (narrow viewports) ---------- */
function tocFabEls() {
  var wrap = document.getElementById("toc-fab");
  return wrap ? { wrap: wrap, btn: $(".toc-fab", wrap), panel: document.getElementById("toc-fab-panel") } : null;
}
function setTocFabOpen(open) {
  var f = tocFabEls();
  if (!f) return;
  f.wrap.classList.toggle("open", open);
  f.btn.setAttribute("aria-expanded", open ? "true" : "false");
}
/* The button stands in for the card only while the card is out of view —
   upstream's rule, read from the geometry so single-side layouts stay
   honest. The column folds away when the card was its only widget. */
function syncTocFab() {
  var card = $("#toc");
  var items = $$(".toc-list .toc-item").length;
  var aside = card && card.closest ? card.closest(".sidebar") : null;
  var rect = card ? card.getBoundingClientRect() : null;
  var narrow = !!(window.matchMedia && window.matchMedia("(max-width: 1279px)").matches);
  if (aside) aside.classList.toggle("is-empty", items === 0 || (narrow && aside.children.length === 1));
  var f = tocFabEls();
  if (!f) return;
  f.wrap.hidden = document.body.getAttribute("data-view") !== "post" || !items ||
    (!!rect && rect.width > 0 && rect.height > 0);
  if (f.wrap.hidden) setTocFabOpen(false);
}
function initTocFab() {
  var f = tocFabEls();
  if (!f) return;
  if (!f.btn.dataset.bound) {
    f.btn.dataset.bound = "1";
    f.btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setTocFabOpen(!f.wrap.classList.contains("open"));
    });
    f.panel.addEventListener("click", function (e) {
      // a heading link closes the panel; other clicks stay "inside"
      if (e.target.closest("a")) setTocFabOpen(false);
      else e.stopPropagation();
    });
  }
  syncTocFab();
}
/* dismissal handlers: bound once, they outlive pjax swaps */
function bindTocFabDismiss() {
  document.addEventListener("click", function (e) {
    var wrap = document.getElementById("toc-fab");
    if (wrap && wrap.classList.contains("open") && !wrap.contains(e.target)) setTocFabOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key === "Esc") setTocFabOpen(false);
  });
  window.addEventListener("resize", syncTocFab);
}


export { buildToc, spy, initTocToggle, initTocFab, bindTocFabDismiss };
