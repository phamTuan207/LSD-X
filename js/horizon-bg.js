// Crimson Horizon — vanilla WebGL port of ThreeUI EmeraldHorizonBackground
// Source: MengTo/threeui (MIT), emerald-horizon shaders, recolored for LSD palette.
(() => {
  const host = document.getElementById("horizon-bg");
  if (!host) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    host.classList.add("is-static");
    return;
  }

  const canvas = document.createElement("canvas");
  host.appendChild(canvas);
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) {
    host.classList.add("is-static");
    return;
  }

  const vsSrc = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  // Port of LUMINA_FRAGMENT_SHADER — crimson/gold ceremonial palette
  const fsSrc = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    float hash(float n) { return fract(sin(n) * 1e4); }
    float noise(float x) {
      float i = floor(x);
      float f = fract(x);
      float u = f * f * (3.0 - 2.0 * f);
      return mix(hash(i), hash(i + 1.0), u);
    }
    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      float yPos = st.y;
      float wave1 = sin(st.x * 3.0 + u_time * 0.45) * 0.1;
      float wave2 = sin(st.x * 5.0 - u_time * 0.28) * 0.05;
      float combinedWave = wave1 + wave2;
      float intensity = smoothstep(0.55, -0.1, yPos + combinedWave);
      float variation = noise(st.x * 2.0 + u_time * 0.1) * 0.5 + 0.5;
      intensity *= variation * 1.35;
      // base: deep maroon-black
      vec3 color = vec3(0.07, 0.03, 0.03);
      // glow: crimson -> gold across x, breathing with time
      vec3 crimson = vec3(0.72, 0.1, 0.08);
      vec3 gold = vec3(1.0, 0.78, 0.18);
      vec3 finalGlow = mix(crimson, gold, st.x + sin(u_time * 0.18) * 0.45);
      color += finalGlow * pow(intensity, 1.6) * 0.85;
      // soft vignette
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

  const uTime = gl.getUniformLocation(prog, "u_time");
  const uRes = gl.getUniformLocation(prog, "u_resolution");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }

  let raf = 0;
  const t0 = performance.now();
  function frame(now) {
    if (document.hidden) {
      raf = 0;
      return;
    }
    gl.uniform1f(uTime, (now - t0) * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !raf) raf = requestAnimationFrame(frame);
  });

  resize();
  raf = requestAnimationFrame(frame);
})();
