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

  /* ---------- theme mode (light / dark / system) ---------- */
  var THEME_MODES = ["light", "dark", "system"];
  var systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function storedMode() {
    var mode = null;
    try { mode = localStorage.getItem("theme"); } catch (e) {}
    if (THEME_MODES.indexOf(mode) === -1) mode = CFG.defaultMode;
    if (THEME_MODES.indexOf(mode) === -1) mode = "system";
    return mode;
  }
  function resolveDark(mode) {
    return mode === "dark" || (mode === "system" && !!systemQuery && systemQuery.matches);
  }
  function applyDark(dark) {
    document.documentElement.classList.toggle("dark", dark);
    document.dispatchEvent(new CustomEvent("firefly:theme", { detail: { dark: dark } }));
  }
  function syncThemeUi(mode) {
    $$(".theme-mode-item").forEach(function (item) {
      item.setAttribute("aria-checked", item.getAttribute("data-theme-mode") === mode ? "true" : "false");
    });
  }
  function setThemeMode(mode, persist) {
    if (THEME_MODES.indexOf(mode) === -1) return;
    applyDark(resolveDark(mode));
    if (persist) { try { localStorage.setItem("theme", mode); } catch (e) {} }
    syncThemeUi(mode);
    loadGiscus();
    updateGiscusTheme();
  }
  function initThemeToggle() {
    var wrap = $(".theme-mode");
    var btn = $("#theme-toggle");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        if (!wrap) return;
        var open = wrap.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    $$(".theme-mode-item").forEach(function (item) {
      if (item.dataset.bound) return;
      item.dataset.bound = "1";
      item.addEventListener("click", function () {
        setThemeMode(item.getAttribute("data-theme-mode"), true);
        if (wrap) wrap.classList.remove("open");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
    });
    syncThemeUi(storedMode());
  }
  function initSystemThemeWatch() {
    if (!systemQuery || !systemQuery.addEventListener) return;
    systemQuery.addEventListener("change", function () {
      if (storedMode() === "system") applyDark(resolveDark("system"));
    });
  }

  /* ---------- display settings (accent hue) ---------- */
  /* Upstream's "Display Settings" panel exposes many switches; only the accent
     hue is ported. It is stored next to the light/dark choice and written to
     `--hue` on <html>, which every oklch token derives from, so the whole
     palette — both modes — follows in place. */
  function initDisplaySettings() {
    var wrap = $(".display-settings");
    var panel = $("#display-setting");
    var btn = $("#display-settings-switch");
    var slider = $("#colorSlider");
    var value = $("#hue-value");
    var reset = $("#hue-reset");
    if (!wrap || !panel || !btn || !slider || wrap.dataset.bound) return;
    wrap.dataset.bound = "1";

    var def = Number(CFG.hue);
    if (!Number.isFinite(def)) def = 165;
    var stored = null;
    try { stored = localStorage.getItem("hue"); } catch (e) {}
    var hue = stored !== null && Number.isFinite(Number(stored)) && Number(stored) >= 0
      ? Math.round(Number(stored))
      : def;

    function paint(next) {
      hue = next;
      document.documentElement.style.setProperty("--hue", String(next));
      if (value) value.textContent = String(next);
      if (reset) reset.hidden = next === def;
      slider.value = String(next);
    }
    function save(next) {
      try { localStorage.setItem("hue", String(next)); } catch (e) {}
    }
    function open() {
      paint(hue);
      wrap.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
    }
    function close() {
      wrap.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function () {
      if (wrap.classList.contains("open")) close(); else open();
    });
    slider.addEventListener("input", function () {
      var next = Math.round(Number(slider.value));
      if (!Number.isFinite(next)) return;
      paint(next);
      save(next);
    });
    if (reset) {
      reset.addEventListener("click", function () {
        paint(def);
        save(def);
      });
    }
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    paint(hue);
  }

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

  /* ---------- navbar ---------- */
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

  /* ---------- search ---------- */
  /* The navbar renders a JSON index (title/date/tags/categories/excerpt) when
     `theme.search.enable` is on; this panel filters it in place. Every query
     token must match, title hits weigh most, results are highlighted and can be
     walked with the arrow keys. */
  function initSearch() {
    var overlay = $("#search-panel");
    if (!overlay || overlay.dataset.bound) return;
    overlay.dataset.bound = "1";

    var openBtn = $("#search-open");
    var closeBtn = $("#search-close");
    var input = $("#search-input");
    var list = $("#search-results");
    var empty = $("#search-empty");
    var hint = $("#search-hint");
    var indexEl = $("#search-index");
    var docs = [];
    try { docs = JSON.parse((indexEl && indexEl.textContent) || "[]"); } catch (e) { docs = []; }
    var limit = Number(CFG.searchLimit) || 12;
    var active = -1;
    var lastFocus = null;
    var timer = null;

    function tokensOf(q) {
      return String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
    }

    /* wrap every occurrence of the query tokens in <mark>, merging overlaps */
    function highlight(text, tokens) {
      var frag = document.createDocumentFragment();
      var str = String(text || "");
      if (!tokens.length) { frag.appendChild(document.createTextNode(str)); return frag; }
      var lower = str.toLowerCase();
      var ranges = [];
      tokens.forEach(function (tk) {
        var from = 0;
        var at = lower.indexOf(tk, from);
        while (at !== -1 && ranges.length < 40) {
          ranges.push([at, at + tk.length]);
          from = at + tk.length;
          at = lower.indexOf(tk, from);
        }
      });
      if (!ranges.length) { frag.appendChild(document.createTextNode(str)); return frag; }
      ranges.sort(function (a, b) { return a[0] - b[0]; });
      var merged = [];
      ranges.forEach(function (r) {
        var last = merged[merged.length - 1];
        if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
        else merged.push([r[0], r[1]]);
      });
      var pos = 0;
      merged.forEach(function (r) {
        if (r[0] > pos) frag.appendChild(document.createTextNode(str.slice(pos, r[0])));
        var mark = document.createElement("mark");
        mark.textContent = str.slice(r[0], r[1]);
        frag.appendChild(mark);
        pos = r[1];
      });
      if (pos < str.length) frag.appendChild(document.createTextNode(str.slice(pos)));
      return frag;
    }

    function find(q) {
      var tokens = tokensOf(q);
      if (!tokens.length) return [];
      var hits = [];
      docs.forEach(function (d) {
        var title = String(d.t || "").toLowerCase();
        var tags = (d.g || []).join(" ").toLowerCase();
        var cats = (d.c || []).join(" ").toLowerCase();
        var body = String(d.x || "").toLowerCase();
        var score = 0;
        for (var i = 0; i < tokens.length; i++) {
          var tk = tokens[i];
          if (title.indexOf(tk) !== -1) score += 6;
          else if (tags.indexOf(tk) !== -1 || cats.indexOf(tk) !== -1) score += 3;
          else if (body.indexOf(tk) !== -1) score += 1;
          else return;
        }
        hits.push({ doc: d, score: score });
      });
      hits.sort(function (a, b) { return b.score - a.score; });
      return hits.slice(0, limit).map(function (h) { return h.doc; });
    }

    function render(found, tokens) {
      list.textContent = "";
      active = -1;
      found.forEach(function (d, i) {
        var li = document.createElement("li");
        li.className = "search-result";
        li.id = "search-result-" + i;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        var a = document.createElement("a");
        a.className = "search-result-link";
        a.href = d.u || "/";
        var title = document.createElement("span");
        title.className = "search-result-title";
        title.appendChild(highlight(d.t || "", tokens));
        a.appendChild(title);
        if (d.d || (d.c && d.c.length) || (d.g && d.g.length)) {
          var meta = document.createElement("span");
          meta.className = "search-result-meta";
          if (d.d) { var tm = document.createElement("span"); tm.textContent = d.d; meta.appendChild(tm); }
          var labels = (d.c || []).concat(d.g || []);
          if (labels.length) {
            var tg = document.createElement("span");
            tg.textContent = labels.slice(0, 4).map(function (v) { return "#" + v; }).join(" ");
            meta.appendChild(tg);
          }
          a.appendChild(meta);
        }
        if (d.x) {
          var ex = document.createElement("span");
          ex.className = "search-result-excerpt";
          ex.appendChild(highlight(d.x, tokens));
          a.appendChild(ex);
        }
        li.appendChild(a);
        list.appendChild(li);
      });
      if (empty) empty.hidden = found.length > 0;
    }

    function open() {
      lastFocus = document.activeElement;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      if (openBtn) openBtn.setAttribute("aria-expanded", "true");
      if (input) {
        input.focus();
        input.select();
        // the overlay was `visibility: hidden` a moment ago; focus again once
        // the new style is in effect (otherwise the focus call is dropped)
        requestAnimationFrame(function () { input.focus(); input.select(); });
      }
    }

    function close() {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      if (openBtn) openBtn.setAttribute("aria-expanded", "false");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function move(delta) {
      var items = $$(".search-result", list);
      if (!items.length) return;
      active = (active + delta + items.length) % items.length;
      items.forEach(function (it, i) { it.setAttribute("aria-selected", i === active ? "true" : "false"); });
      if (items[active].scrollIntoView) items[active].scrollIntoView({ block: "nearest" });
    }

    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    if (list) {
      list.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest("a")) close();
      });
    }

    if (input) {
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var q = input.value.trim();
          if (hint) hint.hidden = q !== "";
          if (!q) { render([], []); if (empty) empty.hidden = true; return; }
          render(find(q), tokensOf(q));
        }, 120);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
        else if (e.key === "Enter") {
          var items = $$(".search-result", list);
          var link = active >= 0 && items[active] ? $("a", items[active]) : (items[0] ? $("a", items[0]) : null);
          if (!link) return;
          e.preventDefault();
          var href = link.getAttribute("href");
          close();
          if (window.__fireflyNavigate) window.__fireflyNavigate(href, true);
          else window.location.href = href;
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) { close(); return; }
      if (CFG.searchHotkey === false) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        open();
      }
    });
  }

  /* ---------- TOC ---------- */
  var spyHeads = [];
  function tocLink(heading) {
    var a = document.createElement("a");
    a.className = "toc-item level-" + heading.tagName.charAt(1);
    a.href = "#" + heading.id;
    var label = document.createElement("span");
    label.className = "toc-label";
    label.textContent = heading.textContent;
    a.appendChild(label);
    a.addEventListener("click", function (e) {
      e.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "#" + heading.id);
    });
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

  /* ---------- long-post segments ---------- */
  //
  // The deployer ships the first segment plus a marker listing every remaining
  // fragment (`data-segments`); fragments written by an older deployer only
  // name their successor (`data-next`), which is still supported. Fragments are
  // fetched a few at a time and spliced in index order, so one that arrives
  // early waits in a buffer and the article never reorders.
  //
  // A `#anchor` may live in a fragment the initial DOM does not contain; the
  // browser then resolves nothing, so the loader remembers the id, keeps
  // fetching until the fragment carrying it is in, and scrolls to it.
  var segScrollHandler = null;
  var segGeneration = 0;
  var SEG_LOOKAHEAD = 3;

  function segmentHash(url) {
    var i = String(url || "").indexOf("#");
    if (i < 0) return "";
    var raw = String(url).slice(i + 1);
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  }

  // fragment navigation resolves an id first, then a legacy <a name>
  function findAnchor(id) {
    var el = document.getElementById(id);
    if (el) return el;
    var named = document.getElementsByName(id);
    return named && named.length ? named[0] : null;
  }

  function findAnchorIn(root, id) {
    var els = root.querySelectorAll("[id]");
    for (var i = 0; i < els.length; i++) if (els[i].id === id) return els[i];
    return null;
  }

  function initSegments(pageUrl) {
    var body = $("#post-body");
    var loader = $(".seg-loading");
    var gen = ++segGeneration;
    if (segScrollHandler) { window.removeEventListener("scroll", segScrollHandler); segScrollHandler = null; }
    var marker = body && body.querySelector(".post-seg-end[data-next]");
    if (!marker) { if (loader) loader.remove(); return; }

    var base = pageUrl || location.href;
    function resolve(u) {
      try { return u ? new URL(u, base).href : null; } catch (e) { return null; }
    }

    // the first marker may list every fragment (new deployer); otherwise the
    // chain is the only source of urls and only one request can be in flight
    var listed = (marker.getAttribute("data-segments") || "").trim().split(/\s+/).filter(Boolean);
    var complete = listed.length > 0;
    var urls = [];
    (complete ? listed : [marker.getAttribute("data-next")]).forEach(function (u) {
      var abs = resolve(u);
      if (abs) urls.push(abs);
    });
    if (!urls.length) { if (loader) loader.remove(); return; }

    // an anchor outside the first segment is replayed when its fragment lands
    var hash = segmentHash(base);
    var wanted = hash && !findAnchor(hash) ? hash : null;

    var buffered = [];    // index → html waiting for its turn
    var cursor = 0;       // index of the next fragment to splice in
    var nextRequest = 0;  // index of the next url to fetch
    var inflight = 0;
    var paused = false;   // a fetch failed: retry on the next scroll tick
    var sentinel = marker; // stays at the end of the loaded content

    function alive() { return gen === segGeneration; }
    function showLoader(on) {
      if (loader) loader.hidden = !on;
    }
    function nearEnd() {
      // the marker itself is display:none, so measure the loaded article end
      return body.getBoundingClientRect().bottom < window.innerHeight + 400;
    }

    function pump(force) {
      if (!alive() || paused) return;
      if (!force && !nearEnd()) return;
      while (inflight < SEG_LOOKAHEAD && nextRequest < urls.length) {
        request(nextRequest++);
      }
      showLoader(inflight > 0);
    }

    function request(index) {
      inflight++;
      fetch(urls[index]).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      }).then(function (text) {
        buffered[index] = text;
      }).catch(function () {
        // keep the index so the retry does not skip a fragment
        nextRequest = index;
        paused = true;
        showLoader(false);
      }).then(function () {
        inflight--;
        drain();
      });
    }

    // splice every fragment whose predecessors are already in place
    function drain() {
      if (!alive()) return;
      var inserted = false;
      while (cursor < urls.length && typeof buffered[cursor] === "string") {
        splice(buffered[cursor]);
        buffered[cursor] = null;
        cursor++;
        inserted = true;
      }
      if (inserted) buildToc();
      if (cursor >= urls.length && inflight === 0) {
        sentinel.remove();
        if (loader) loader.remove();
        if (segScrollHandler) {
          window.removeEventListener("scroll", segScrollHandler);
          segScrollHandler = null;
        }
        return;
      }
      pump(!!wanted);
    }

    function splice(html) {
      var tpl = document.createElement("template");
      tpl.innerHTML = html;
      var frag = tpl.content;
      if (!complete) {
        // chained fallback: this fragment knows where the next one lives
        var next = frag.querySelector(".post-seg-end[data-next]");
        var url = next && resolve(next.getAttribute("data-next"));
        if (url) urls.push(url);
      }
      var target = wanted ? findAnchorIn(frag, wanted) : null;
      frag.querySelectorAll(".post-seg-end").forEach(function (node) { node.remove(); });
      sentinel.parentNode.insertBefore(frag, sentinel);
      if (target) {
        wanted = null;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    segScrollHandler = function () {
      paused = false;
      pump(false);
    };
    window.addEventListener("scroll", segScrollHandler, { passive: true });
    // an unresolved anchor cannot wait for the scroll: pull until it shows up
    pump(!!wanted);
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

  /* ---------- pagination jump ---------- */
  /* The desktop ellipsis and the mobile current-page number open a one-field
     jump box in place (upstream's PageJump island). Delegation on the nav keeps
     it working after pjax swaps the pagination in. */
  function initPagination() {
    $$(".pagination").forEach(function (nav) {
      if (nav.dataset.bound) return;
      nav.dataset.bound = "1";
      nav.addEventListener("click", function (e) {
        var trigger = e.target.closest && e.target.closest("[data-pagination-jump]");
        if (!trigger) return;
        e.preventDefault();
        openJump(nav, trigger);
      });
    });
  }
  function openJump(nav, trigger) {
    var last = parseInt(nav.getAttribute("data-jump-last"), 10) || 1;
    var current = parseInt(nav.getAttribute("data-jump-current"), 10) || 1;
    var digits = String(last).length;
    var variant = trigger.getAttribute("data-jump-variant");
    var input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = digits;
    input.className = "pagination-jump-input";
    input.setAttribute("aria-label", trigger.getAttribute("aria-label") || "");
    // the mobile field sits inside the "current / total" card and only needs to
    // fit the digits; the desktop one replaces a square and is sized by CSS
    if (variant === "current") input.style.width = (digits + 0.5) + "ch";

    var done = false;
    function close() {
      if (done) return;
      done = true;
      input.replaceWith(trigger);
    }
    function submit() {
      var parsed = parseInt(input.value, 10);
      close();
      if (isNaN(parsed)) return;
      // out-of-range values are clamped, not dropped (upstream behaviour)
      var target = Math.min(Math.max(parsed, 1), last);
      if (target === current) return;
      var first = nav.getAttribute("data-jump-first") || "/";
      var template = nav.getAttribute("data-jump-template") || "/page/{page}/";
      var url = target === 1 ? first : template.replace("{page}", String(target));
      if (window.__fireflyNavigate) window.__fireflyNavigate(url, true);
      else window.location.href = url;
    }

    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, digits);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
    });
    input.addEventListener("blur", close);

    trigger.replaceWith(input);
    input.focus();
    input.select();
  }

  /* ---------- recent card: heatmap tooltip + week filter ---------- */
  var heatTip = null;
  function showHeatTip(cell) {
    if (!heatTip) {
      heatTip = document.createElement("div");
      heatTip.className = "heatmap-tooltip";
      heatTip.setAttribute("role", "tooltip");
      document.body.appendChild(heatTip);
    }
    heatTip.textContent = cell.getAttribute("aria-label") || "";
    heatTip.hidden = false;
    var rect = cell.getBoundingClientRect();
    // keep the bubble inside the viewport: the first/last columns sit close to
    // the sidebar edges and the top row sits under the navbar
    var half = heatTip.offsetWidth / 2;
    var left = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
    var below = rect.top < heatTip.offsetHeight + 12;
    heatTip.style.left = left + "px";
    heatTip.style.top = (below ? rect.bottom : rect.top) + "px";
    heatTip.classList.toggle("below", below);
  }
  function hideHeatTip() {
    if (heatTip) heatTip.hidden = true;
  }
  function initRecent() {
    $$("[data-recent]").forEach(function (card) {
      if (card.dataset.bound) return;
      card.dataset.bound = "1";
      var cells = $$(".heatmap-cell", card);
      cells.forEach(function (cell) {
        cell.addEventListener("pointerenter", function () { showHeatTip(cell); });
        cell.addEventListener("pointerleave", hideHeatTip);
        cell.addEventListener("focus", function () { showHeatTip(cell); });
        cell.addEventListener("blur", hideHeatTip);
      });
      if (card.getAttribute("data-clickable") !== "true") return;
      var list = $("[data-recent-list]", card);
      var dataEl = $("[data-recent-data]", card);
      if (!list || !dataEl) return;
      var posts = [];
      try { posts = JSON.parse(dataEl.textContent || "[]"); } catch (e) { return; }
      // the server-rendered list doubles as the "no filter" state
      var recentHTML = list.innerHTML;
      var selected = null;

      function render(bucket) {
        var frag = document.createDocumentFragment();
        bucket.forEach(function (p) {
          var a = document.createElement("a");
          a.className = "recent-item";
          a.href = p.u;
          var title = document.createElement("span");
          title.className = "recent-title";
          title.textContent = p.t;
          var date = document.createElement("time");
          date.className = "recent-date";
          date.textContent = p.d;
          a.appendChild(title);
          a.appendChild(date);
          frag.appendChild(a);
        });
        list.replaceChildren(frag);
      }

      cells.forEach(function (cell) {
        if (cell.tagName !== "BUTTON") return;
        var month = cell.getAttribute("data-month");
        var week = cell.getAttribute("data-week");
        var bucket = posts.filter(function (p) {
          return String(p.m) === month && String(p.w) === week;
        });
        if (!bucket.length) return;
        cell.addEventListener("click", function () {
          var same = selected === cell;
          if (selected) {
            selected.classList.remove("is-selected");
            selected.setAttribute("aria-pressed", "false");
          }
          if (same) {
            selected = null;
            list.innerHTML = recentHTML;
            return;
          }
          selected = cell;
          cell.classList.add("is-selected");
          cell.setAttribute("aria-pressed", "true");
          render(bucket);
        });
      });
    });
  }

  /* ---------- dynamic page: search and year filter over a static feed ---------- */
  function initDynamic() {
    var page = $("[data-dynamic-page]");
    if (!page || page.dataset.bound) return;
    var items = $$("[data-dynamic-item]", page);
    if (!items.length) return;
    page.dataset.bound = "1";
    var search = $("[data-dynamic-search]", page);
    var yearSelect = $("[data-dynamic-year]", page);
    var empty = $("[data-dynamic-empty]", page);
    // cache the lowercased text once instead of reading textContent per key
    items.forEach(function (item) {
      item.dataset.searchText = (item.textContent || "").toLowerCase();
    });

    function apply() {
      var query = search ? search.value.trim().toLowerCase() : "";
      var year = yearSelect ? yearSelect.value : "all";
      var shown = 0;
      items.forEach(function (item) {
        var match = (year === "all" || item.getAttribute("data-year") === year) &&
          (!query || item.dataset.searchText.indexOf(query) !== -1);
        item.hidden = !match;
        if (match) shown += 1;
      });
      if (empty) empty.hidden = shown > 0;
    }

    if (search) search.addEventListener("input", apply);
    if (yearSelect) yearSelect.addEventListener("change", apply);
    apply();
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
    ["data-view", "data-navbar-mode", "data-sidebar-position", "data-tablet-sidebar"].forEach(function (a) {
      var v = doc.body.getAttribute(a);
      if (v === null) body.removeAttribute(a); else body.setAttribute(a, v);
    });
    // the navbar survives pjax, so keep its home/non-home flag in sync (the
    // mobile banner glass is only used on the home page)
    var nav = document.getElementById("navbar");
    if (nav) nav.setAttribute("data-is-home", body.getAttribute("data-view") === "home" ? "true" : "false");
    // the body class is reset with className above; the navbar element survives
    // pjax, so re-derive the sidebar offset state from it
    syncNavbarHidden(nav);

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
    var hash = segmentHash(url);
    if (hash) {
      var target = findAnchor(hash);
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    }
    initSegments(url);
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
    window.__fireflyNavigate = navigate;
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
})();
