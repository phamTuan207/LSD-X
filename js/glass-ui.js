// Liquid Glass mounts — WebGL glass on 2 CTAs, hidden HTML button keeps listeners.
// Lib: dashersw/liquid-glass-js (MIT), vendored under js/vendor/liquid-glass/.

function initGlassUI() {
  if (typeof Button === "undefined") return;
  // small screens keep the solid gold CTA: legible at every glass tint, cheaper
  if (window.matchMedia("(max-width: 640px)").matches) return;

  const pairs = [
    { id: "btn-start", text: "Bắt đầu →", size: 20, tint: 0.5 },
    { id: "btn-toggle-picker", text: "Gọi tên ngẫu nhiên", size: 16, tint: 0.4, secondary: true },
  ];

  for (const p of pairs) {
    const original = document.getElementById(p.id);
    if (!original) continue;
    try {
      // single click path: Button onClick → hidden original (listeners live there)
      const g = new Button({
        text: p.text,
        size: p.size,
        type: "pill",
        tintOpacity: p.tint,
        onClick: () => original.click(),
      });
      g.element.id = `${p.id}-glass`;
      g.element.classList.add("glass-cta");
      if (p.secondary) g.element.classList.add("glass-cta--secondary");
      // keep tab order: glass in DOM before hidden original
      original.hidden = true;
      original.tabIndex = -1;
      original.after(g.element);
      g.element.tabIndex = 0;
      g.element.setAttribute("role", "button");
      g.element.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation(); // block global Enter handler double-firing start/retry
          original.click();
        }
      });
    } catch (err) {
      console.warn("glass skip", p.id, err);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => setTimeout(initGlassUI, 120));
});
