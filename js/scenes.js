// scenes.js — 10 cảnh nền ceremonial cho 30 câu (mỗi cảnh 3 câu).
// Cơ chế: các lớp CSS gradient xếp chồng, crossfade bằng opacity (mượt, rẻ),
// + 1 canvas 2D cho hạt theo cảnh, + đẩy palette sang WebGL horizon và emblem.
// Không phụ thuộc thư viện. Tôn trọng prefers-reduced-motion.
(() => {
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isSmall = () => window.innerWidth < 700;

  // Mỗi cảnh: bầu trời 3 điểm, nguồn sáng, hoa văn, hạt, emblem, palette horizon.
  const SCENES = [
    {
      id: "khoi-nguyen", name: "Khởi nguyên",
      sky: ["#07050f", "#150a13", "#2b0d10"],
      glow: "rgba(240,160,70,0.42)", glowAngle: "4deg",
      pattern: "rays", particles: "embers", tint: [255, 190, 110],
      emblem: "star", emblemTint: "#f2c65c",
      horizon: { base: [0.035, 0.022, 0.045], a: [0.62, 0.20, 0.16], b: [1.0, 0.76, 0.32], intensity: 0.85, y: 0.0 },
    },
    {
      id: "mat-tran", name: "Mặt trận",
      sky: ["#110a08", "#23110b", "#3d1d0c"],
      glow: "rgba(255,175,70,0.40)", glowAngle: "7deg",
      pattern: "waves", particles: "motes", tint: [255, 205, 140],
      emblem: "star", emblemTint: "#f4c96a",
      horizon: { base: [0.05, 0.03, 0.02], a: [0.75, 0.32, 0.10], b: [1.0, 0.72, 0.26], intensity: 0.9, y: 0.03 },
    },
    {
      id: "dai-hoi", name: "Đại hội",
      sky: ["#0c0710", "#250b12", "#4d1017"],
      glow: "rgba(255,205,120,0.34)", glowAngle: "-4deg",
      pattern: "rays", particles: "dust", tint: [255, 225, 170],
      emblem: "star", emblemTint: "#f6d27a",
      horizon: { base: [0.05, 0.02, 0.035], a: [0.78, 0.13, 0.13], b: [1.0, 0.80, 0.38], intensity: 1.0, y: 0.05 },
    },
    {
      id: "khang-chien", name: "Kháng chiến",
      sky: ["#09090a", "#1e1512", "#351a0f"],
      glow: "rgba(255,120,40,0.36)", glowAngle: "3deg",
      pattern: "mist", particles: "embers", tint: [255, 150, 70],
      emblem: "star", emblemTint: "#e8a94e",
      horizon: { base: [0.045, 0.035, 0.03], a: [0.85, 0.26, 0.06], b: [1.0, 0.55, 0.14], intensity: 0.95, y: 0.02 },
    },
    {
      id: "xay-dung", name: "Xây dựng",
      sky: ["#070b10", "#0e1620", "#17232d"],
      glow: "rgba(150,200,255,0.22)", glowAngle: "9deg",
      pattern: "beam", particles: "dust", tint: [200, 220, 255],
      emblem: "star", emblemTint: "#e6c47a",
      horizon: { base: [0.03, 0.045, 0.06], a: [0.16, 0.34, 0.58], b: [0.95, 0.74, 0.34], intensity: 0.7, y: 0.06 },
    },
    {
      id: "sao-vang", name: "Sao vàng",
      sky: ["#05070f", "#0a0f1e", "#141b30"],
      glow: "rgba(255,215,120,0.30)", glowAngle: "0deg",
      pattern: "none", particles: "stars", tint: [255, 235, 180],
      emblem: "star", emblemTint: "#ffd76a",
      horizon: { base: [0.02, 0.03, 0.06], a: [0.30, 0.24, 0.42], b: [1.0, 0.84, 0.42], intensity: 0.6, y: 0.08 },
    },
    {
      id: "hoa-sen", name: "Hoa sen",
      sky: ["#04100f", "#08201f", "#0e302b"],
      glow: "rgba(255,170,190,0.24)", glowAngle: "-7deg",
      pattern: "mist", particles: "petals", tint: [255, 190, 205],
      emblem: "lotus", emblemTint: "#f6c9d4",
      water: true,
      horizon: { base: [0.02, 0.05, 0.05], a: [0.10, 0.42, 0.40], b: [1.0, 0.70, 0.72], intensity: 0.62, y: 0.05 },
    },
    {
      id: "phu-hieu", name: "Phù hiệu",
      sky: ["#06100c", "#0a1a13", "#10291d"],
      glow: "rgba(255,210,110,0.26)", glowAngle: "5deg",
      pattern: "rings", particles: "motes", tint: [255, 220, 150],
      emblem: "star", emblemTint: "#f0cf72",
      horizon: { base: [0.02, 0.045, 0.035], a: [0.12, 0.44, 0.30], b: [1.0, 0.80, 0.36], intensity: 0.6, y: 0.04 },
    },
    {
      id: "dem-len-den", name: "Đêm lên đèn",
      sky: ["#0a0709", "#170b10", "#2c1114"],
      glow: "rgba(255,170,80,0.28)", glowAngle: "0deg",
      pattern: "none", particles: "lanterns", tint: [255, 190, 110],
      emblem: "star", emblemTint: "#eec46a",
      horizon: { base: [0.04, 0.025, 0.03], a: [0.55, 0.16, 0.14], b: [1.0, 0.70, 0.28], intensity: 0.7, y: 0.0 },
    },
    {
      id: "binh-minh", name: "Bình minh",
      sky: ["#180b13", "#3a1520", "#6b2a22"],
      glow: "rgba(255,210,150,0.40)", glowAngle: "-3deg",
      pattern: "rays", particles: "motes", tint: [255, 225, 190],
      emblem: "lotus", emblemTint: "#ffd9a8",
      horizon: { base: [0.07, 0.03, 0.05], a: [0.90, 0.40, 0.30], b: [1.0, 0.86, 0.60], intensity: 0.9, y: 0.02 },
    },
  ];

  const stack = document.getElementById("scene-stack");
  const canvas = document.getElementById("scene-particles");
  if (!stack || !canvas) return;
  const ctx = canvas.getContext("2d");

  // —— dựng lớp cảnh ——
  const layers = SCENES.map((s, i) => {
    const el = document.createElement("div");
    el.className = "scene";
    el.dataset.scene = String(i);
    el.dataset.pattern = s.pattern;
    el.style.setProperty("--s-sky-0", s.sky[0]);
    el.style.setProperty("--s-sky-1", s.sky[1]);
    el.style.setProperty("--s-sky-2", s.sky[2]);
    el.style.setProperty("--s-glow", s.glow);
    el.style.setProperty("--s-glow-angle", s.glowAngle);
    stack.appendChild(el);
    return el;
  });

  let current = -1;

  function set(i, opts) {
    const n = SCENES.length;
    const idx = ((i % n) + n) % n;
    if (idx === current) return;
    const instant = (opts && opts.instant) || reduceQuery.matches;
    const prev = layers[current];
    if (prev) prev.classList.remove("is-active");
    layers[idx].classList.toggle("is-instant", instant);
    layers[idx].classList.add("is-active");
    current = idx;

    const scene = SCENES[idx];
    // palette cho WebGL horizon (tự lerp bên trong horizon-bg.js)
    if (window.horizonBg && window.horizonBg.set) {
      window.horizonBg.set(scene.horizon, instant ? 0 : 1400);
    }
    if (window.emblem && window.emblem.setScene) window.emblem.setScene(idx);
    restartParticles(scene.particles, scene.tint, instant);
    if (!scene.water) ripples = [];
  }

  // —— hạt theo cảnh ——
  let particles = [];
  let kinds = "dust";
  let tint = [255, 225, 170];
  let raf = 0;
  let dpr = 1;

  // —— hồ nước: gợn lan theo con trỏ (chỉ cảnh có nước) ——
  let ripples = [];
  let lastRX = 0;
  let lastRY = 0;

  function spawnRipple(x, y, strength) {
    ripples.push({
      x,
      y,
      r: 3 + strength * 2,
      max: 46 + strength * 58,
      a: 0.3 * strength,
      w: 1 + strength * 0.7,
    });
    if (ripples.length > 20) ripples.shift();
  }

  function stepRipples(dt) {
    if (!ripples.length) return;
    for (const rp of ripples) {
      rp.r += (22 + (rp.max - rp.r) * 2.6) * dt;
      rp.a -= dt * 0.34;
    }
    ripples = ripples.filter((rp) => rp.a > 0.005 && rp.r < rp.max);
  }

  function drawRipples() {
    for (const rp of ripples) {
      const ry = rp.r * 0.34;
      // vòng nước bắt sáng ở phía trên, chìm dần xuống dưới → đọc ra mặt nước
      const grad = ctx.createLinearGradient(rp.x, rp.y - ry, rp.x, rp.y + ry);
      grad.addColorStop(0, `rgba(233, 250, 245, ${rp.a})`);
      grad.addColorStop(0.55, `rgba(208, 238, 232, ${rp.a * 0.42})`);
      grad.addColorStop(1, `rgba(186, 224, 218, ${rp.a * 0.12})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = rp.w;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, ry, 0, 0, 6.283);
      ctx.stroke();
    }
  }

  function isWater() {
    return !!(SCENES[current] && SCENES[current].water);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    if (reduceQuery.matches) drawOnce();
  }

  const rand = (a, b) => a + Math.random() * (b - a);

  function makeParticle(kind) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const base = { kind, x: rand(0, w), y: rand(0, h), a: 0, life: 1, seed: rand(0, 6.28) };
    switch (kind) {
      case "embers":
        return { ...base, y: rand(h * 0.55, h + 40), r: rand(1, 2.6), vy: rand(-26, -12), vx: rand(-8, 8), a: rand(0.25, 0.7), a2: 0 };
      case "lanterns":
        return { ...base, y: rand(h * 0.6, h + 60), r: rand(6, 16), vy: rand(-16, -7), vx: rand(-10, 10), a: rand(0.1, 0.26), a2: 0 };
      case "petals":
        return { ...base, y: rand(-40, h * 0.4), r: rand(3, 7), vy: rand(10, 22), vx: rand(-14, 14), rot: rand(0, 6.28), vr: rand(-0.5, 0.5), a: rand(0.2, 0.5), a2: 0 };
      case "stars":
        return { ...base, r: rand(0.7, 1.9), vy: 0, vx: 0, a: rand(0.2, 0.65), tw: rand(0.4, 1.6), a2: 0 };
      case "motes":
        return { ...base, r: rand(0.8, 2.1), vy: rand(-9, 9), vx: rand(-12, 12), a: rand(0.12, 0.34), a2: 0 };
      default: // dust
        return { ...base, r: rand(0.6, 1.6), vy: rand(-6, 6), vx: rand(-16, 16), a: rand(0.08, 0.22), a2: 0 };
    }
  }

  function spawnCount() {
    if (isSmall()) return 34;
    return 72;
  }

  function restartParticles(kind, t, instant) {
    kinds = kind;
    tint = t;
    particles = [];
    if (reduceQuery.matches) { drawOnce(); return; }
    for (let i = 0; i < spawnCount(); i += 1) {
      const p = makeParticle(kind);
      p.a2 = instant ? p.a : p.a * 0.25; // fade in khi đổi cảnh
      particles.push(p);
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  const [TR, TG, TB] = [0, 1, 2];

  function drawOnce() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // trạng thái tĩnh: rải hạt tĩnh, alpha thấp
    ctx.fillStyle = `rgba(${tint[TR]},${tint[TG]},${tint[TB]},0.18)`;
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }
  }

  let last = 0;
  function tick(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // mặt hồ trước, rồi hạt rơi lên trên
    if (isWater()) {
      stepRipples(dt);
      drawRipples();
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const [r, g, b] = tint;

    for (const p of particles) {
      p.a2 += (p.a - p.a2) * 0.03; // fade mượt khi vào cảnh
      if (p.kind === "stars") {
        const tw = 0.55 + 0.45 * Math.sin(now * 0.001 * p.tw + p.seed);
        ctx.globalAlpha = p.a2 * tw;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "petals") p.rot += p.vr * dt;

      // quấn vòng
      if (p.kind === "petals") {
        if (p.y > h + 30 || p.x < -40 || p.x > w + 40) Object.assign(p, makeParticle("petals"), { y: -30, a2: 0 });
      }
      if (p.kind === "embers" || p.kind === "lanterns") {
        if (p.y < -40) Object.assign(p, makeParticle(p.kind), { y: h + 30, a2: 0 });
      }
      if (p.kind === "motes" || p.kind === "dust") {
        if (p.x < -30) p.x = w + 20;
        if (p.x > w + 30) p.x = -20;
        if (p.y < -30) p.y = h + 20;
        if (p.y > h + 30) p.y = -20;
      }

      ctx.globalAlpha = p.a2;
      if (p.kind === "petals") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === "lanterns") {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.globalAlpha = p.a2;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      } else if (p.kind === "embers") {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (document.hidden) { raf = 0; return; }
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !raf && !reduceQuery.matches) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  });
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", () => {
      particles = [];
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      set(current, { instant: true });
    });
  }

  // —— cả nền trôi nhẹ theo con trỏ (1 transform trên cả stack, rất rẻ) ——
  let driftRaf = 0;
  let driftX = 0;
  let driftY = 0;

  function applyDrift() {
    driftRaf = 0;
    stack.style.setProperty("--sx", `${driftX.toFixed(1)}px`);
    stack.style.setProperty("--sy", `${driftY.toFixed(1)}px`);
  }

  function onScenePointer(e) {
    if (e.pointerType === "touch" || reduceQuery.matches) return;
    driftX = ((e.clientX / window.innerWidth) * 2 - 1) * 14;
    driftY = ((e.clientY / window.innerHeight) * 2 - 1) * 10;
    if (!driftRaf) driftRaf = requestAnimationFrame(applyDrift);

    // con trỏ lướt trên mặt nước → gợn lan ra
    if (isWater()) {
      if (lastRX === 0 && lastRY === 0) {
        lastRX = e.clientX;
        lastRY = e.clientY;
        return;
      }
      const dx = e.clientX - lastRX;
      const dy = e.clientY - lastRY;
      const d2 = dx * dx + dy * dy;
      if (d2 > 480) {
        spawnRipple(e.clientX, e.clientY, 1);
        // vuốt nhanh → thêm vệt nước phía sau cho liền mạch
        if (d2 > 3600) {
          spawnRipple(
            e.clientX - dx * 0.45 + rand(-4, 4),
            e.clientY - dy * 0.45 + rand(-4, 4),
            0.6,
          );
        }
        lastRX = e.clientX;
        lastRY = e.clientY;
      }
    }
  }

  function onSceneDown(e) {
    if (e.pointerType === "touch" || reduceQuery.matches || !isWater()) return;
    spawnRipple(e.clientX, e.clientY, 1.9);
    setTimeout(() => spawnRipple(e.clientX, e.clientY, 1.2), 140);
  }

  function resetDrift() {
    driftX = 0;
    driftY = 0;
    if (!driftRaf) driftRaf = requestAnimationFrame(applyDrift);
  }

  window.addEventListener("pointermove", onScenePointer, { passive: true });
  window.addEventListener("pointerdown", onSceneDown, { passive: true });
  document.addEventListener("mouseleave", resetDrift);

  resize();
  set(0, { instant: true }); // màn khởi động cũng có cảnh, không chỉ horizon

  window.scenes = {
    set,
    index: () => current,
    count: () => SCENES.length,
    SCENES,
  };
})();
