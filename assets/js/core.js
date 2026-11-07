// Shared helpers and mutable state used by the theme modules.
export const CFG = window.__FIREFLY__ || {};
export const $ = function (s, r) { return (r || document).querySelector(s); };
export const $$ = function (s, r) {
  // a root may also be an array of nodes (e.g. a freshly spliced fragment)
  if (Array.isArray(r)) {
    const out = [];
    r.forEach(function (node) {
      if (!node || node.nodeType !== 1) return;
      if (node.matches && node.matches(s)) out.push(node);
      if (node.querySelectorAll) out.push.apply(out, node.querySelectorAll(s));
    });
    return out;
  }
  return Array.prototype.slice.call((r || document).querySelectorAll(s));
};

// a fragment id waiting for its long-post segment (see segments.js)
export const state = { anchorWait: null };

export function segmentHash(url) {
  const i = String(url || "").indexOf("#");
  if (i < 0) return "";
  const raw = String(url).slice(i + 1);
  try { return decodeURIComponent(raw); } catch (e) { return raw; }
}

// fragment navigation resolves an id first, then a legacy <a name>
export function findAnchor(id) {
  const el = document.getElementById(id);
  if (el) return el;
  const named = document.getElementsByName(id);
  return named && named.length ? named[0] : null;
}
