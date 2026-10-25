// Banner typewriter subtitle.
import { CFG, $ } from "./core.js";

let twTimer = null;
function initTypewriter() {
  const el = $("#banner-subtitle-text");
  if (twTimer) { clearTimeout(twTimer); twTimer = null; }
  if (!el) return;
  const subs = CFG.bannerSubtitles || [];
  if (!subs.length) return;
  const tw = CFG.typewriter || {};
  if (tw.enable === false) {
    el.textContent = subs[Math.floor(Math.random() * subs.length)];
    return;
  }
  const speed = tw.speed || 100, del = tw.deleteSpeed || 50, pause = tw.pauseTime || 2000;
  let i = 0, ch = 0, deleting = false;
  function tick() {
    const text = subs[i];
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

export { initTypewriter };
