// Lịch Sử Đảng — Đại Hội X | Nhóm 4 — admin
const STORE_KEY = "lsd-dhx-questions";

const $ = (id) => document.getElementById(id);

async function seedIfEmpty() {
  let raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fallthrough */ }
  }
  const res = await fetch("data/questions.json");
  const data = await res.json();
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  return data;
}

function save(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

function getQuestions() {
  return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
}

function nextId(list) {
  return list.reduce((m, q) => Math.max(m, q.id || 0), 0) + 1;
}

function renderList() {
  const list = getQuestions();
  $("count-badge").textContent = `${list.length} câu hỏi`;
  const box = $("q-list");
  box.innerHTML = "";
  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "q-empty";
    empty.textContent = "Chưa có câu hỏi nào. Thêm câu đầu tiên bằng biểu mẫu phía trên.";
    box.appendChild(empty);
    return;
  }
  for (const q of list) {
    const row = document.createElement("div");
    row.className = "q-item";
    row.innerHTML = `
      <div class="q-item-body">
        <div class="q-item-idx">#${q.id} · ${q.answer}</div>
        <div class="q-item-text" title="${escapeAttr(q.question)}">${escapeHtml(q.question)}</div>
      </div>
      <div class="q-item-actions">
        <button type="button" data-edit="${q.id}">Sửa</button>
        <button type="button" class="btn-del" data-del="${q.id}">Xóa</button>
      </div>`;
    box.appendChild(row);
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}

function fillForm(q) {
  $("q-id").value = q ? q.id : "";
  $("q-section").value = q ? q.section : "";
  $("q-question").value = q ? q.question : "";
  $("q-a").value = q ? q.options.A : "";
  $("q-b").value = q ? q.options.B : "";
  $("q-c").value = q ? q.options.C : "";
  $("q-d").value = q ? q.options.D : "";
  $("q-answer").value = q ? q.answer : "A";
  $("q-source").value = q ? q.source || "" : "";
  $("q-explanation").value = q ? q.explanation || "" : "";
  $("form-title").textContent = q ? `Sửa câu #${q.id}` : "Câu hỏi mới";
  $("btn-save").textContent = q ? "Cập nhật" : "Lưu câu hỏi";
  $("btn-reset").hidden = !q;
}

function showMsg(text, isError = false) {
  const el = $("form-msg");
  el.textContent = text;
  el.classList.toggle("is-error", isError);
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 2500);
}

function onSubmit(e) {
  e.preventDefault();
  const list = getQuestions();
  const idVal = $("q-id").value;
  const question = $("q-question").value.trim();
  const options = {
    A: $("q-a").value.trim(),
    B: $("q-b").value.trim(),
    C: $("q-c").value.trim(),
    D: $("q-d").value.trim(),
  };
  const payload = {
    section: $("q-section").value.trim(),
    question,
    options,
    answer: $("q-answer").value,
    explanation: $("q-explanation").value.trim(),
    source: $("q-source").value.trim(),
  };

  if (!payload.section || !question || Object.values(options).some((v) => !v)) {
    showMsg("Nhập đầy đủ trường bắt buộc", true);
    return;
  }

  if (idVal) {
    const i = list.findIndex((q) => q.id === Number(idVal));
    if (i === -1) { showMsg("Không tìm thấy câu", true); return; }
    list[i] = { ...list[i], ...payload };
    showMsg(`Đã cập nhật câu #${idVal}`);
  } else {
    payload.id = nextId(list);
    list.push(payload);
    showMsg(`Đã thêm câu #${payload.id}`);
  }

  save(list);
  fillForm(null);
  renderList();
}

function onClickList(e) {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.del;
  const list = getQuestions();

  if (editId) {
    const q = list.find((x) => x.id === Number(editId));
    if (q) {
      fillForm(q);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }

  if (delId) {
    if (!confirm(`Xóa câu #${delId}?`)) return;
    save(list.filter((x) => x.id !== Number(delId)));
    renderList();
    showMsg(`Đã xóa câu #${delId}`);
  }
}

function exportJson() {
  const blob = new Blob(
    [JSON.stringify(getQuestions(), null, 2)],
    { type: "application/json" },
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "questions.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error("not array");
      save(data);
      renderList();
      fillForm(null);
      showMsg(`Đã nhập ${data.length} câu hỏi`);
    } catch {
      showMsg("File JSON không hợp lệ", true);
    }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await seedIfEmpty();
    renderList();
    fillForm(null);
  } catch (err) {
    showMsg(`Lỗi tải dữ liệu: ${err.message}`, true);
  }

  $("q-form").addEventListener("submit", onSubmit);
  $("btn-reset").addEventListener("click", () => fillForm(null));
  $("q-list").addEventListener("click", onClickList);
  $("btn-export").addEventListener("click", exportJson);
  $("import-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) importJson(f);
    e.target.value = "";
  });
});
