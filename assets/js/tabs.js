// Tab containers — output of @mdit/plugin-tab (`::: tabs` + `@tab`).
// Buttons carry data-tab="<index>", panels carry data-index; a container id
// (`::: tabs#fruit`) plus a per-tab id (`@tab apple#apple`) keeps every
// container sharing that id on the same tab across the page.
import { $$ } from "./core.js";

const groupState = {};

function initTabs() {
  $$(".tabs-tabs-wrapper").forEach(function (wrapper) {
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
        const id = button.dataset.id || wrapper.dataset.id;
        if (id) {
          groupState[id] = i;
          document.querySelectorAll('.tabs-tabs-wrapper[data-id="' + id + '"]').forEach(function (other) {
            syncShared(other);
          });
        }
      });
    });

    // adopt the state another container with the same id already chose
    if (wrapper.dataset.id && groupState[wrapper.dataset.id] !== undefined) syncShared(wrapper);
  });

  function syncShared(wrapper) {
    const id = wrapper.dataset.id;
    if (id === undefined || groupState[id] === undefined) return;
    const buttons = $$(".tabs-tab-button", wrapper);
    const panels = $$(".tabs-tab-content", wrapper);
    if (!buttons.length) return;
    // containers whose tabs carry ids switch together index-wise; plain
    // containers just clamp the shared index to their own tab count
    const usesIds = buttons.some(function (b) { return b.dataset.id !== undefined; });
    const index = usesIds ? groupState[id] : Math.min(groupState[id], buttons.length - 1);
    activate(buttons, panels, index);
  }

  function activate(buttons, panels, index) {
    buttons.forEach(function (b, i) { b.classList.toggle("active", i === index); });
    panels.forEach(function (p, i) { p.classList.toggle("active", i === index); });
  }
}

export { initTabs };
