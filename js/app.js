// Lịch Sử Đảng — Đại Hội X | Nhóm 4
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startGame() {
  const wantShuffle = document.getElementById("opt-shuffle").checked;
  const base = getBank() || state.questions;
  state.questions = wantShuffle ? shuffle(base) : [...base];
  state.index = 0;
  state.score = 0;
  state.wrongIds = [];
  document.getElementById("start").hidden = true;
  document.getElementById("result").hidden = true;
  renderQuestion();
}

const pickerState = { names: [], pool: [] };

async function loadPickerNames() {
  const raw = localStorage.getItem("lsd-dhx-names");
  if (raw && raw.trim()) {
    document.getElementById("picker-names").value = raw;
    return;
  }
  try {
    const res = await fetch("data/names.json");
    if (!res.ok) return;
    const names = await res.json();
    const text = names.join("\n");
    document.getElementById("picker-names").value = text;
    localStorage.setItem("lsd-dhx-names", text);
  } catch { /* keep empty */ }
}

function savePickerNames() {
  localStorage.setItem(
    "lsd-dhx-names",
    document.getElementById("picker-names").value,
  );
}

function showPicker() {
  document.getElementById("start").hidden = true;
  document.getElementById("quiz").hidden = true;
  document.getElementById("result").hidden = true;
  document.getElementById("picker").hidden = false;
}

function hidePicker() {
  document.getElementById("picker").hidden = true;
  document.getElementById("start").hidden = false;
}

function pickName() {
  const lines = document
    .getElementById("picker-names")
    .value.split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  savePickerNames();

  if (!lines.length) {
    alert("Nhap danh sach ten truoc");
    return;
  }

  const key = lines.join("|");
  if (pickerState.names.join("|") !== key) {
    pickerState.names = lines;
    pickerState.pool = [...lines];
  }

  if (!pickerState.pool.length) {
    pickerState.pool = [...lines];
  }

  const i = Math.floor(Math.random() * pickerState.pool.length);
  const name = pickerState.pool.splice(i, 1)[0];
  const left = pickerState.pool.length;

  const el = document.getElementById("picker-result");
  el.hidden = false;
  el.textContent = name;
  document.getElementById("picker-hint").textContent =
    left > 0
      ? `Con ${left} ten chua goi.`
      : "Het danh sach — vong moi bat dau.";
}

function spawnStars() {
  const layer = document.getElementById("stars-layer");
  if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 14; i += 1) {
    const s = document.createElement("span");
    s.className = "star";
    s.textContent = "★";
    s.style.left = `${Math.random() * 100}%`;
    s.style.fontSize = `${8 + Math.random() * 12}px`;
    s.style.animationDuration = `${9 + Math.random() * 14}s`;
    s.style.animationDelay = `${Math.random() * 12}s`;
    layer.appendChild(s);
  }
}

const state = {
  questions: [],
  index: 0,
  locked: false,
  score: 0,
  wrongIds: [],
  animating: false,
};

function getBank() {
  const raw = localStorage.getItem("lsd-dhx-questions");
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  return null;
}

async function loadQuestions() {
  const local = getBank();
  if (local && local.length) return local;
  const res = await fetch("data/questions.json");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// unified transition — native scroll feel: wheel down → old slides UP, new enters from BOTTOM
function animateQuestionIn() {
  if (typeof gsap === "undefined") {
    state.animating = false;
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    state.animating = false;
    return;
  }
  const tl = gsap.timeline({ onComplete: () => { state.animating = false; } });
  tl.fromTo(
    ".question-card",
    { y: 56, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
  );
  tl.fromTo(
    "#question-text",
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
    "-=0.2",
  );
  tl.fromTo(
    ".option",
    { opacity: 0, x: -12 },
    { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" },
    "-=0.15",
  );
}

function animateFeedbackIn() {
  if (typeof gsap === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.fromTo(
    "#feedback",
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
  );
}

function renderQuestion() {
  const q = state.questions[state.index];
  if (!q) return;
  state.locked = false;

  document.getElementById("quiz-section").textContent = q.section;
  document.getElementById("quiz-progress").textContent =
    `Câu ${state.index + 1} / ${state.questions.length}`;
  document.getElementById("progress-fill").style.width =
    `${((state.index + 1) / state.questions.length) * 100}%`;
  document.getElementById("question-text").textContent = q.question;

  document.getElementById("feedback").hidden = true;

  const optionsEl = document.getElementById("options");
  optionsEl.innerHTML = "";
  for (const [key, text] of Object.entries(q.options)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.key = key;
    btn.innerHTML =
      `<span class="option-key">${key}</span><span>${text}</span>`;
    btn.addEventListener("click", () => onPick(key, btn));
    optionsEl.appendChild(btn);
  }

  document.getElementById("loading").hidden = true;
  document.getElementById("result").hidden = true;
  document.getElementById("quiz").hidden = false;
  animateQuestionIn();
}

function onPick(key, btn) {
  if (state.locked) return;
  state.locked = true;

  const q = state.questions[state.index];
  const correct = key === q.answer;
  if (correct) {
    state.score += 1;
    // subtle gold-leaf: center card, restrained count
    const card = document.querySelector(".question-card");
    const rect = card ? card.getBoundingClientRect() : null;
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height * 0.3 : window.innerHeight * 0.35;
    confetti.burst(cx, cy, 36);
  } else {
    state.wrongIds.push(q.id);
  }

  for (const el of document.querySelectorAll(".option")) {
    el.disabled = true;
    if (el.dataset.key === q.answer) el.classList.add("is-correct");
    else if (el === btn) el.classList.add("is-wrong");
  }

  const verdict = document.getElementById("feedback-verdict");
  verdict.textContent = correct
    ? "Chính xác!"
    : `Sai roi — dap an dung la ${q.answer}`;
  verdict.className = `feedback-verdict ${correct ? "ok" : "bad"}`;

  document.getElementById("feedback-explain").textContent = q.explanation || "";
  document.getElementById("feedback-source").textContent = q.source
    ? `Van kien: ${q.source}`
    : "";
  document.getElementById("feedback").hidden = false;
  animateFeedbackIn();

  const nextBtn = document.getElementById("btn-next");
  const isLast = state.index >= state.questions.length - 1;
  nextBtn.textContent = isLast ? "Xem ket qua →" : "Cau tiep theo →";
}

function showResult() {
  const total = state.questions.length;
  const pct = Math.round((state.score / total) * 100);

  document.getElementById("quiz").hidden = true;
  document.getElementById("result").hidden = false;
  document.getElementById("result-score").textContent =
    `${state.score}/${total}`;

  if (pct >= 75) {
    // gentle gold rain across top, staggered — not fireworks
    for (let i = 0; i < 5; i += 1) {
      setTimeout(
        () => confetti.burst(window.innerWidth * (0.15 + i * 0.175), 40, 20),
        i * 160,
      );
    }
  }

  let msg = "Cung co co day, tap them nua!";
  if (pct >= 90) msg = "Xuat sac! Dang cap nha lich su!";
  else if (pct >= 75) msg = "Gioi lam! Nang luc manh day.";
  else if (pct >= 50) msg = "Duoc, nhung chua day du.";
  document.getElementById("result-msg").textContent = msg;

  const detail = state.wrongIds.length
    ? `Sai ca: ${state.wrongIds.join(", ")}`
    : "Khong sai ca nao.uy tuyet!";
  document.getElementById("result-detail").textContent = detail;
}

function advance() {
  if (state.animating) return;
  if (!state.locked) return; // only after answered — one gate for button/wheel/Enter

  const go = () => {
    if (state.index >= state.questions.length - 1) {
      showResult();
      state.animating = false;
      return;
    }
    state.index += 1;
    renderQuestion();
  };

  if (typeof gsap === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    go();
    return;
  }

  state.animating = true;
  gsap.to(".question-card", {
    y: -56,
    opacity: 0,
    duration: 0.32,
    ease: "power2.in",
    onComplete: go,
  });
}

// wheel / trackpad: down = next, only when answered, debounced by state.animating
function onWheel(e) {
  const quiz = document.getElementById("quiz");
  if (!quiz || quiz.hidden) return;
  if (e.deltaY < 24) return;
  e.preventDefault();
  advance();
}

// touch: finger swipe UP = next (matches native scroll-down)
function initSwipe() {
  let y0 = null;
  document.addEventListener("touchstart", (e) => {
    y0 = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (y0 == null) return;
    const dy = e.changedTouches[0].clientY - y0;
    y0 = null;
    if (dy < -80) advance();
  }, { passive: true });
}

function nextQuestion() {
  advance();
}

function onKey(e) {
  if (e.repeat) return;
  const key = e.key.toUpperCase();

  if (document.getElementById("start") && !document.getElementById("start").hidden) {
    if (key === "ENTER" || key === " ") {
      e.preventDefault();
      startGame();
    }
    return;
  }

  if (document.getElementById("quiz") && !document.getElementById("quiz").hidden) {
    if (["A", "B", "C", "D"].includes(key)) {
      const btn = document.querySelector(`.option[data-key="${key}"]`);
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
      return;
    }
    if (key === "ENTER" && state.locked) {
      e.preventDefault();
      advance();
    }
    return;
  }

  if (document.getElementById("result") && !document.getElementById("result").hidden) {
    if (key === "ENTER") {
      e.preventDefault();
      retry();
    }
  }
}

function retry() {
  document.getElementById("result").hidden = true;
  document.getElementById("quiz").hidden = true;
  document.getElementById("picker").hidden = true;
  document.getElementById("start").hidden = false;
}

document.addEventListener("DOMContentLoaded", async () => {
  spawnStars();
  loadPickerNames();
  document.addEventListener("keydown", onKey);
  document.addEventListener("wheel", onWheel, { passive: false });
  initSwipe();
  document.getElementById("btn-toggle-picker").addEventListener("click", showPicker);
  document.getElementById("btn-picker-back").addEventListener("click", hidePicker);
  document.getElementById("btn-pick").addEventListener("click", pickName);
  document.getElementById("picker-names").addEventListener("change", savePickerNames);
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  document.getElementById("btn-retry").addEventListener("click", retry);
  try {
    state.questions = await loadQuestions();
    document.getElementById("loading").hidden = true;
    document.getElementById("start").hidden = false;
  } catch (err) {
    document.getElementById("loading").textContent =
      `Khong tai duoc cau hoi: ${err.message}`;
  }
});
