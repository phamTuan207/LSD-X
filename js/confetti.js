// gold-leaf burst — subtle, ceremonial. no deps.
const confetti = (() => {
  const canvas = document.getElementById("confetti");
  if (!canvas) return { burst() {} };
  const ctx = canvas.getContext("2d");
  let particles = [];
  let raf = null;
  // muted ceremonial palette: gold leaf + deep red + cream
  const COLORS = [
    [232, 185, 35],
    [245, 217, 122],
    [185, 28, 28],
    [247, 239, 228],
    [212, 175, 55],
  ];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function burst(x, y, count = 40) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const c = COLORS[(Math.random() * COLORS.length) | 0];
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.006 + Math.random() * 0.008,
        size: 3 + Math.random() * 5,
        c,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.15,
        drift: (Math.random() - 0.5) * 0.4,
      });
    }
    if (!raf) tick();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 0.12;
      p.x += p.vx + Math.sin(p.rot) * p.drift;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= p.decay;
      const alpha = Math.max(p.life, 0);
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // thin foil rectangle
      const [r, g, b] = p.c;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
      // soft highlight
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "rgb(255,255,255)";
      ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 8);
      ctx.restore();
    }
    if (particles.length) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return { burst };
})();
