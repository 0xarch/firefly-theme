// Mermaid diagrams — the renderer ships `<pre class="mermaid">source</pre>`
// and the runtime bundle is copied to /assets/mermaid/mermaid.min.js by the
// files plugin (only when a page actually contains a diagram).
function initMermaid() {
  const nodes = $$(".mermaid").filter(function (el) { return !el.dataset.processed; });
  if (!nodes.length) return;

  const run = function () {
    if (!window.mermaid) return;
    window.mermaid.initialize({ startOnLoad: false });
    window.mermaid.run({ nodes: nodes }).catch(function () {});
  };

  if (window.mermaid) return run();
  let script = document.getElementById("mermaid-runtime");
  if (!script) {
    script = document.createElement("script");
    script.id = "mermaid-runtime";
    script.src = "/assets/mermaid/mermaid.min.js";
    document.head.appendChild(script);
  }
  script.addEventListener("load", run, { once: true });
}

function $$(sel) {
  return Array.prototype.slice.call(document.querySelectorAll(sel));
}

export { initMermaid };
