// Lịch Sử Đảng — Đại Hội X | Nhóm 4
const state = {
  questions: [],
  index: 0,
};

async function loadQuestions() {
  const res = await fetch("data/questions.json");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderQuestion() {
  const q = state.questions[state.index];
  if (!q) return;

  document.getElementById("quiz-section").textContent = q.section;
  document.getElementById("quiz-progress").textContent =
    `Câu ${state.index + 1} / ${state.questions.length}`;
  document.getElementById("progress-fill").style.width =
    `${((state.index + 1) / state.questions.length) * 100}%`;
  document.getElementById("question-text").textContent = q.question;

  const optionsEl = document.getElementById("options");
  optionsEl.innerHTML = "";
  for (const [key, text] of Object.entries(q.options)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.key = key;
    btn.innerHTML =
      `<span class="option-key">${key}</span><span>${text}</span>`;
    optionsEl.appendChild(btn);
  }

  document.getElementById("loading").hidden = true;
  document.getElementById("quiz").hidden = false;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    state.questions = await loadQuestions();
    renderQuestion();
  } catch (err) {
    document.getElementById("loading").textContent =
      `Không tải được câu hỏi: ${err.message}`;
  }
});
