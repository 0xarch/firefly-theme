// Shared helpers and mutable state used by the theme modules.
export var CFG = window.__FIREFLY__ || {};
export var $ = function (s, r) { return (r || document).querySelector(s); };
export var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

// a fragment id waiting for its long-post segment (see segments.js)
export var state = { anchorWait: null };

export function segmentHash(url) {
  var i = String(url || "").indexOf("#");
  if (i < 0) return "";
  var raw = String(url).slice(i + 1);
  try { return decodeURIComponent(raw); } catch (e) { return raw; }
}

// fragment navigation resolves an id first, then a legacy <a name>
export function findAnchor(id) {
  var el = document.getElementById(id);
  if (el) return el;
  var named = document.getElementsByName(id);
  return named && named.length ? named[0] : null;
}
