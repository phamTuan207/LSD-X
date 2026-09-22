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

function pickName() {
  const lines = document
    .getElementById("picker-names")
    .value.split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  savePickerNames();

  if (!lines.length) {
    alert("Nhập danh sách tên trước");
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
      ? `Còn ${left} tên chưa gọi.`
      : "Hết danh sách, vòng mới bắt đầu.";
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
    { y: -40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
  );
  tl.fromTo(
    "#question-text",
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
    "-=0.15",
  );
  tl.fromTo(
    ".option",
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out", delay: 0.05 },
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
  state.answerSnapshot = null;
  if (state.teams.length) state.activeTeam = null;

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

  document.getElementById("loading").hidden = true;
  document.getElementById("result").hidden = true;
  document.getElementById("quiz").hidden = false;
  animateQuestionIn();
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
  if (correct) {
    state.score += 1;
    if (state.teams.length) {
      const team = state.teams[state.activeTeam];
      team.score += 1;
      team.streak += 1;
      team.bestStreak = Math.max(team.bestStreak, team.streak);
    }
    // subtle gold-leaf: center card, restrained count
    const card = document.querySelector(".question-card");
    const rect = card ? card.getBoundingClientRect() : null;
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height * 0.3 : window.innerHeight * 0.35;
    confetti.burst(cx, cy, 36);
  } else {
    state.wrongIds.push(q.id);
    if (state.teams.length) state.teams[state.activeTeam].streak = 0;
  }
  renderTeamBoard();

  for (const el of document.querySelectorAll(".option")) {
    el.disabled = true;
    if (el.dataset.key === q.answer) el.classList.add("is-correct");
    else if (el === btn) el.classList.add("is-wrong");
  }

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
  requestAnimationFrame(() => {
    document.getElementById("feedback").scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  });

  const nextBtn = document.getElementById("btn-next");
  const isLast = state.index >= state.questions.length - 1;
  nextBtn.textContent = isLast ? "Xem kết quả →" : "Câu tiếp theo →";
}

function undoAnswer() {
  if (!state.locked || !state.answerSnapshot) return;

  state.score = state.answerSnapshot.score;
  state.wrongIds = [...state.answerSnapshot.wrongIds];
  state.teams = state.answerSnapshot.teams.map((team) => ({ ...team }));
  state.activeTeam = state.teams.length ? null : 0;
  state.locked = false;
  state.answerSnapshot = null;

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
    renderQuestion();
  };

  if (typeof gsap === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    go();
    return;
  }

  state.animating = true;
  gsap.to(".question-card", {
    y: -72,
    opacity: 0,
    duration: 0.3,
    ease: "power2.in",
    onComplete: go,
  });
}

function nextQuestion() {
  advance();
}

function onKey(e) {
  if (e.repeat) return;
  const key = e.key.toUpperCase();

  const startEl = document.getElementById("start");
  const quizEl = document.getElementById("quiz");
  const resultEl = document.getElementById("result");

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
    if (["A", "B", "C", "D"].includes(key)) {
      const btn = document.querySelector(`.option[data-key="${key}"]`);
      if (btn && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
      return;
    }
    return;
  }

  if (resultEl && !resultEl.hidden) {
    if (key === "ENTER" && !e.target.closest("button, a, select, input")) {
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
  document.getElementById("btn-toggle-picker").addEventListener("click", showPicker);
  document.getElementById("btn-picker-back").addEventListener("click", hidePicker);
  document.getElementById("btn-pick").addEventListener("click", pickName);
  document.getElementById("picker-names").addEventListener("change", savePickerNames);
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  document.getElementById("btn-undo").addEventListener("click", undoAnswer);
  document.getElementById("btn-retry").addEventListener("click", retry);
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
