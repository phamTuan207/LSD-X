// Lịch Sử Đảng — Đại Hội X | Nhóm 4
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
}

function onPick(key, btn) {
  if (state.locked) return;
  state.locked = true;

  const q = state.questions[state.index];
  const correct = key === q.answer;
  if (correct) state.score += 1;
  else state.wrongIds.push(q.id);

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

function nextQuestion() {
  if (state.index >= state.questions.length - 1) {
    showResult();
    return;
  }
  state.index += 1;
  renderQuestion();
}

function retry() {
  state.index = 0;
  state.score = 0;
  state.wrongIds = [];
  renderQuestion();
}

document.addEventListener("DOMContentLoaded", async () => {
  spawnStars();
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  document.getElementById("btn-retry").addEventListener("click", retry);
  try {
    state.questions = await loadQuestions();
    renderQuestion();
  } catch (err) {
    document.getElementById("loading").textContent =
      `Khong tai duoc cau hoi: ${err.message}`;
  }
});
