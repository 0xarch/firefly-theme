// Long-post segment loader: fetch the next fragment when the reader approaches
// the end of the loaded content, splice them in order and replay a pending
// #anchor once its fragment is in.
import { $, findAnchor, segmentHash, state } from "./core.js";
import { buildToc } from "./toc.js";
import { initTabs } from "./tabs.js";
import { initMermaid } from "./mermaid.js";
import { initCodeCopy } from "./code-copy.js";

//
// The deployer ships the first segment plus a marker listing every remaining
// fragment (`data-segments`); fragments written by an older deployer only
// name their successor (`data-next`), which is still supported. One fragment
// is requested at a time when the marker comes within ~600px of the viewport,
// so a long article does not transfer every segment on page open. A pending
// `#anchor` deliberately walks the chain until the fragment carrying it lands.
//
// A `#anchor` may live in a fragment the initial DOM does not contain; the
// browser then resolves nothing, so the loader remembers the id and scrolls
// to it once the fragment carrying it is in.
let segGeneration = 0;
let activeLoader = null;

function findAnchorIn(root, id) {
  const els = root.querySelectorAll("[id]");
  for (let i = 0; i < els.length; i++) if (els[i].id === id) return els[i];
  return null;
}

function initSegments(pageUrl) {
  activeLoader = null;
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
  // the marker itself is display:none, so it has no useful geometry; a tiny
  // visible probe sits immediately before it and tracks the end of the content
  const probe = document.createElement("div");
  probe.className = "seg-sentinel";
  probe.setAttribute("aria-hidden", "true");
  sentinel.parentNode.insertBefore(probe, sentinel);
  let waitingRetry = false;
  let finished = false;

  function alive() { return gen === segGeneration; }
  function showLoader(on) {
    if (loader) loader.hidden = !on;
  }
  function stopListening() {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  }

  // the marker stays at the end of the loaded content, so its screen position
  // tells us when the reader is close enough to ask for the next fragment
  function nearViewport() {
    if (!probe.parentNode) return true;
    return probe.getBoundingClientRect().top <= window.innerHeight + 600;
  }

  function maybeLoad() {
    if (!alive()) { stopListening(); return; }
    if (finished || inflight > 0 || waitingRetry || nextRequest >= urls.length) {
      if (!finished && nextRequest >= urls.length && inflight === 0) showLoader(false);
      return;
    }
    // a pending anchor can sit anywhere ahead: keep walking the chain
    if (!state.anchorWait && !nearViewport()) { showLoader(false); return; }
    showLoader(true);
    request(nextRequest++);
  }

  function request(index) {
    inflight++;
    fetch(urls[index]).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    }).then(function (text) {
      if (!alive()) return;
      buffered[index] = text;
      inflight--;
      drain();
    }).catch(function () {
      if (!alive()) return;
      inflight--;
      // one retry covers a transient failure; after that keep what we have
      if (!retried[index]) {
        retried[index] = true;
        waitingRetry = true;
        setTimeout(function () {
          if (!alive()) return;
          waitingRetry = false;
          showLoader(true);
          request(index);
        }, 1200);
      } else {
        // skip an unrecoverable fragment and continue with the next one
        buffered[index] = "";
        drain();
      }
    });
  }

  // splice every fragment whose predecessors are already in place
  function drain() {
    if (!alive()) { stopListening(); return; }
    const added = [];
    while (cursor < urls.length && typeof buffered[cursor] === "string") {
      added.push.apply(added, splice(buffered[cursor]));
      buffered[cursor] = null;
      cursor++;
    }
    if (added.length) {
      // fragments can carry tab containers, mermaid diagrams and code blocks:
      // wire up only the freshly spliced nodes; the TOC needs a full rebuild
      // because it lists headings from every loaded segment
      buildToc();
      initTabs(added);
      initMermaid(added);
      initCodeCopy(added);
    }
    if (cursor >= urls.length && inflight === 0) {
      finished = true;
      probe.remove();
      sentinel.remove();
      if (loader) loader.remove();
      stopListening();
      if (activeLoader === maybeLoad) activeLoader = null;
      return;
    }
    maybeLoad();
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
    // keep the top-level nodes so the callers only initialise the new content
    const nodes = Array.prototype.slice.call(frag.childNodes);
    probe.parentNode.insertBefore(frag, probe);
    if (target) {
      state.anchorWait = null;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return nodes;
  }

  let ticking = false;
  function onScroll() {
    if (!alive()) { stopListening(); return; }
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      maybeLoad();
    });
  }

  activeLoader = maybeLoad;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  showLoader(false);
  maybeLoad();
}

// an in-page anchor may point at a fragment that has not been requested yet
function loadSegmentForAnchor() {
  if (activeLoader) activeLoader();
}

export { initSegments, loadSegmentForAnchor };
