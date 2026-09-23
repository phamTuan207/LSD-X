// wheel.js — vòng quay gọi tên: rải tên lên một vòng tròn, quay nhanh rồi
// chậm dần cho hồi hộp, cuối cùng dừng đúng một tên. Dùng canvas + GSAP.
// Danh sách lấy chung pool với "Rút tên" (window.callNames) nên không lặp tên.
// Tôn trọng prefers-reduced-motion (quay tức thì, không animation).
(() => {
  const openBtn = document.getElementById("btn-wheel");
  if (!openBtn) return;

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hasGsap = () => typeof window.gsap !== "undefined";
  const TAU = Math.PI * 2;
  const norm = (a) => ((a % TAU) + TAU) % TAU;
  const POINTER = -Math.PI / 2; // kim ở đỉnh vòng

  // —— overlay ——
  const overlay = document.createElement("div");
  overlay.className = "wheel-overlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "wheel-title");
  overlay.innerHTML = `
    <div class="wheel-panel">
      <p class="wheel-title" id="wheel-title">Vòng quay gọi tên</p>
      <div class="wheel-stage">
        <canvas class="wheel-canvas" width="760" height="760"></canvas>
        <span class="wheel-pointer" aria-hidden="true"></span>
      </div>
      <p class="wheel-winner" aria-live="polite"></p>
      <p class="wheel-count"></p>
      <div class="wheel-actions">
        <button type="button" class="btn-next" id="btn-wheel-spin">Quay</button>
        <button type="button" class="btn-ghost" id="btn-wheel-close">Đóng</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const panel = overlay.querySelector(".wheel-panel");
  const canvas = overlay.querySelector(".wheel-canvas");
  const ctx = canvas.getContext("2d");
  const winnerEl = overlay.querySelector(".wheel-winner");
  const countEl = overlay.querySelector(".wheel-count");
  const spinBtn = overlay.querySelector("#btn-wheel-spin");
  const closeBtn = overlay.querySelector("#btn-wheel-close");

  const W = canvas.width;
  const CX = W / 2;
  const CY = W / 2;
  const R = W / 2 - 8;

  let names = [];
  let angle = POINTER;
  let highlight = -1;
  let spinning = false;
  let tween = null;

  function starPath(x, y, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const rad = i % 2 ? inner : outer;
      const a = POINTER + (i * Math.PI) / 5;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function fitLabel(label, maxW) {
    if (ctx.measureText(label).width <= maxW) return label;
    let cut = label;
    while (cut.length > 3 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1);
    return `${cut.trim()}…`;
  }

  function draw() {
    const n = names.length;
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.translate(CX, CY);

    if (!n) {
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      return;
    }

    const seg = TAU / n;
    for (let i = 0; i < n; i += 1) {
      const a0 = i * seg + angle;
      const a1 = a0 + seg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a0, a1);
      ctx.closePath();
      if (i === highlight) ctx.fillStyle = "rgba(232, 185, 35, 0.38)";
      else if (i % 5 === 0) ctx.fillStyle = "rgba(232, 185, 35, 0.13)";
      else ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.11)";
      ctx.fill();
      ctx.strokeStyle = i === highlight ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.13)";
      ctx.lineWidth = i === highlight ? 2 : 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // tên viết theo bán kính
    const size = Math.max(10, Math.min(17, 430 / n + 7));
    ctx.font = `600 ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    const maxW = R - 82;
    for (let i = 0; i < n; i += 1) {
      ctx.save();
      ctx.rotate(i * seg + angle + seg / 2);
      ctx.globalAlpha = i === highlight ? 1 : 0.9;
      ctx.fillText(fitLabel(names[i], maxW), R - 14, 0);
      ctx.restore();
    }

    // hub
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, TAU);
    ctx.fillStyle = "rgba(10, 7, 9, 0.78)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(245, 217, 122, 0.95)";
    starPath(0, 0, 24, 10);
    ctx.fill();
    ctx.restore();
  }

  function refreshNames() {
    const bridge = window.callNames;
    if (!bridge) {
      names = [];
      return;
    }
    const pool = bridge.pool();
    names = pool.length ? pool : bridge.all();
  }

  function updateCount() {
    if (!window.callNames) {
      countEl.textContent = "";
      return;
    }
    const left = window.callNames.left();
    countEl.textContent = left > 0 ? `Còn ${left} tên chưa gọi.` : "Hết danh sách, vòng mới bắt đầu.";
  }

  function reveal(name) {
    highlight = names.indexOf(name);
    draw();
    winnerEl.textContent = name;
    winnerEl.classList.remove("is-set");
    void winnerEl.offsetWidth; // restart animation
    winnerEl.classList.add("is-set");
  }

  function spin() {
    if (spinning) return;
    refreshNames();
    if (!names.length) {
      winnerEl.textContent = "Chưa có danh sách tên.";
      countEl.textContent = "";
      draw();
      return;
    }

    const n = names.length;
    const w = Math.floor(Math.random() * n);
    const seg = TAU / n;

    // góc cuối sao cho tâm ô w nằm dưới kim, kèm chút ngẫu nhiên cho tự nhiên
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const targetMod = norm(POINTER - (w + 0.5) * seg + jitter);

    if (reduceQuery.matches || !hasGsap()) {
      angle = targetMod;
      reveal(names[w]);
      if (window.callNames) window.callNames.take(names[w]);
      updateCount();
      return;
    }

    spinning = true;
    winnerEl.textContent = "";
    winnerEl.classList.remove("is-set");
    spinBtn.disabled = true;

    const turns = 6 + Math.floor(Math.random() * 3);
    const from = angle;
    const finalAngle = from + norm(targetMod - from) + turns * TAU;
    const proxy = { a: from };

    tween = window.gsap.to(proxy, {
      a: finalAngle,
      duration: 5,
      ease: "power4.out",
      onUpdate: () => {
        angle = proxy.a;
        draw();
      },
      onComplete: () => {
        spinning = false;
        tween = null;
        spinBtn.disabled = false;
        const name = names[w];
        reveal(name);
        if (window.callNames) window.callNames.take(name);
        updateCount();
      },
    });
  }

  function open() {
    refreshNames();
    highlight = -1;
    winnerEl.textContent = "";
    winnerEl.classList.remove("is-set");
    angle = POINTER;
    overlay.hidden = false;
    document.body.classList.add("wheel-open");
    updateCount();
    draw();
    spinBtn.disabled = false;
    spinBtn.focus();
  }

  function close() {
    if (tween) {
      tween.kill();
      tween = null;
    }
    spinning = false;
    spinBtn.disabled = false;
    overlay.hidden = true;
    document.body.classList.remove("wheel-open");
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  spinBtn.addEventListener("click", spin);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close(); // chỉ đóng khi bấm nền, không đóng khi bấm trong bảng
  });

  window.wheel = {
    open,
    close,
    spin,
    isOpen: () => !overlay.hidden,
    isSpinning: () => spinning,
  };
})();
