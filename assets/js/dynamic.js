// Dynamic page: search and year filter over the static feed.
import { $, $$ } from "./core.js";

function initDynamic() {
  const page = $("[data-dynamic-page]");
  if (!page || page.dataset.bound) return;
  const items = $$("[data-dynamic-item]", page);
  if (!items.length) return;
  page.dataset.bound = "1";
  const search = $("[data-dynamic-search]", page);
  const yearSelect = $("[data-dynamic-year]", page);
  const empty = $("[data-dynamic-empty]", page);
  // cache the lowercased text once instead of reading textContent per key
  items.forEach(function (item) {
    item.dataset.searchText = (item.textContent || "").toLowerCase();
  });

  function apply() {
    const query = search ? search.value.trim().toLowerCase() : "";
    const year = yearSelect ? yearSelect.value : "all";
    let shown = 0;
    items.forEach(function (item) {
      const match = (year === "all" || item.getAttribute("data-year") === year) &&
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


export { initDynamic };
