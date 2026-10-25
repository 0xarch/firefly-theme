// Theme mode (light / dark / system) and the accent-hue display setting.
import { CFG, $, $$ } from "./core.js";
import { loadGiscus, updateGiscusTheme } from "./comments.js";

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

export { initThemeToggle, initSystemThemeWatch, initDisplaySettings };
