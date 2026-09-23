// emblem.js — "model 3D" trung tâm: nhiều lớp SVG xếp theo trục Z trên một
// stage preserve-3d, nên khi xoay/nghiêng sẽ tách lớp tạo chiều sâu thật.
// Hai biến thể: sao vàng 5 cánh & hoa sen. Di chuyển ngang khi đổi câu.
// Nhẹ, không model nặng, không WebGL. Tôn trọng prefers-reduced-motion.
(() => {
  const host = document.getElementById("emblem");
  if (!host) return;

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hasGsap = () => typeof window.gsap !== "undefined";

  // —— hình học ——
  function starPoints(R = 92, r = 38, cx = 0, cy = 0) {
    const out = [];
    for (let i = 0; i < 10; i += 1) {
      const rad = i % 2 === 0 ? R : r;
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      out.push(`${(cx + Math.cos(ang) * rad).toFixed(2)},${(cy + Math.sin(ang) * rad).toFixed(2)}`);
    }
    return out.join(" ");
  }

  const PETAL = "M0,12 C -27,-14 -21,-70 0,-98 C 21,-70 27,-14 0,12 Z";

  function petals(angles, scale, opacity) {
    return angles
      .map((a) => `<path d="${PETAL}" transform="rotate(${a} 0 18) scale(${scale})" opacity="${opacity}"/>`)
      .join("");
  }

  function starSvg() {
    return `
      <circle cx="0" cy="0" r="104" fill="none" stroke="currentColor" stroke-width="1" opacity="0.28"/>
      <circle cx="0" cy="0" r="82" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.18"/>
      <polygon points="${starPoints(88, 36)}" fill="currentColor" opacity="0.92"/>
      <polygon points="${starPoints(88, 36)}" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.5"/>
      <polygon points="${starPoints(48, 20)}" fill="#fff" opacity="0.16"/>`;
  }

  function lotusSvg() {
    return `
      <circle cx="0" cy="0" r="106" fill="none" stroke="currentColor" stroke-width="1" opacity="0.26"/>
      <g transform="translate(0 30)">
        <g fill="currentColor" opacity="0.42">${petals([-64, -32, 0, 32, 64], 1, 1)}</g>
        <g fill="currentColor" opacity="0.72">${petals([-30, 0, 30], 0.78, 1)}</g>
        <g fill="#fff" opacity="0.18">${petals([0], 0.5, 1)}</g>
        <ellipse cx="0" cy="14" rx="62" ry="7" fill="currentColor" opacity="0.18"/>
      </g>`;
  }

  const VARIANTS = { star: starSvg, lotus: lotusSvg };

  function hexToRgba(hex, a) {
    let h = String(hex).replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  // —— dựng DOM: đèn sân khấu (linear) → khối 3D ——
  const light = document.createElement("div");
  light.className = "emblem-light";
  const parallax = document.createElement("div");
  parallax.className = "emblem-parallax";
  const stage = document.createElement("div");
  stage.className = "emblem-stage";
  parallax.appendChild(stage);
  host.append(light, parallax);

  const LAYERS = [
    { z: -110, o: 0.3 },
    { z: -40, o: 0.5 },
    { z: 40, o: 0.72 },
    { z: 110, o: 1 },
  ];
  let layers = [];
  let variant = "";

  function build(v) {
    if (v === variant) return;
    variant = v;
    stage.textContent = "";
    layers = LAYERS.map(({ z, o }) => {
      const el = document.createElement("div");
      el.className = "emblem-layer";
      el.style.setProperty("--z", `${z}px`);
      el.style.setProperty("--o", String(o));
      el.innerHTML = `<svg viewBox="-120 -120 240 240" width="100%" height="100%" aria-hidden="true">${VARIANTS[v]()}</svg>`;
      stage.appendChild(el);
      return el;
    });
  }

  let current = 0;
  let tweens = [];

  function killMotion() {
    if (!hasGsap()) return;
    tweens.forEach((t) => t && t.kill && t.kill());
    tweens = [];
    window.gsap.killTweensOf([stage, parallax]);
  }

  function startMotion() {
    if (!hasGsap() || reduceQuery.matches) return;
    killMotion();
    const g = window.gsap;
    g.set(stage, { transformPerspective: 1400, transformStyle: "preserve-3d" });
    g.set(parallax, { transformPerspective: 1600, transformStyle: "preserve-3d" });
    // nhịp thở nhẹ — không xoay loạn
    tweens.push(g.to(stage, { y: -16, duration: 4.4, ease: "sine.inOut", yoyo: true, repeat: -1 }));
    tweens.push(g.to(stage, { rotationY: 9, rotationX: -4, duration: 8, ease: "sine.inOut", yoyo: true, repeat: -1 }));
  }

  function setScene(i) {
    const s = window.scenes && window.scenes.SCENES ? window.scenes.SCENES[i] : null;
    if (!s) return;
    current = i;
    build(s.emblem || "star");
    const tint = s.emblemTint || "#f0c85a";
    host.style.setProperty("--emblem-tint", tint);
    host.style.setProperty("--emblem-glow", hexToRgba(tint, 0.2));
    host.dataset.variant = s.emblem || "star";
    if (hasGsap() && !reduceQuery.matches) {
      window.gsap.fromTo(layers, { opacity: 0 }, { opacity: (k) => LAYERS[k].o, duration: 0.9, ease: "power2.out", stagger: 0.05 });
    } else {
      layers.forEach((el, k) => el.style.setProperty("--o", String(LAYERS[k].o)));
    }
  }

  // direction: 1 = câu kế (trượt từ phải sang), -1 = câu trước
  function nudge(direction) {
    if (!hasGsap() || reduceQuery.matches) return;
    window.gsap.fromTo(
      stage,
      { x: 120 * direction, opacity: 0.25, scale: 0.96 },
      { x: 0, opacity: 1, scale: 1, duration: 0.8, ease: "expo.out", overwrite: "auto" },
    );
  }

  // —— parallax theo con trỏ ——
  // Gắn luôn listener rồi tự bỏ qua sự kiện touch, thay vì phụ thuộc
  // media query (hover/pointer) vốn sai trên vài thiết bị.
  let qx = null;
  let qy = null;
  let qpx = null;
  let qpy = null;

  function onPointer(e) {
    if (e.pointerType === "touch") return;
    if (!qx || !qpx) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    qx(nx * -9);
    qy(ny * 6);
    qpx(nx * 16);
    qpy(ny * 12);
  }

  function resetPointer() {
    if (!qpx) return;
    qx(0);
    qy(0);
    qpx(0);
    qpy(0);
  }

  function enableParallax() {
    if (!hasGsap() || reduceQuery.matches) return;
    const g = window.gsap;
    qx = g.quickTo(parallax, "rotationY", { duration: 0.9, ease: "power3.out" });
    qy = g.quickTo(parallax, "rotationX", { duration: 0.9, ease: "power3.out" });
    qpx = g.quickTo(parallax, "x", { duration: 1, ease: "power3.out" });
    qpy = g.quickTo(parallax, "y", { duration: 1, ease: "power3.out" });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("mouseleave", resetPointer);
  }

  function disableParallax() {
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("mouseleave", resetPointer);
    qx = null;
    qy = null;
    qpx = null;
    qpy = null;
    if (hasGsap()) window.gsap.set(parallax, { rotationX: 0, rotationY: 0, x: 0, y: 0 });
  }

  build("star");
  setScene(0);
  startMotion();
  enableParallax();

  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", () => {
      if (reduceQuery.matches) {
        killMotion();
        disableParallax();
        if (hasGsap()) window.gsap.set(stage, { x: 0, y: 0, rotationX: 0, rotationY: 0, opacity: 1 });
        layers.forEach((el, k) => el.style.setProperty("--o", String(LAYERS[k].o)));
      } else {
        startMotion();
        enableParallax();
      }
    });
  }

  window.emblem = { setScene, nudge, variant: () => variant, index: () => current };
})();
