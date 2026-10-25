// Dynamic page: search and year filter over the static feed.
import { $, $$ } from "./core.js";

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


export { initDynamic };
