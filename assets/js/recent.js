// Recent-posts card: heatmap tooltip and week filter.
import { $, $$ } from "./core.js";

let heatTip = null;
function showHeatTip(cell) {
  if (!heatTip) {
    heatTip = document.createElement("div");
    heatTip.className = "heatmap-tooltip";
    heatTip.setAttribute("role", "tooltip");
    document.body.appendChild(heatTip);
  }
  heatTip.textContent = cell.getAttribute("aria-label") || "";
  heatTip.hidden = false;
  const rect = cell.getBoundingClientRect();
  // keep the bubble inside the viewport: the first/last columns sit close to
  // the sidebar edges and the top row sits under the navbar
  const half = heatTip.offsetWidth / 2;
  const left = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
  const below = rect.top < heatTip.offsetHeight + 12;
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
    const cells = $$(".heatmap-cell", card);
    cells.forEach(function (cell) {
      cell.addEventListener("pointerenter", function () { showHeatTip(cell); });
      cell.addEventListener("pointerleave", hideHeatTip);
      cell.addEventListener("focus", function () { showHeatTip(cell); });
      cell.addEventListener("blur", hideHeatTip);
    });
    if (card.getAttribute("data-clickable") !== "true") return;
    const list = $("[data-recent-list]", card);
    const dataEl = $("[data-recent-data]", card);
    if (!list || !dataEl) return;
    let posts = [];
    try { posts = JSON.parse(dataEl.textContent || "[]"); } catch (e) { return; }
    // the server-rendered list doubles as the "no filter" state
    const recentHTML = list.innerHTML;
    let selected = null;

    function render(bucket) {
      const frag = document.createDocumentFragment();
      bucket.forEach(function (p) {
        const a = document.createElement("a");
        a.className = "recent-item";
        a.href = p.u;
        const title = document.createElement("span");
        title.className = "recent-title";
        title.textContent = p.t;
        const date = document.createElement("time");
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
      const month = cell.getAttribute("data-month");
      const week = cell.getAttribute("data-week");
      const bucket = posts.filter(function (p) {
        return String(p.m) === month && String(p.w) === week;
      });
      if (!bucket.length) return;
      cell.addEventListener("click", function () {
        const same = selected === cell;
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


export { initRecent, hideHeatTip };
