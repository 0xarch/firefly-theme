// Long-post segment loader: fetch every fragment, splice them in order and
// replay a pending #anchor once its fragment is in.
import { $, findAnchor, segmentHash, state } from "./core.js";
import { buildToc } from "./toc.js";

//
// The deployer ships the first segment plus a marker listing every remaining
// fragment (`data-segments`); fragments written by an older deployer only
// name their successor (`data-next`), which is still supported. Every
// fragment is requested as soon as the page opens and spliced in index
// order, so one that arrives early waits in a buffer and the article never
// reorders — no scroll position is required to get the rest.
//
// A `#anchor` may live in a fragment the initial DOM does not contain; the
// browser then resolves nothing, so the loader remembers the id and scrolls
// to it once the fragment carrying it is in.
let segGeneration = 0;

function findAnchorIn(root, id) {
  const els = root.querySelectorAll("[id]");
  for (let i = 0; i < els.length; i++) if (els[i].id === id) return els[i];
  return null;
}

function initSegments(pageUrl) {
  const body = $("#post-body");
  const loader = $(".seg-loading");
  const gen = ++segGeneration;
  const marker = body && body.querySelector(".post-seg-end[data-next]");
  state.anchorWait = null;
  if (!marker) { if (loader) loader.remove(); return; }

  // fragment urls are relative to the page that owns them; callers may hand
  // us a relative page url, which cannot serve as a base on its own
  let base = pageUrl || location.href;
  try { base = new URL(base, location.href).href; } catch (e) { base = location.href; }
  function resolve(u) {
    try { return u ? new URL(u, base).href : null; } catch (e) { return null; }
  }

  // the first marker may list every fragment (new deployer); otherwise the
  // chain is the only source of urls and only one request can be in flight
  const listed = (marker.getAttribute("data-segments") || "").trim().split(/\s+/).filter(Boolean);
  const complete = listed.length > 0;
  const urls = [];
  (complete ? listed : [marker.getAttribute("data-next")]).forEach(function (u) {
    const abs = resolve(u);
    if (abs) urls.push(abs);
  });
  if (!urls.length) { if (loader) loader.remove(); return; }

  // an anchor outside the first segment is replayed when its fragment lands
  const hash = segmentHash(base);
  if (hash && !findAnchor(hash)) state.anchorWait = hash;

  const buffered = [];    // index → html waiting for its turn
  let cursor = 0;       // index of the next fragment to splice in
  let nextRequest = 0;  // index of the next url to fetch
  let inflight = 0;
  const retried = [];     // index → the one automatic retry was already used
  const sentinel = marker; // stays at the end of the loaded content

  function alive() { return gen === segGeneration; }
  function showLoader(on) {
    if (loader) loader.hidden = !on;
  }

  // every known fragment goes out now; the chain fallback adds the next url
  // only when a fragment arrives, so it stays sequential by nature
  function pump() {
    while (nextRequest < urls.length) request(nextRequest++);
    showLoader(inflight > 0);
  }

  function request(index) {
    inflight++;
    fetch(urls[index]).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    }).then(function (text) {
      buffered[index] = text;
      inflight--;
      drain();
    }).catch(function () {
      inflight--;
      // one retry covers a transient failure; after that keep what we have
      if (!retried[index]) {
        retried[index] = true;
        setTimeout(function () { if (alive()) request(index); }, 1200);
      }
      drain();
    });
  }

  // splice every fragment whose predecessors are already in place
  function drain() {
    if (!alive()) return;
    let inserted = false;
    while (cursor < urls.length && typeof buffered[cursor] === "string") {
      splice(buffered[cursor]);
      buffered[cursor] = null;
      cursor++;
      inserted = true;
    }
    if (inserted) buildToc();
    if (cursor >= urls.length && inflight === 0) {
      sentinel.remove();
      if (loader) loader.remove();
      return;
    }
    pump();
  }

  function splice(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const frag = tpl.content;
    if (!complete) {
      // chained fallback: this fragment knows where the next one lives
      const next = frag.querySelector(".post-seg-end[data-next]");
      const url = next && resolve(next.getAttribute("data-next"));
      if (url) urls.push(url);
    }
    const target = state.anchorWait ? findAnchorIn(frag, state.anchorWait) : null;
    frag.querySelectorAll(".post-seg-end").forEach(function (node) { node.remove(); });
    sentinel.parentNode.insertBefore(frag, sentinel);
    if (target) {
      state.anchorWait = null;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  pump();
}


export { initSegments };
