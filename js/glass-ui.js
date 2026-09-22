// Liquid Glass mounts — real WebGL glass on key CTAs, CSS fallback if no WebGL.
// Lib: dashersw/liquid-glass-js (MIT), vendored under js/vendor/liquid-glass/.

function mountGlassButton(targetId, opts) {
  const host = document.getElementById(targetId);
  if (!host || typeof Button === "undefined") return null;

  try {
    const btn = new Button({
      text: opts.text,
      size: opts.size || 18,
      type: opts.type || "pill",
      tintOpacity: opts.tintOpacity ?? 0.22,
      onClick: () => opts.onClick && opts.onClick(),
    });
    btn.element.classList.add("glass-cta");
    if (opts.className) btn.element.classList.add(opts.className);
    if (opts.hidden) btn.element.hidden = true;
    host.replaceWith(btn.element);
    // keep id for existing listeners wired elsewhere? listeners were on old node —
    // remap: expose for app to rebind
    btn.element.id = targetId;
    return btn.element;
  } catch (err) {
    console.warn("glass button fallback:", err);
    return null;
  }
}

function initGlassUI() {
  if (typeof Button === "undefined") return;

  // "Bât dau" — replace static button with glass pill
  const startBtn = document.getElementById("btn-start");
  if (startBtn) {
    const clone = startBtn.cloneNode(true);
    try {
      const g = new Button({
        text: "Bắt đầu →",
        size: 20,
        type: "pill",
        tintOpacity: 0.28,
        onClick: () => document.getElementById("btn-start")?.click
          ? document.getElementById("btn-start").click()
          : null,
      });
      // onClick on glass fires; wire to same handler by keeping original hidden
      // Simpler: hide original, glass triggers its .click()
      const original = document.getElementById("btn-start");
      g.element.id = "btn-start-glass";
      g.element.classList.add("glass-cta");
      g.element.addEventListener("click", (e) => {
        e.stopImmediatePropagation();
        original?.click();
      });
      original.hidden = true;
      original.after(g.element);
    } catch (err) {
      console.warn("glass start skip", err);
    }
  }

  // "Go'i ten" ghost → glass pill secondary
  const pickToggle = document.getElementById("btn-toggle-picker");
  if (pickToggle) {
    try {
      const g = new Button({
        text: "Gọi tên ngẫu nhiên",
        size: 16,
        type: "pill",
        tintOpacity: 0.14,
        onClick: () => pickToggle.click(),
      });
      g.element.id = "btn-toggle-picker-glass";
      g.element.classList.add("glass-cta", "glass-cta--secondary");
      pickToggle.hidden = true;
      pickToggle.after(g.element);
    } catch (err) {
      console.warn("glass picker skip", err);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // wait a frame so layout settled for html2canvas sampling
  requestAnimationFrame(() => setTimeout(initGlassUI, 120));
});
