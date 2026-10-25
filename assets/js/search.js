// Client-side search over the JSON index rendered in the navbar.
import { CFG, $, $$ } from "./core.js";

/* The navbar renders a JSON index (title/date/tags/categories/excerpt) when
   `theme.search.enable` is on; this panel filters it in place. Every query
   token must match, title hits weigh most, results are highlighted and can be
   walked with the arrow keys. */
function initSearch() {
  const overlay = $("#search-panel");
  if (!overlay || overlay.dataset.bound) return;
  overlay.dataset.bound = "1";

  const openBtn = $("#search-open");
  const closeBtn = $("#search-close");
  const input = $("#search-input");
  const list = $("#search-results");
  const empty = $("#search-empty");
  const hint = $("#search-hint");
  const indexEl = $("#search-index");
  let docs = [];
  try { docs = JSON.parse((indexEl && indexEl.textContent) || "[]"); } catch (e) { docs = []; }
  const limit = Number(CFG.searchLimit) || 12;
  let active = -1;
  let lastFocus = null;
  let timer = null;

  function tokensOf(q) {
    return String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
  }

  /* wrap every occurrence of the query tokens in <mark>, merging overlaps */
  function highlight(text, tokens) {
    const frag = document.createDocumentFragment();
    const str = String(text || "");
    if (!tokens.length) { frag.appendChild(document.createTextNode(str)); return frag; }
    const lower = str.toLowerCase();
    const ranges = [];
    tokens.forEach(function (tk) {
      let from = 0;
      let at = lower.indexOf(tk, from);
      while (at !== -1 && ranges.length < 40) {
        ranges.push([at, at + tk.length]);
        from = at + tk.length;
        at = lower.indexOf(tk, from);
      }
    });
    if (!ranges.length) { frag.appendChild(document.createTextNode(str)); return frag; }
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    const merged = [];
    ranges.forEach(function (r) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([r[0], r[1]]);
    });
    let pos = 0;
    merged.forEach(function (r) {
      if (r[0] > pos) frag.appendChild(document.createTextNode(str.slice(pos, r[0])));
      const mark = document.createElement("mark");
      mark.textContent = str.slice(r[0], r[1]);
      frag.appendChild(mark);
      pos = r[1];
    });
    if (pos < str.length) frag.appendChild(document.createTextNode(str.slice(pos)));
    return frag;
  }

  function find(q) {
    const tokens = tokensOf(q);
    if (!tokens.length) return [];
    const hits = [];
    docs.forEach(function (d) {
      const title = String(d.t || "").toLowerCase();
      const tags = (d.g || []).join(" ").toLowerCase();
      const cats = (d.c || []).join(" ").toLowerCase();
      const body = String(d.x || "").toLowerCase();
      let score = 0;
      for (let i = 0; i < tokens.length; i++) {
        const tk = tokens[i];
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
      const li = document.createElement("li");
      li.className = "search-result";
      li.id = "search-result-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      const a = document.createElement("a");
      a.className = "search-result-link";
      a.href = d.u || "/";
      const title = document.createElement("span");
      title.className = "search-result-title";
      title.appendChild(highlight(d.t || "", tokens));
      a.appendChild(title);
      if (d.d || (d.c && d.c.length) || (d.g && d.g.length)) {
        const meta = document.createElement("span");
        meta.className = "search-result-meta";
        if (d.d) { const tm = document.createElement("span"); tm.textContent = d.d; meta.appendChild(tm); }
        const labels = (d.c || []).concat(d.g || []);
        if (labels.length) {
          const tg = document.createElement("span");
          tg.textContent = labels.slice(0, 4).map(function (v) { return "#" + v; }).join(" ");
          meta.appendChild(tg);
        }
        a.appendChild(meta);
      }
      if (d.x) {
        const ex = document.createElement("span");
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
    const items = $$(".search-result", list);
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
        const q = input.value.trim();
        if (hint) hint.hidden = q !== "";
        if (!q) { render([], []); if (empty) empty.hidden = true; return; }
        render(find(q), tokensOf(q));
      }, 120);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        const items = $$(".search-result", list);
        const link = active >= 0 && items[active] ? $("a", items[active]) : (items[0] ? $("a", items[0]) : null);
        if (!link) return;
        e.preventDefault();
        const href = link.getAttribute("href");
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

export { initSearch };
