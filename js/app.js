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
  const section = document.getElementById("opt-section").value;
  const base = getBank() || state.questions;
  const pool = section ? base.filter((q) => q.section === section) : base;
  state.questions = wantShuffle ? shuffle(pool) : [...pool];
  if (!state.questions.length) return;
  state.index = 0;
  state.score = 0;
  state.wrongIds = [];
  state.answers = {};
  state.direction = 1;
  state.teams = readTeams();
  state.activeTeam = state.teams.length ? null : 0;
  document.getElementById("start").hidden = true;
  document.getElementById("result").hidden = true;
  renderQuestion();
}

// fill section filter from bank (sections may be edited in admin)
function fillSectionOptions(questions) {
  const sel = document.getElementById("opt-section");
  const current = sel.value;
  const sections = [...new Set(questions.map((q) => q.section).filter(Boolean))];
  sel.innerHTML = '<option value="">Tất cả</option>';
  for (const s of sections) {
    const o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    sel.appendChild(o);
  }
  if (sections.includes(current)) sel.value = current;
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

function toggleOptions() {
  const panel = document.getElementById("start-options");
  const btn = document.getElementById("btn-options");
  const open = panel.hidden;
  panel.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
}

function nameLines() {
  return document
    .getElementById("picker-names")
    .value.split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// pool "tên chưa gọi" dùng chung cho cả Rút tên lẫn Vòng quay
function syncPickerPool(lines) {
  if (pickerState.names.join("|") !== lines.join("|")) {
    pickerState.names = lines;
    pickerState.pool = [...lines];
  }
  if (!pickerState.pool.length) pickerState.pool = [...lines];
}

function pickName() {
  savePickerNames();
  if (!nameLines().length) {
    alert("Nhập danh sách tên trước");
    return;
  }

  const lines = nameLines();
  syncPickerPool(lines);
  const i = Math.floor(Math.random() * pickerState.pool.length);
  const name = pickerState.pool.splice(i, 1)[0];
  const left = pickerState.pool.length;

  const el = document.getElementById("picker-result");
  el.hidden = false;
  el.textContent = name;
  document.getElementById("picker-hint").textContent =
    left > 0
      ? `Còn ${left} tên chưa gọi.`
      : "Hết danh sách, vòng mới bắt đầu.";
}

// cầu nối cho js/wheel.js
window.callNames = {
  all: () => nameLines(),
  pool() {
    const lines = nameLines();
    if (!lines.length) return [];
    syncPickerPool(lines);
    return pickerState.pool.slice();
  },
  take(name) {
    pickerState.pool = pickerState.pool.filter((n) => n !== name);
  },
  left: () => pickerState.pool.length,
};

const state = {
  questions: [],
  index: 0,
  locked: false,
  score: 0,
  wrongIds: [],
  answers: {},
  direction: 1,
  animating: false,
  teams: [],
  activeTeam: 0,
  answerSnapshot: null,
};

function readTeams() {
  const mode = document.getElementById("opt-mode").value;
  if (mode === "solo") return [];
  const count = Number(mode);
  return Array.from({ length: count }, (_, i) => ({
    name: document.getElementById(`team-name-${i}`).value.trim() || `Đội ${i + 1}`,
    score: 0,
    streak: 0,
    bestStreak: 0,
  }));
}

function renderTeamBoard() {
  const board = document.getElementById("team-scoreboard");
  board.innerHTML = "";
  board.hidden = !state.teams.length;
  if (!state.teams.length) return;

  const label = document.createElement("span");
  label.className = "team-board-label";
  label.textContent = state.activeTeam == null
    ? "Chọn đội giơ tay nhanh nhất"
    : "Đội giơ tay nhanh nhất";
  board.appendChild(label);

  state.teams.forEach((team, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.disabled = state.locked;
    button.className = `team-chip${index === state.activeTeam ? " is-active" : ""}`;
    button.setAttribute("aria-pressed", String(index === state.activeTeam));
    button.textContent = `${team.name} · ${team.score} điểm`;
    button.addEventListener("click", () => {
      if (state.locked) return;
      state.activeTeam = index;
      renderTeamBoard();
      document.querySelectorAll(".option").forEach((option) => {
        option.disabled = false;
      });
    });
    board.appendChild(button);
  });
}

function syncTeamSetup() {
  const mode = document.getElementById("opt-mode").value;
  const setup = document.getElementById("team-setup");
  const previousNames = [...setup.querySelectorAll("input")].map((input) => input.value);
  setup.hidden = mode === "solo";
  setup.innerHTML = "";
  if (mode === "solo") return;

  const defaults = ["Nhóm 1", "Nhóm 2", "Nhóm 3", "Nhóm 4", "Nhóm 5", "Nhóm 6"];
  for (let i = 0; i < Number(mode); i += 1) {
    const field = document.createElement("label");
    field.className = "team-name-field";
    const label = document.createElement("span");
    label.textContent = `Tên đội ${i + 1}`;
    const input = document.createElement("input");
    input.id = `team-name-${i}`;
    input.type = "text";
    input.maxLength = 24;
    input.value = previousNames[i] || defaults[i];
    field.append(label, input);
    setup.appendChild(field);
  }
}

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

// slide ngang theo hướng: câu kế trượt vào từ phải, lùi về thì từ trái
function animateQuestionIn(direction) {
  if (typeof gsap === "undefined") {
    state.animating = false;
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    state.animating = false;
    return;
  }
  const d = direction >= 0 ? 1 : -1;
  const tl = gsap.timeline({ onComplete: () => { state.animating = false; } });
  tl.fromTo(
    ".question-card",
    { x: 96 * d, opacity: 0, scale: 0.985 },
    { x: 0, opacity: 1, scale: 1, duration: 0.62, ease: "expo.out" },
  );
  tl.fromTo(
    "#question-text",
    { x: 34 * d, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.5, ease: "expo.out" },
    "-=0.46",
  );
  tl.fromTo(
    ".option",
    { x: 46 * d, opacity: 0, scale: 0.99 },
    { x: 0, opacity: 1, scale: 1, duration: 0.46, stagger: 0.06, ease: "expo.out" },
    "-=0.4",
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

function renderQuestion(direction = 1) {
  const q = state.questions[state.index];
  if (!q) return;
  state.direction = direction >= 0 ? 1 : -1;
  state.locked = false;
  state.answerSnapshot = null;
  if (state.teams.length) state.activeTeam = null;

  // cảnh nền: 3 câu một cảnh → 30 câu = 10 cảnh
  if (window.scenes) window.scenes.set(Math.floor(state.index / 3));
  if (window.emblem) window.emblem.nudge(state.direction);

  document.getElementById("quiz-section").textContent = q.section;
  document.getElementById("quiz-progress").textContent =
    `Câu ${state.index + 1} / ${state.questions.length}`;
  document.getElementById("progress-fill").style.setProperty(
    "--p",
    String((state.index + 1) / state.questions.length),
  );
  renderTeamBoard();
  document.getElementById("question-text").textContent = q.question;

  document.getElementById("feedback").hidden = true;

  const optionsEl = document.getElementById("options");
  optionsEl.innerHTML = "";
  for (const [key, text] of Object.entries(q.options)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.key = key;
    btn.disabled = state.teams.length > 0 && state.activeTeam == null;
    btn.innerHTML =
      `<span class="option-key">${key}</span><span>${text}</span>`;
    btn.addEventListener("click", () => onPick(key, btn));
    optionsEl.appendChild(btn);
  }

  const prevBtn = document.getElementById("btn-prev");
  if (prevBtn) prevBtn.hidden = state.index === 0;

  document.getElementById("loading").hidden = true;
  document.getElementById("result").hidden = true;
  document.getElementById("quiz").hidden = false;

  // câu đã trả lời rồi (khi lùi về) → hiện lại đúng trạng thái, không cộng điểm lại
  const answered = state.answers[state.index];
  if (answered) {
    state.animating = false;
    revealAnswer(answered);
  } else {
    animateQuestionIn(state.direction);
  }
}

// hiện lại trạng thái đã trả lời của một câu (dùng khi lùi về)
function revealAnswer(key) {
  const q = state.questions[state.index];
  state.locked = true;
  document.querySelectorAll(".option").forEach((el) => {
    el.disabled = true;
    if (el.dataset.key === q.answer) el.classList.add("is-correct");
    else if (el.dataset.key === key) el.classList.add("is-wrong");
  });
  renderFeedback(key === q.answer, q);
  syncNextLabel();
}

function renderFeedback(correct, q) {
  const verdict = document.getElementById("feedback-verdict");
  verdict.textContent = correct
    ? "Chính xác!"
    : `Chưa đúng, đáp án đúng là ${q.answer}`;
  verdict.className = `feedback-verdict ${correct ? "ok" : "bad"}`;
  document.getElementById("feedback-explain").textContent = q.explanation || "";
  document.getElementById("feedback-source").textContent = q.source
    ? `Văn kiện: ${q.source}`
    : "";
  document.getElementById("feedback").hidden = false;
  animateFeedbackIn();
}

function syncNextLabel() {
  const nextBtn = document.getElementById("btn-next");
  const isLast = state.index >= state.questions.length - 1;
  nextBtn.textContent = isLast ? "Xem kết quả →" : "Câu tiếp theo →";
  if (window.syncGlassLabel) syncGlassLabel("btn-next");
}

function onPick(key, btn) {
  if (state.locked) return;
  if (state.teams.length && state.activeTeam == null) return;
  state.answerSnapshot = {
    score: state.score,
    wrongIds: [...state.wrongIds],
    teams: state.teams.map((team) => ({ ...team })),
  };
  state.locked = true;

  const q = state.questions[state.index];
  const correct = key === q.answer;
  state.answers[state.index] = key;

  if (correct) {
    state.score += 1;
    if (state.teams.length) {
      const team = state.teams[state.activeTeam];
      team.score += 1;
      team.streak += 1;
      team.bestStreak = Math.max(team.bestStreak, team.streak);
    }
  } else {
    state.wrongIds.push(q.id);
    if (state.teams.length) state.teams[state.activeTeam].streak = 0;
  }
  renderTeamBoard();

  document.querySelectorAll(".option").forEach((el) => {
    el.disabled = true;
    if (el.dataset.key === q.answer) el.classList.add("is-correct");
    else if (el === btn) el.classList.add("is-wrong");
  });

  renderFeedback(correct, q);
  syncNextLabel();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    document.getElementById("feedback").scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  });
}

function undoAnswer() {
  if (!state.locked || !state.answerSnapshot) return;

  state.score = state.answerSnapshot.score;
  state.wrongIds = [...state.answerSnapshot.wrongIds];
  state.teams = state.answerSnapshot.teams.map((team) => ({ ...team }));
  state.activeTeam = state.teams.length ? null : 0;
  state.locked = false;
  state.answerSnapshot = null;
  delete state.answers[state.index];

  document.getElementById("feedback").hidden = true;
  document.querySelectorAll(".option").forEach((option) => {
    option.disabled = state.teams.length > 0;
    option.classList.remove("is-correct", "is-wrong");
  });
  renderTeamBoard();
}

function showResult() {
  const total = state.questions.length;
  const pct = Math.round((state.score / total) * 100);

  document.getElementById("quiz").hidden = true;
  document.getElementById("result").hidden = false;
  const resultTeams = document.getElementById("result-teams");
  resultTeams.hidden = !state.teams.length;
  resultTeams.innerHTML = "";
  if (state.teams.length) {
    const heading = document.createElement("p");
    heading.className = "result-teams-title";
    heading.textContent = "Bảng điểm đội";
    resultTeams.appendChild(heading);
    [...state.teams]
      .sort((a, b) => b.score - a.score)
      .forEach((team) => {
        const row = document.createElement("p");
        row.textContent = `${team.name}: ${team.score} điểm · Chuỗi tốt nhất ${team.bestStreak}`;
        resultTeams.appendChild(row);
      });
  }
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

  let msg = "Củng cố thêm nhé, thử lại vòng mới!";
  if (pct >= 90) msg = "Xuất sắc! Đẳng cấp nhà lịch sử!";
  else if (pct >= 75) msg = "Giỏi lắm! Phong độ rất tốt.";
  else if (pct >= 50) msg = "Được đấy, nhưng cần ôn thêm.";
  document.getElementById("result-msg").textContent = msg;

  const detail = state.wrongIds.length
    ? `Sai các câu: ${state.wrongIds.join(", ")}`
    : "Không sai câu nào. Tuyệt vời!";
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
    renderQuestion(1);
  };

  if (typeof gsap === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    go();
    return;
  }

  state.animating = true;
  gsap.to(".question-card", {
    x: -96,
    opacity: 0,
    duration: 0.32,
    ease: "power2.in",
    onComplete: go,
  });
}

function goPrev() {
  if (state.animating) return;
  if (state.index <= 0) return;

  const go = () => {
    state.index -= 1;
    renderQuestion(-1);
  };

  if (typeof gsap === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    go();
    return;
  }

  state.animating = true;
  gsap.to(".question-card", {
    x: 96,
    opacity: 0,
    duration: 0.32,
    ease: "power2.in",
    onComplete: go,
  });
}

function nextQuestion() {
  advance();
}

const NUMBER_TO_KEY = { 1: "A", 2: "B", 3: "C", 4: "D" };

function onKey(e) {
  if (e.repeat) return;
  const key = e.key.toUpperCase();

  const startEl = document.getElementById("start");
  const quizEl = document.getElementById("quiz");
  const resultEl = document.getElementById("result");
  const pickerEl = document.getElementById("picker");

  // vòng quay đang mở: chỉ Esc để đóng, chặn hết phím tắt quiz
  if (window.wheel && window.wheel.isOpen()) {
    if (e.key === "Escape") {
      e.preventDefault();
      window.wheel.close();
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && e.target && e.target.tagName !== "BUTTON") {
      e.preventDefault();
      window.wheel.spin();
      return;
    }
    return;
  }

  if (e.key === "Escape") {
    if (pickerEl && !pickerEl.hidden) { e.preventDefault(); hidePicker(); return; }
    if (resultEl && !resultEl.hidden) { e.preventDefault(); retry(); return; }
    return;
  }

  if (startEl && !startEl.hidden) {
    if (key === "ENTER" || key === " ") {
      // don't steal Enter/Space from focusable controls on start card
      const tag = e.target && e.target.tagName;
      if (tag === "SELECT" || tag === "INPUT" || tag === "BUTTON") return;
      e.preventDefault();
      startGame();
    }
    return;
  }

  if (quizEl && !quizEl.hidden) {
    const tag = e.target && e.target.tagName;
    const onControl = tag === "BUTTON" || tag === "A" || tag === "SELECT"
      || tag === "INPUT" || tag === "TEXTAREA";

    // 1-4 hoặc A-D
    const byNumber = NUMBER_TO_KEY[e.key];
    const pick = byNumber || (["A", "B", "C", "D"].includes(key) ? key : null);
    if (pick) {
      const btn = document.querySelector(`.option[data-key="${pick}"]`);
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
      return;
    }

    if (e.key === "ArrowRight") { e.preventDefault(); advance(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); return; }

    if (key === "ENTER" || key === " ") {
      if (onControl) return; // để nút đang focus tự xử lý
      e.preventDefault();
      if (state.locked) advance();
      return;
    }
    return;
  }

  if (resultEl && !resultEl.hidden) {
    if ((key === "ENTER" || key === " ")
      && !e.target.closest("button, a, select, input")) {
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
  loadPickerNames();
  document.addEventListener("keydown", onKey);
  document.getElementById("btn-toggle-picker").addEventListener("click", showPicker);
  document.getElementById("btn-picker-back").addEventListener("click", hidePicker);
  document.getElementById("btn-pick").addEventListener("click", pickName);
  document.getElementById("picker-names").addEventListener("change", savePickerNames);
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  document.getElementById("btn-prev").addEventListener("click", goPrev);
  document.getElementById("btn-undo").addEventListener("click", undoAnswer);
  document.getElementById("btn-retry").addEventListener("click", retry);
  document.getElementById("btn-options").addEventListener("click", toggleOptions);
  document.getElementById("opt-mode").addEventListener("change", syncTeamSetup);
  syncTeamSetup();
  try {
    state.questions = await loadQuestions();
    fillSectionOptions(state.questions);
    document.getElementById("loading").hidden = true;
    document.getElementById("start").hidden = false;
  } catch (err) {
    document.getElementById("loading").textContent =
      `Không tải được câu hỏi: ${err.message}`;
  }
});
