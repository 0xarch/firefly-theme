// Navbar behaviour: hide-on-scroll, reading progress, back-to-top, mobile
// drawer, dropdown menus and the active navigation link.
import { $, $$ } from "./core.js";
import { spy } from "./toc.js";

/* The sticky sidebar columns are anchored under the navbar; when the bar
   slides away (dynamic mode) their tops must rise with it. The bar's
   `hidden-up` class is the single source of truth, so mirror it onto <body>
   where the CSS can reach it (body.navbar-hidden). */
function syncNavbarHidden(nav) {
  var el = nav || document.getElementById("navbar");
  document.body.classList.toggle("navbar-hidden", !!(el && el.classList.contains("hidden-up")));
}

function initNavbar() {
  var nav = $("#navbar");
  if (!nav) return;
  var mode = document.body.getAttribute("data-navbar-mode") || "dynamic";
  var lastY = window.pageYOffset;
  var ticking = false;

  function update() {
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle("scrolled", y > 8);
    if (mode === "dynamic") {
      if (y > lastY && y > 200) nav.classList.add("hidden-up");
      else nav.classList.remove("hidden-up");
    }
    syncNavbarHidden(nav);
    var bar = $("#progress-bar");
    if (bar) {
      var pct = max > 0 ? (y / max) * 100 : 0;
      bar.style.width = pct + "%";
      bar.classList.toggle("active", y > 8 && pct < 100);
    }
    var top = $("#back-to-top");
    if (top) top.classList.toggle("show", y > 400);
    spy();
    lastY = y;
    ticking = false;
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

/* Keeps the reading progress bar in sync with pjax: it exists only on post
   pages, so it is created/removed around a navigation. */
function syncProgressBar() {
  var isPost = document.body.getAttribute("data-view") === "post";
  var bar = document.getElementById("progress-bar");
  if (isPost && !bar) {
    bar = document.createElement("div");
    bar.id = "progress-bar";
    bar.setAttribute("aria-hidden", "true");
    document.body.insertBefore(bar, document.body.firstChild);
  } else if (!isPost && bar && bar.parentNode) {
    bar.parentNode.removeChild(bar);
    bar = null;
  }
  if (bar) { bar.style.width = "0"; bar.classList.remove("active"); }
}

function initBackToTop() {
  var btn = $("#back-to-top");
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- mobile drawer ---------- */
function openDrawer(open) {
  var panel = $("#nav-menu-panel");
  var sw = $("#nav-menu-switch");
  if (!panel) return;
  panel.classList.toggle("open", open);
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  if (sw) sw.setAttribute("aria-expanded", open ? "true" : "false");
  document.documentElement.style.overflow = open ? "hidden" : "";
}
function initDrawer() {
  var sw = $("#nav-menu-switch");
  var panel = $("#nav-menu-panel");
  var close = $("#nav-menu-close");
  if (sw && !sw.dataset.bound) {
    sw.dataset.bound = "1";
    sw.addEventListener("click", function () { openDrawer(!panel.classList.contains("open")); });
  }
  if (close && !close.dataset.bound) {
    close.dataset.bound = "1";
    close.addEventListener("click", function () { openDrawer(false); });
  }
  if (panel && !panel.dataset.bound) {
    panel.dataset.bound = "1";
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) openDrawer(false);
    });
  }
}

function initDropdowns() {
  $$(".nav-dropdown").forEach(function (dd) {
    if (dd.dataset.bound) return;
    dd.dataset.bound = "1";
    var toggle = $(".nav-dropdown-toggle", dd);
    if (!toggle) return;
    function setOpen(open) {
      dd.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      setOpen(!dd.classList.contains("open"));
    });
    // A menu item is a navigation target, not a request to pin the menu open.
    // Closing here also releases the focus that a click (or Enter) leaves on
    // the link, so the panel disappears once the pointer leaves.
    dd.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".nav-dropdown-item")) setOpen(false);
    });
    // Keyboard users open the menu with Enter; closing when focus leaves
    // keeps `.open` from outliving the visit the way `:focus-within` did.
    dd.addEventListener("focusout", function (e) {
      if (e.relatedTarget && dd.contains(e.relatedTarget)) return;
      setOpen(false);
    });
  });
  document.addEventListener("click", function (e) {
    $$(".nav-dropdown.open").forEach(function (dd) {
      if (!dd.contains(e.target)) {
        dd.classList.remove("open");
        var t = $(".nav-dropdown-toggle", dd);
        if (t) t.setAttribute("aria-expanded", "false");
      }
    });
    $$(".theme-mode.open").forEach(function (tm) {
      if (!tm.contains(e.target)) {
        tm.classList.remove("open");
        var b = $("#theme-toggle");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    $$(".theme-mode.open, .nav-dropdown.open").forEach(function (el) {
      el.classList.remove("open");
      var t = $("[aria-expanded='true']", el);
      if (t) t.setAttribute("aria-expanded", "false");
    });
    var b = $("#theme-toggle");
    if (b) b.setAttribute("aria-expanded", "false");
  });
}

function initNavActive() {
  var path = location.pathname;
  $$(".nav-item, .nav-drawer-item").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (!href || href === "#" || /^https?:/.test(href)) return;
    var isHome = href === "/";
    var active = isHome ? (path === "/" || path === "") : path.indexOf(href) === 0;
    a.classList.toggle("active", active);
  });
}

export { initNavbar, syncNavbarHidden, syncProgressBar, initBackToTop, initDrawer, initDropdowns, initNavActive };
