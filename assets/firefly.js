/* ==========================================================================
   Ngwg Firefly theme runtime.
   Original implementation: theme toggle, dynamic navbar, mobile drawer,
   banner typewriter, TOC + scrollspy, back-to-top, progress bar, long-post
   segment loader, pjax navigation and the giscus hook point.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.__FIREFLY__ || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- theme toggle ---------- */
  function applyDark(dark) {
    document.documentElement.classList.toggle("dark", dark);
    document.dispatchEvent(new CustomEvent("firefly:theme", { detail: { dark: dark } }));
  }
  function currentDark() {
    return document.documentElement.classList.contains("dark");
  }
  function initThemeToggle() {
    var btn = $("#theme-toggle");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function () {
      var dark = !currentDark();
      applyDark(dark);
      try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
      loadGiscus();
      updateGiscusTheme();
    });
  }

  /* ---------- navbar ---------- */
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
      var bar = $("#progress-bar");
      if (bar) {
        var pct = max > 0 ? (y / max) * 100 : 0;
        bar.style.width = pct + "%";
        bar.classList.toggle("active", y > 50 && pct < 100);
      }
      var top = $("#back-to-top");
      if (top) top.classList.toggle("show", y > 400);
      spy(y);
      lastY = y;
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
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
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        var open = dd.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
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

  /* ---------- banner typewriter ---------- */
  var twTimer = null;
  function initTypewriter() {
    var el = $("#banner-subtitle-text");
    if (twTimer) { clearTimeout(twTimer); twTimer = null; }
    if (!el) return;
    var subs = CFG.bannerSubtitles || [];
    if (!subs.length) return;
    var tw = CFG.typewriter || {};
    if (tw.enable === false) {
      el.textContent = subs[Math.floor(Math.random() * subs.length)];
      return;
    }
    var speed = tw.speed || 100, del = tw.deleteSpeed || 50, pause = tw.pauseTime || 2000;
    var i = 0, ch = 0, deleting = false;
    function tick() {
      var text = subs[i];
      if (!deleting) {
        ch++;
        el.textContent = text.slice(0, ch);
        if (ch >= text.length) { deleting = true; twTimer = setTimeout(tick, pause); return; }
        twTimer = setTimeout(tick, speed);
      } else {
        ch--;
        el.textContent = text.slice(0, ch);
        if (ch <= 0) { deleting = false; i = (i + 1) % subs.length; twTimer = setTimeout(tick, speed); return; }
        twTimer = setTimeout(tick, del);
      }
    }
    el.textContent = "";
    twTimer = setTimeout(tick, 300);
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

  /* ---------- TOC ---------- */
  var spyHeads = [];
  function buildToc() {
    var body = $("#post-body");
    var list = $(".toc-list");
    var card = $("#toc");
    if (!body || !list) return;
    var heads = $$("h2, h3, h4", body);
    var aside = card && card.closest ? card.closest(".sidebar") : null;
    list.textContent = "";
    if (!heads.length) {
      if (card) card.style.display = "none";
      if (aside) aside.classList.add("is-empty");
      spyHeads = [];
      return;
    }
    if (card) card.style.display = "";
    if (aside) aside.classList.remove("is-empty");
    heads.forEach(function (hh, idx) {
      if (!hh.id) hh.id = "h-" + idx + "-" + (hh.textContent || "").trim().slice(0, 12).replace(/\s+/g, "-");
      var a = document.createElement("a");
      a.className = "toc-item level-" + hh.tagName.charAt(1);
      a.href = "#" + hh.id;
      var span = document.createElement("span");
      span.className = "toc-label";
      span.textContent = hh.textContent;
      a.appendChild(span);
      a.addEventListener("click", function (e) {
        e.preventDefault();
        hh.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#" + hh.id);
      });
      list.appendChild(a);
    });
    spyHeads = heads;
    spy(window.pageYOffset);
  }
  function spy(y) {
    if (!spyHeads.length) return;
    var items = $$(".toc-list .toc-item");
    if (!items.length) return;
    var offset = 120;
    var current = -1;
    for (var i = 0; i < spyHeads.length; i++) {
      if (spyHeads[i].getBoundingClientRect().top - offset <= 0) current = i;
      else break;
    }
    items.forEach(function (it, i) { it.classList.toggle("visible", i === current); });
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

  /* ---------- long-post segments ---------- */
  var segScrollHandler = null;
  function initSegments() {
    var body = $("#post-body");
    var loader = $(".seg-loading");
    if (segScrollHandler) { window.removeEventListener("scroll", segScrollHandler); segScrollHandler = null; }
    if (!body) return;
    if (!body.querySelector(".post-seg-end[data-next]")) {
      if (loader) loader.remove();
      return;
    }
    var loading = false;
    function near(el) {
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight + 400;
    }
    function loadNext() {
      var marker = body.querySelector(".post-seg-end[data-next]");
      if (!marker || loading || !near(marker)) return;
      loading = true;
      if (loader) loader.hidden = false;
      var url;
      try { url = new URL(marker.getAttribute("data-next"), location.href).href; }
      catch (e) { loading = false; return; }
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      }).then(function (text) {
        // splice the fragment in where the marker sits so that any markers or
        // headings it carries land inside #post-body (TOC + next step see them)
        marker.insertAdjacentHTML("beforebegin", text);
        marker.remove();
        loading = false;
        if (loader) loader.hidden = true;
        buildToc();
        if (!body.querySelector(".post-seg-end[data-next]") && loader) {
          loader.remove();
          window.removeEventListener("scroll", segScrollHandler);
          segScrollHandler = null;
        } else {
          setTimeout(loadNext, 0);
        }
      }).catch(function () {
        loading = false;
        if (loader) loader.hidden = true;
      });
    }
    segScrollHandler = loadNext;
    window.addEventListener("scroll", segScrollHandler, { passive: true });
    loadNext();
  }

  /* ---------- code copy ---------- */
  function initCodeCopy() {
    $$(".markdown pre").forEach(function (pre) {
      if (pre.dataset.copy) return;
      pre.dataset.copy = "1";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.textContent = (CFG.i18n && CFG.i18n.copy) || "copy";
      btn.addEventListener("click", function () {
        var code = pre.querySelector("code");
        var text = code ? code.textContent : pre.textContent;
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = (CFG.i18n && CFG.i18n.copied) || "copied";
          setTimeout(function () { btn.textContent = (CFG.i18n && CFG.i18n.copy) || "copy"; }, 1500);
        });
      });
      pre.appendChild(btn);
    });
  }

  /* ---------- giscus ---------- */
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

  /* ---------- pjax ---------- */
  function applyPage(doc, url) {
    document.title = doc.title;
    var html = document.documentElement;
    ["data-wallpaper-mode"].forEach(function (a) {
      var v = doc.documentElement.getAttribute(a);
      if (v === null) html.removeAttribute(a); else html.setAttribute(a, v);
    });
    var body = document.body;
    body.className = doc.body.className;
    ["data-view", "data-navbar-mode", "data-sidebar-position"].forEach(function (a) {
      var v = doc.body.getAttribute(a);
      if (v === null) body.removeAttribute(a); else body.setAttribute(a, v);
    });
    // the navbar survives pjax, so keep its home/non-home flag in sync (the
    // mobile banner glass is only used on the home page)
    var nav = document.getElementById("navbar");
    if (nav) nav.setAttribute("data-is-home", body.getAttribute("data-view") === "home" ? "true" : "false");

    var anchor = document.getElementById("back-to-top");
    var oldWall = document.getElementById("wallpaper-wrapper");
    var oldPanel = document.getElementById("content-panel");
    if (oldWall) oldWall.remove();
    if (oldPanel) oldPanel.remove();
    var frag = document.createDocumentFragment();
    var newWall = doc.getElementById("wallpaper-wrapper");
    var newPanel = doc.getElementById("content-panel");
    if (newWall) frag.appendChild(document.importNode(newWall, true));
    if (newPanel) frag.appendChild(document.importNode(newPanel, true));
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(frag, anchor);
    else body.appendChild(frag);

    initNavActive();
    initTocToggle();
    buildToc();
    initSegments();
    initTypewriter();
    initAnnouncement();
    initCodeCopy();
    loadGiscus();
    window.scrollTo(0, 0);
  }

  function navigate(url, push) {
    var panel = document.getElementById("content-panel");
    if (panel) panel.classList.add("pjax-leaving");
    fetch(url, { headers: { "X-Requested-With": "pjax" } })
      .then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        var type = r.headers.get("content-type") || "";
        if (type.indexOf("html") === -1) throw new Error("not html");
        return r.text();
      })
      .then(function (text) {
        var doc = new DOMParser().parseFromString(text, "text/html");
        applyPage(doc, url);
        if (push) history.pushState({ pjax: true }, "", url);
      })
      .catch(function () { window.location.href = url; });
  }

  function sameOriginLink(a) {
    if (a.target && a.target !== "_self" && a.target !== "") return false;
    if (a.hasAttribute("download")) return false;
    if (a.hasAttribute("data-no-pjax")) return false;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    var url;
    try { url = new URL(href, location.href); } catch (e) { return false; }
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    if (url.pathname.indexOf("/assets/") === 0) return false;
    if (!/\/$|\/[^./]*$|\.html$/.test(url.pathname) && url.pathname !== "/") return false;
    return true;
  }

  function initPjax() {
    if (!CFG.pjax) return;
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a");
      if (!a || !sameOriginLink(a)) return;
      e.preventDefault();
      navigate(a.href, true);
    });
    window.addEventListener("popstate", function () {
      navigate(location.href, false);
    });
  }

  /* ---------- boot ---------- */
  function init() {
    initThemeToggle();
    initNavbar();
    initBackToTop();
    initDrawer();
    initDropdowns();
    initNavActive();
    initTypewriter();
    initAnnouncement();
    initTocToggle();
    buildToc();
    initSegments();
    initCodeCopy();
    loadGiscus();
    initPjax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
