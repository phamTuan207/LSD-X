// Lịch Sử Đảng — Đại Hội X | Nhóm 4
const state = {
  questions: [],
  index: 0,
  locked: false,
};

async function loadQuestions() {
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
  document.getElementById("quiz").hidden = false;
}

function onPick(key, btn) {
  if (state.locked) return;
  state.locked = true;

  const q = state.questions[state.index];
  const correct = key === q.answer;

  for (const el of document.querySelectorAll(".option")) {
    el.disabled = true;
    if (el.dataset.key === q.answer) el.classList.add("is-correct");
    else if (el === btn) el.classList.add("is-wrong");
  }

  const verdict = document.getElementById("feedback-verdict");
  verdict.textContent = correct ? "Chính xác! 🎯" : `Sai rồi — đáp án đúng là ${q.answer}`;
  verdict.className = `feedback-verdict ${correct ? "ok" : "bad"}`;

  document.getElementById("feedback-explain").textContent = q.explanation || "";
  document.getElementById("feedback-source").textContent = q.source
    ? `Văn kiện: ${q.source}`
    : "";
  document.getElementById("feedback").hidden = false;

  const nextBtn = document.getElementById("btn-next");
  const isLast = state.index >= state.questions.length - 1;
  nextBtn.textContent = isLast ? "Xem kết quả →" : "Câu tiếp theo →";
}

function nextQuestion() {
  if (state.index >= state.questions.length - 1) {
    // Feature điểm số sẽ làm sau
    alert("Hết câu hỏi! Tính năng điểm số sắp ra.");
    return;
  }
  state.index += 1;
  renderQuestion();
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  try {
    state.questions = await loadQuestions();
    renderQuestion();
  } catch (err) {
    document.getElementById("loading").textContent =
      `Không tải được câu hỏi: ${err.message}`;
  }
});
