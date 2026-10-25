// Copy button on markdown code blocks.
import { CFG, $$ } from "./core.js";

function initCodeCopy() {
  $$(".markdown pre").forEach(function (pre) {
    if (pre.dataset.copy) return;
    pre.dataset.copy = "1";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy";
    btn.textContent = (CFG.i18n && CFG.i18n.copy) || "copy";
    btn.addEventListener("click", function () {
      const code = pre.querySelector("code");
      const text = code ? code.textContent : pre.textContent;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = (CFG.i18n && CFG.i18n.copied) || "copied";
        setTimeout(function () { btn.textContent = (CFG.i18n && CFG.i18n.copy) || "copy"; }, 1500);
      });
    });
    pre.appendChild(btn);
  });
}


export { initCodeCopy };
