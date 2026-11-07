// Tab containers — output of @mdit/plugin-tab (`::: tabs` + `@tab`).
// Buttons carry data-tab="<index>", panels carry data-index; a container id
// (`::: tabs#fruit`) plus a per-tab id (`@tab apple#apple`) keeps every
// container sharing that id on the same tab across the page.
import { $$ } from "./core.js";

const groupState = {};

function initTabs(root) {
  $$(".tabs-tabs-wrapper", root).forEach(function (wrapper) {
    if (wrapper.dataset.tabsInit) return;
    wrapper.dataset.tabsInit = "1";
    const buttons = $$(".tabs-tab-button", wrapper);
    const panels = $$(".tabs-tab-content", wrapper);
    if (!buttons.length) return;

    let active = buttons.findIndex(function (b) { return b.classList.contains("active"); });
    if (active < 0) active = 0;
    activate(buttons, panels, active);

    buttons.forEach(function (button, i) {
      button.addEventListener("click", function () {
        activate(buttons, panels, i);
        const groupId = wrapper.dataset.id;
        if (groupId) {
          // the container id is the shared group; a tab value id (if present)
          // names the active tab inside it, otherwise the index is shared
          groupState[groupId] = button.dataset.id !== undefined ? button.dataset.id : i;
          document.querySelectorAll('.tabs-tabs-wrapper[data-id="' + groupId + '"]').forEach(function (other) {
            syncShared(other);
          });
        }
      });
    });

    // adopt the state another container with the same id already chose
    if (wrapper.dataset.id && groupState[wrapper.dataset.id] !== undefined) syncShared(wrapper);
  });

  function syncShared(wrapper) {
    const groupId = wrapper.dataset.id;
    const shared = groupState[groupId];
    if (shared === undefined) return;
    const buttons = $$(".tabs-tab-button", wrapper);
    const panels = $$(".tabs-tab-content", wrapper);
    if (!buttons.length) return;
    // tab value ids sync by value (containers may list the tabs in any
    // order); plain containers sync by index, clamped to their tab count
    const index = typeof shared === "string"
      ? buttons.findIndex(function (b) { return b.dataset.id === shared; })
      : Math.min(shared, buttons.length - 1);
    if (index >= 0) activate(buttons, panels, index);
  }

  function activate(buttons, panels, index) {
    buttons.forEach(function (b, i) { b.classList.toggle("active", i === index); });
    panels.forEach(function (p, i) { p.classList.toggle("active", i === index); });
  }
}

export { initTabs };
