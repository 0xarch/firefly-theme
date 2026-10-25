// Sidebar widgets: site statistics, announcement banner and collapsible
// tag/category lists.
import { CFG, $, $$ } from "./core.js";

/* ---------- site statistics ---------- */
/* The running-days / last-update rows are date driven, so they are computed
   in the browser and refreshed after every pjax navigation. */
function initStats() {
  var ss = CFG.siteStats || {};
  var DAY = 86400000;
  var now = Date.now();
  if (ss.startDate) {
    var start = new Date(ss.startDate);
    if (!isNaN(start.getTime())) {
      var days = Math.max(0, Math.ceil((now - start.getTime()) / DAY));
      $$('[data-stat-id="running-days"]').forEach(function (el) { el.textContent = String(days); });
    }
  }
  if (ss.lastPostDate) {
    var last = new Date(ss.lastPostDate);
    if (!isNaN(last.getTime())) {
      var ago = Math.floor((now - last.getTime()) / DAY);
      $$('[data-stat-id="last-update"]').forEach(function (el) {
        el.textContent = ago <= 0 ? (ss.today || "today") : String(ago);
        var suffix = $('[data-stat-suffix="last-update"]');
        if (suffix) suffix.hidden = ago <= 0;
      });
    }
  }
}

/* ---------- announcement ---------- */
function initAnnouncement() {
  var box = $("#announcement");
  if (!box) return;
  try {
    if (localStorage.getItem("announcement-closed") === "1") { box.style.display = "none"; }
  } catch (e) {}
  var btn = $(".announcement-close", box);
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = "1";
    btn.addEventListener("click", function () {
      box.style.display = "none";
      try { localStorage.setItem("announcement-closed", "1"); } catch (e) {}
    });
  }
}

/* ---------- collapsible widgets ---------- */
/* A tag/category list longer than the configured threshold starts clipped to
   7.5rem; the button under it expands it in place (upstream's WidgetLayout).
   pjax swaps the sidebar, so this is re-run from applyPage(). */
function initWidgetCollapse() {
  $$(".widget-expand").forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function () {
      var card = btn.closest(".widget-card");
      var box = card && card.querySelector(".widget-collapse");
      if (!box) return;
      var expanded = btn.getAttribute("data-expanded") !== "true";
      btn.setAttribute("data-expanded", expanded ? "true" : "false");
      btn.setAttribute("aria-expanded", expanded ? "true" : "false");
      box.classList.toggle("collapsed", !expanded);
      var label = expanded ? btn.dataset.less : btn.dataset.more;
      btn.setAttribute("aria-label", label || "");
      btn.title = label || "";
      var text = btn.querySelector(".widget-expand-text");
      if (text) text.textContent = label || "";
      var more = btn.querySelector(".widget-expand-more");
      var less = btn.querySelector(".widget-expand-less");
      if (more) more.hidden = expanded;
      if (less) less.hidden = !expanded;
    });
  });
}


export { initStats, initAnnouncement, initWidgetCollapse };
