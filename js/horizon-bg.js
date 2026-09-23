// horizon-bg.js — nền WebGL ceremonial (vanilla, không thư viện).
// Port shader EmeraldHorizon từ MengTo/threeui (MIT), recolored LSD.
// Nhận palette theo cảnh từ scenes.js và lerp mượt; nếu không có WebGL thì
// rơi về gradient tĩnh (.is-static). Reduced-motion: vẽ 1 khung tĩnh.
(() => {
  const host = document.getElementById("horizon-bg");
  if (!host) return;
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  // palette mặc định (crimson × gold) — admin không có scenes.js vẫn đẹp
  const DEFAULT = { base: [0.07, 0.03, 0.03], a: [0.72, 0.1, 0.08], b: [1.0, 0.78, 0.18], intensity: 0.85, y: 0 };

  const KEYS = ["base", "a", "b", "intensity", "y"];
  const cur = {};
  const tgt = {};
  let lerpMs = 1400;

  function setPalette(p, ms) {
    if (!p) return;
    for (const k of KEYS) {
      if (p[k] === undefined) continue;
      const v = Array.isArray(p[k]) ? p[k].slice() : p[k];
      if (!cur[k]) cur[k] = Array.isArray(v) ? v.slice() : v;
      tgt[k] = v;
    }
    lerpMs = Math.max(0, ms == null ? 1400 : ms);
    if (reduceQuery.matches) {
      for (const k of KEYS) if (tgt[k] !== undefined) cur[k] = Array.isArray(tgt[k]) ? tgt[k].slice() : tgt[k];
      draw();
    }
  }

  const canvas = document.createElement("canvas");
  host.appendChild(canvas);
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) {
    host.classList.add("is-static");
    window.horizonBg = { set: () => {}, ready: false };
    return;
  }

  const vsSrc = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const fsSrc = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_base;
    uniform vec3 u_glowA;
    uniform vec3 u_glowB;
    uniform float u_intensity;
    uniform float u_y;
    float hash(float n) { return fract(sin(n) * 1e4); }
    float noise(float x) {
      float i = floor(x);
      float f = fract(x);
      float u = f * f * (3.0 - 2.0 * f);
      return mix(hash(i), hash(i + 1.0), u);
    }
    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      float yPos = st.y + u_y;
      float wave1 = sin(st.x * 3.0 + u_time * 0.45) * 0.1;
      float wave2 = sin(st.x * 5.0 - u_time * 0.28) * 0.05;
      float intensity = smoothstep(0.55, -0.1, yPos + wave1 + wave2);
      float variation = noise(st.x * 2.0 + u_time * 0.1) * 0.5 + 0.5;
      intensity *= variation * 1.35;
      vec3 color = u_base;
      vec3 glow = mix(u_glowA, u_glowB, clamp(st.x + sin(u_time * 0.18) * 0.45, 0.0, 1.0));
      color += glow * pow(intensity, 1.6) * u_intensity;
      float vignette = smoothstep(1.35, 0.45, length(st - vec2(0.5, 0.15)));
      color *= vignette;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) {
    host.classList.add("is-static");
    window.horizonBg = { set: () => {}, ready: false };
    return;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {
    time: gl.getUniformLocation(prog, "u_time"),
    res: gl.getUniformLocation(prog, "u_resolution"),
    base: gl.getUniformLocation(prog, "u_base"),
    a: gl.getUniformLocation(prog, "u_glowA"),
    b: gl.getUniformLocation(prog, "u_glowB"),
    intensity: gl.getUniformLocation(prog, "u_intensity"),
    y: gl.getUniformLocation(prog, "u_y"),
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
    if (reduceQuery.matches) draw();
  }

  function upload() {
    gl.uniform3f(U.base, cur.base[0], cur.base[1], cur.base[2]);
    gl.uniform3f(U.a, cur.a[0], cur.a[1], cur.a[2]);
    gl.uniform3f(U.b, cur.b[0], cur.b[1], cur.b[2]);
    gl.uniform1f(U.intensity, cur.intensity);
    gl.uniform1f(U.y, cur.y);
  }

  function draw(time) {
    gl.uniform1f(U.time, time || 0);
    upload();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // khởi tạo palette hiện tại
  for (const k of KEYS) {
    cur[k] = Array.isArray(DEFAULT[k]) ? DEFAULT[k].slice() : DEFAULT[k];
    tgt[k] = Array.isArray(DEFAULT[k]) ? DEFAULT[k].slice() : DEFAULT[k];
  }

  let raf = 0;
  let last = performance.now();
  const t0 = performance.now();

  function step(now) {
    const dt = Math.min(now - last, 60);
    last = now;
    if (lerpMs > 0) {
      const f = 1 - Math.exp((-dt / lerpMs) * 3);
      for (const k of KEYS) {
        if (Array.isArray(cur[k])) {
          for (let i = 0; i < cur[k].length; i += 1) cur[k][i] += (tgt[k][i] - cur[k][i]) * f;
        } else {
          cur[k] += (tgt[k] - cur[k]) * f;
        }
      }
    }
    if (document.hidden) { raf = 0; return; }
    draw((now - t0) * 0.001);
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (raf || reduceQuery.matches) return;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) start();
  });
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", () => {
      if (reduceQuery.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        for (const k of KEYS) if (Array.isArray(tgt[k])) cur[k] = tgt[k].slice(); else cur[k] = tgt[k];
        draw(0);
      } else {
        start();
      }
    });
  }

  resize();
  if (reduceQuery.matches) draw(0); else start();

  window.horizonBg = { set: setPalette, ready: true, reduced: reduceQuery.matches };
})();
