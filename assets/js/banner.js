// Banner typewriter subtitle.
import { CFG, $ } from "./core.js";

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

export { initTypewriter };
