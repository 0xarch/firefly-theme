// Mermaid diagrams — the renderer ships `<pre class="mermaid">source</pre>`
// and the runtime bundle is copied to /assets/mermaid/mermaid.min.js by the
// files plugin (only when a page actually contains a diagram).
import { $$ } from "./core.js";


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
      if (!window.mermaid || typeof window.mermaid.run !== "function") {
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
  const nodes = $$(".mermaid", root).filter(function (el) { return !el.dataset.processed; });
  if (!nodes.length) return;

  loadMermaidRuntime().then(function (runtime) {
    runtime.initialize({ startOnLoad: false });
    return runtime.run({ nodes: nodes });
  }).catch(function (error) { console.warn("Mermaid rendering failed", error); });
}

export { initMermaid };
