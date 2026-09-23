// Liquid Glass mounts — clear/refraction glass (dashersw/liquid-glass-js, MIT).
// tintOpacity low = transparent (not red/gold). Hidden HTML keeps listeners.

function initGlassUI() {
  if (typeof Button === "undefined") return;
  // small screens keep CSS glass fallback: legible, cheaper, no WebGL
  if (window.matchMedia("(max-width: 640px)").matches) return;

  // clear glass: tint 0.10–0.16 → white refraction, almost no color cast
  const pairs = [
    { id: "btn-start", text: "Bắt đầu", size: 20, tint: 0.14 },
    { id: "btn-next", text: null, size: 16, tint: 0.14 }, // text follows original label
    { id: "btn-retry", text: "Chơi lại vòng mới", size: 16, tint: 0.14 },
    { id: "btn-pick", text: "Rút tên →", size: 16, tint: 0.14 },
    { id: "btn-undo", text: "Hoàn tác, chọn lại", size: 14, tint: 0.1, secondary: true },
    { id: "btn-picker-back", text: "← Quay lại", size: 14, tint: 0.1, secondary: true },
  ];

  const mounted = new Set();
  const pending = new Set();
  let recheck = null;

  // Nút nằm trong section/khối đang ẩn thì chưa mount được. Thay vì poll bằng
  // requestAnimationFrame (cháy CPU vô hạn), chờ DOM đổi thuộc tính hidden/class
  // rồi thử lại — đúng lúc app mở section ra.
  function armRecheck() {
    if (recheck) return;
    recheck = new MutationObserver(() => {
      for (const p of [...pending]) {
        const el = document.getElementById(p.id);
        if (!el || el.dataset.glassDone) { pending.delete(p); continue; }
        const r = el.getBoundingClientRect();
        if (r.width >= 8 && r.height >= 8) {
          pending.delete(p);
          mountOne(p);
        }
      }
      if (!pending.size) { recheck.disconnect(); recheck = null; }
    });
    recheck.observe(document.body, {
      attributes: true,
      attributeFilter: ["hidden", "class"],
      subtree: true,
    });
  }

  function mountOne(p) {
    if (mounted.has(p.id)) return;
    const original = document.getElementById(p.id);
    if (!original || original.dataset.glassDone) return;

    // chưa hiển thị (display:none ở tổ tiên) → hẹn mount lại khi DOM đổi
    const rect = original.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) {
      pending.add(p);
      armRecheck();
      return;
    }

    try {
      const label = p.text != null ? p.text : (original.textContent || "").trim();
      const g = new Button({
        text: label,
        size: p.size,
        type: "pill",
        tintOpacity: p.tint,
        onClick: () => original.click(),
      });
      g.element.id = `${p.id}-glass`;
      g.element.classList.add("glass-cta");
      if (p.secondary) g.element.classList.add("glass-cta--secondary");
      original.hidden = true;
      original.tabIndex = -1;
      original.dataset.glassDone = "1";
      original.after(g.element);
      g.element.tabIndex = 0;
      g.element.setAttribute("role", "button");
      g.element.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          original.click();
        }
      });
      mounted.add(p.id);
    } catch (err) {
      console.warn("glass skip", p.id, err);
    }
  }

  for (const p of pairs) mountOne(p);
}

// keep glass label in sync when app rewrites button text (e.g. last question)
function syncGlassLabel(id) {
  const original = document.getElementById(id);
  const glass = document.getElementById(`${id}-glass`);
  if (!original || !glass) return;
  const t = glass.querySelector(".glass-button-text");
  if (t) t.textContent = (original.textContent || "").trim();
}
window.syncGlassLabel = syncGlassLabel;

document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => setTimeout(initGlassUI, 120));
});
