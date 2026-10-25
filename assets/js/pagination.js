// Pagination jump box (desktop ellipsis and mobile page number).
import { $$ } from "./core.js";

/* The desktop ellipsis and the mobile current-page number open a one-field
   jump box in place (upstream's PageJump island). Delegation on the nav keeps
   it working after pjax swaps the pagination in. */
function initPagination() {
  $$(".pagination").forEach(function (nav) {
    if (nav.dataset.bound) return;
    nav.dataset.bound = "1";
    nav.addEventListener("click", function (e) {
      const trigger = e.target.closest && e.target.closest("[data-pagination-jump]");
      if (!trigger) return;
      e.preventDefault();
      openJump(nav, trigger);
    });
  });
}
function openJump(nav, trigger) {
  const last = parseInt(nav.getAttribute("data-jump-last"), 10) || 1;
  const current = parseInt(nav.getAttribute("data-jump-current"), 10) || 1;
  const digits = String(last).length;
  const variant = trigger.getAttribute("data-jump-variant");
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.maxLength = digits;
  input.className = "pagination-jump-input";
  input.setAttribute("aria-label", trigger.getAttribute("aria-label") || "");
  // the mobile field sits inside the "current / total" card and only needs to
  // fit the digits; the desktop one replaces a square and is sized by CSS
  if (variant === "current") input.style.width = (digits + 0.5) + "ch";

  let done = false;
  function close() {
    if (done) return;
    done = true;
    input.replaceWith(trigger);
  }
  function submit() {
    const parsed = parseInt(input.value, 10);
    close();
    if (isNaN(parsed)) return;
    // out-of-range values are clamped, not dropped (upstream behaviour)
    const target = Math.min(Math.max(parsed, 1), last);
    if (target === current) return;
    const first = nav.getAttribute("data-jump-first") || "/";
    const template = nav.getAttribute("data-jump-template") || "/page/{page}/";
    const url = target === 1 ? first : template.replace("{page}", String(target));
    if (window.__fireflyNavigate) window.__fireflyNavigate(url, true);
    else window.location.href = url;
  }

  input.addEventListener("input", function () {
    input.value = input.value.replace(/\D/g, "").slice(0, digits);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  });
  input.addEventListener("blur", close);

  trigger.replaceWith(input);
  input.focus();
  input.select();
}


export { initPagination };
