// flag.js — lá cờ ở góc phải. Rìa vải gợn sóng nhẹ như có gió (CSS keyframes),
// và khi con trỏ lướt qua thì biên độ sóng tăng theo độ gần + tốc độ tay,
// rồi tự dịu xuống. Không phụ thuộc thư viện; tôn trọng prefers-reduced-motion.
(() => {
  const host = document.querySelector(".flag-wave");
  if (!host) return;

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const NEAR = 210; // bán kính "bàn tay" tính từ mép cờ (px)
  const MAX = 3.6; // biên độ tối đa (bội số biên độ nền)

  let cur = 1;
  let target = 1;
  let raf = 0;
  let lastX = 0;
  let lastY = 0;

  function tick() {
    raf = 0;
    // gió tắt dần khi tay rời đi
    target += (1 - target) * 0.085;
    cur += (target - cur) * 0.2;
    host.style.setProperty("--flag-amp", cur.toFixed(3));
    if (Math.abs(target - 1) > 0.004 || Math.abs(cur - 1) > 0.004) {
      raf = requestAnimationFrame(tick);
    }
  }

  function schedule() {
    if (!raf && !reduceQuery.matches) raf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    if (e.pointerType === "touch" || reduceQuery.matches) return;

    const r = host.getBoundingClientRect();
    // khoảng cách tới MÉP cờ (0 khi đang ở trên cờ) → cảm giác lướt qua
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    const dist = Math.hypot(dx, dy);

    const speed = Math.min(Math.hypot(e.clientX - lastX, e.clientY - lastY), 70);
    lastX = e.clientX;
    lastY = e.clientY;

    const prox = Math.max(0, 1 - dist / NEAR);
    const want = 1 + (MAX - 1) * prox * prox * (0.55 + (speed / 70) * 0.45);
    if (want > target) target = want;
    schedule();
  }

  function settle() {
    target = 1;
    schedule();
  }

  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", () => {
      if (reduceQuery.matches) {
        target = 1;
        cur = 1;
        host.style.setProperty("--flag-amp", "1");
      }
    });
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseleave", settle);
})();
