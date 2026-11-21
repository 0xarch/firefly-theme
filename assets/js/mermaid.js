// Mermaid diagrams — the renderer ships `<pre class="mermaid">source</pre>`
// and the runtime bundle is copied to /assets/mermaid/mermaid.min.js by the
// files plugin (only when a page actually contains a diagram).
import { $$ } from "./core.js";

var mermaidNodes = new WeakMap();
var mermaidNextId = 0;
var mermaidRenderQueue = Promise.resolve();
var mermaidInitializedRuntime = null;

var mermaidWaiting = new Set();
var mermaidVisibilityObserver = null;
var mermaidOnlineBound = false;

function mermaidVisible(node) {
  return node.isConnected && node.getClientRects().length > 0;
}

function waitForMermaid(node) {
  if (!node.isConnected) return;
  if (!mermaidVisibilityObserver && typeof ResizeObserver !== "undefined") {
    mermaidVisibilityObserver = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        if (mermaidVisible(entry.target)) queueMermaidNode(entry.target);
      });
    });
  }
  mermaidWaiting.add(node);
  if (mermaidVisibilityObserver) mermaidVisibilityObserver.observe(node);
}

function forgetMermaid(node) {
  mermaidWaiting.delete(node);
  if (mermaidVisibilityObserver) mermaidVisibilityObserver.unobserve(node);
}

function deferMermaidNode(node, state) {
  restoreMermaidSource(node, state);
  state.status = "ready";
  waitForMermaid(node);
}

function mermaidErrorKind(error) {
  var message = String(error && (error.message || error.str) || error);
  var name = error && (error.name || error.hash);
  if (name === "SyntaxError" || /parse error|syntax error|no diagram type|unknown diagram/i.test(message) ||
      (error && error.hash && typeof error.hash === "object" && error.hash.expected)) return "syntax";
  if (name === "NetworkError" || name === "TimeoutError" || name === "ChunkLoadError" ||
      /failed to fetch|loading chunk|dynamically imported module/i.test(message)) return "network";
  if ((name === "TypeError" || name === "Error") &&
      /getBoundingClientRect|getBBox|Cannot read properties of null/i.test(message)) return "layout";
  return "unknown";
}

function restoreMermaidSource(node, state) {
  node.textContent = state.source;
  node.removeAttribute("data-processed");
}

function queueMermaidNode(node) {
  var state = mermaidNodes.get(node);
  if (!state) {
    state = { source: node.textContent, status: "ready" };
    mermaidNodes.set(node, state);
  }
  if (state.status !== "ready") return mermaidRenderQueue;
  if (!mermaidVisible(node)) {
    waitForMermaid(node);
    return mermaidRenderQueue;
  }
  forgetMermaid(node);
  state.status = "queued";
  // Capture the shared download now so one failed batch does not repeat
  // the same network attempts separately for every diagram on the page.
  var runtimePromise = loadMermaidRuntime();
  runtimePromise.catch(function () {});
  mermaidRenderQueue = mermaidRenderQueue.then(async function () {
    if (!mermaidVisible(node)) { deferMermaidNode(node, state); return; }
    var runtime;
    try {
      runtime = await runtimePromise;
      if (!mermaidVisible(node)) { deferMermaidNode(node, state); return; }
      if (mermaidInitializedRuntime !== runtime) {
        runtime.initialize({ startOnLoad: false });
        mermaidInitializedRuntime = runtime;
      }
    } catch (error) {
      state.status = "ready";
      console.warn("Mermaid runtime unavailable; source preserved", error);
      return;
    }
    // Serialize rendering and supply unique IDs: Mermaid 10 run() uses
    // Date.now() alone, which can collide between diagrams in one millisecond.
    for (var attempt = 0; attempt < 2; attempt++) {
      if (!mermaidVisible(node)) { deferMermaidNode(node, state); return; }
      try {
        var id = "ngwg-mermaid-" + Date.now() + "-" + (++mermaidNextId);
        var result = await runtime.render(id, state.source, node);
        if (!mermaidVisible(node)) { deferMermaidNode(node, state); return; }
        node.innerHTML = result.svg;
        if (result.bindFunctions) result.bindFunctions(node);
        node.setAttribute("data-processed", "true");
        if (!mermaidVisible(node)) { deferMermaidNode(node, state); return; }
        state.status = "done";
        return;
      } catch (error) {
        // A PJAX swap invalidates this job. Do not retry a detached node or
        // report its layout failure as a problem on the new page.
        if (!mermaidVisible(node)) { deferMermaidNode(node, state); return; }
        restoreMermaidSource(node, state);
        var kind = mermaidErrorKind(error);
        if (attempt === 0 && (kind === "layout" || kind === "network")) {
          await new Promise(function (resolve) { setTimeout(resolve, 100); });
          continue;
        }
        state.status = "failed";
        console.warn("Mermaid " + kind + " error; source preserved", error);
        return;
      }
    }
  });
  return mermaidRenderQueue;
}

var mermaidRuntimePromise = null;

// Race downloads, not script execution: a late response must never replace
// the runtime while another diagram is being rendered. Keep the CDN version
// aligned with the runtime deployed by Ngwg-files.
function loadMermaidRuntime() {
  if (mermaidRuntimePromise) return mermaidRuntimePromise;
  if (window.mermaid) return Promise.resolve(window.mermaid);
  mermaidRuntimePromise = downloadMermaidRuntime().catch(function () {
    return downloadMermaidRuntime();
  }).catch(function (error) {
    mermaidRuntimePromise = null;
    throw error;
  });
  return mermaidRuntimePromise;
}

async function downloadMermaidRuntime() {
  var controllers = [];
  var timers = [];
  var urls = [
    "/assets/mermaid/mermaid.min.js",
    "https://cdn.jsdelivr.net/npm/mermaid@10.9.8/dist/mermaid.min.js",
  ];
  var code;
  try {
    code = await Promise.any(urls.map(async function (url) {
      var controller = new AbortController();
      controllers.push(controller);
      timers.push(setTimeout(function () { controller.abort(); }, 10000));
      var response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("Mermaid download failed: " + url + " (" + response.status + ")");
      var text = await response.text();
      if (!text.trim()) throw new Error("Empty Mermaid runtime: " + url);
      return text;
    }));
  } finally {
    timers.forEach(clearTimeout);
    controllers.forEach(function (controller) { controller.abort(); });
  }
  return new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    var url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    var timer = setTimeout(function () { finish(new Error("Mermaid script timed out")); }, 10000);
    function finish(error) {
      clearTimeout(timer);
      script.onload = script.onerror = null;
      script.remove();
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve(window.mermaid);
    }
    script.id = "mermaid-runtime";
    script.onload = function () {
      if (!window.mermaid || typeof window.mermaid.render !== "function") {
        finish(new Error("Invalid Mermaid runtime"));
        return;
      }
      window.mermaid.startOnLoad = false;
      finish();
    };
    script.onerror = function () { finish(new Error("Mermaid script could not execute")); };
    script.src = url;
    document.head.appendChild(script);
  });
}

function initMermaid(root) {
  mermaidWaiting.forEach(function (node) {
    if (!node.isConnected) forgetMermaid(node);
  });
  var nodes = $$(".mermaid", root).filter(function (el) {
    return !el.dataset.processed;
  });
  if (!nodes.length) return;
  if (!mermaidOnlineBound) {
    mermaidOnlineBound = true;
    window.addEventListener("online", function () { initMermaid(); });
  }
  return Promise.all(nodes.map(queueMermaidNode));
}

export { initMermaid };
