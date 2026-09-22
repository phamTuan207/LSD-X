# Lịch Sử Đảng — Đại Hội X | Nhóm 4

Minigame trắc nghiệm dùng trong lớp: **Đại hội đại biểu toàn quốc lần thứ X của Đảng Cộng sản Việt Nam**.

Chạy hoàn toàn trên **localhost**, không cần backend, không cần cài gì phức tạp.

---

## Dành cho người dùng (không biết code)

### Chạy game

1. Clone hoặc tải repo này về máy.
2. Mở terminal trong thư mục dự án, chạy:

   ```bash
   python3 -m http.server 8000
   ```

   (Máy chưa có Python có thể dùng extension **Live Server** trong VS Code, bấm *Go Live*.)

3. Mở trình duyệt vào: **http://localhost:8000**

### Cách chơi (mode lớp học)

- Giáo viên chiếu trang lên máy chiếu / màn hình chung.
- Ở màn khởi động, chọn **Bắt đầu** (có thể tick *Xáo trộn*).
- Mỗi câu: giáo viên đọc câu hỏi, **rút tên** học sinh (nút *Gọi tên ngẫu nhiên*), bạn đó trả lời miệng.
- Người bấm máy chọn đáp án trên màn → hiện đúng/sai + lý giải + văn kiện → **Câu tiếp theo** (hoặc phím **Enter**).
- Phím tắt: **A–D** chọn đáp án.
- Cuối trận: điểm tổng cả lớp, danh sách câu sai, nút chơi lại.

### Gọi tên học sinh

- Nút **Gọi tên ngẫu nhiên** ở màn khởi động.
- Danh sách 35 tên lớp KTPM67B đã có sẵn (file `data/names.json`).
- Sửa / thêm / bấm tên ngay trong ô textarea — lưu trên trình duyệt (localStorage), không mất khi F5.
- Tên đã gọi không lặp lại cho đến khi hết vòng.

### Thêm / sửa câu hỏi (không cần sửa code)

1. Vào **http://localhost:8000/admin.html** (hoặc link *Quản lý câu hỏi* ở trang chủ).
2. Điền form: mục, nội dung, 4 đáp án, đáp án đúng, lý giải, văn kiện → **Lưu**.
3. List bên dưới: nút **Sửa** / **Xóa**.
4. **Xuất JSON** để tải file `questions.json` thay vào `data/questions.json` nếu muốn chia sẻ cùng nhóm.
5. **Nhập JSON** để nạp file câu hỏi từ máy khác.

> Admin lưu trên **localStorage của trình duyệt đang mở**. Muốn cả nhóm cùng bộ câu hỏi: xuất JSON → commit file `data/questions.json` → mọi người nhập lại hoặc xóa localStorage để seed từ file.

---

## Dành cho dev

### Cấu trúc

```
LSD-X/
├── index.html              # Trang game (quiz + gọi tên)
├── admin.html              # CRUD câu hỏi (GUI)
├── css/style.css           # Design system: đỏ–vàng lễ hội, Playfair + Be Vietnam Pro
├── js/
│   ├── app.js              # State quiz, render, keyboard, shuffle, scoring
│   ├── admin.js            # Form + list + import/export localStorage
│   ├── confetti.js         # Gold-leaf particles (canvas, zero-dep)
│   ├── glass-ui.js         # Mount Liquid Glass CTA (fallback nếu no WebGL)
│   └── vendor/
│       ├── gsap.min.js
│       ├── ScrollTrigger.min.js
│       ├── html2canvas.min.js
│       └── liquid-glass/    # MIT — container.js, button.js, glass.css
├── data/
│   ├── questions.json      # Bank 30 câu Đại hội X (seed)
│   └── names.json          # 35 tên lớp KTPM67B (seed picker)
└── assets/                 # ảnh nếu có
```

### Quy ước

- **Mỗi feature = 1 commit**, message tiếng Việt không dấu, kiểu `them ...`, `bo ...`, `sua ...`.
- Không thêm build step / framework — vanilla HTML/CSS/JS, mở localhost là chạy.
- Library chỉ nhận qua vendored file trong `js/vendor/` (không CDN bắt buộc, offline được).
- `localStorage` keys: `lsd-dhx-questions`, `lsd-dhx-names`.
- Tôn trọng `prefers-reduced-motion` (confetti, sao rơi, GSAP).

### Schema câu hỏi (`data/questions.json`)

```json
{
  "id": 1,
  "section": "TRUOC DAI HOI X",
  "question": "Nội dung câu hỏi?",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "C",
  "explanation": "Lý giải vì sao đúng.",
  "source": "Bao cao Chinh tri."
}
```

### Thêm feature mới

1. Tách nhỏ — xong 1 tính năng → commit → push.
2. UI mới: giữ theme `css/style.css` (biến `--red`, `--gold`, font display/body).
3. Không đụng timer — mode lớp học, giáo viên tự điều khiển nhịp.
4. Test nhanh: `node --check js/*.js` rồi mở browser F5.

### Tech đã gắn

| Thành phần | Vai trò |
|---|---|
| GSAP | Chuyển câu, stagger option, feedback |
| liquid-glass-js (MIT) | CTA “Bắt đầu” / “Gọi tên” (WebGL); card CSS glass hybrid |
| Canvas confetti | Lá vàng khi đúng câu / điểm ≥75% |
| ThreeUI Crimson Horizon | Nền WebGL đỏ–vàng chạy full-page — port shader EmeraldHorizon từ [MengTo/threeui](https://github.com/MengTo/threeui) (MIT), recolor ceremonial. File: `js/horizon-bg.js` |

---

## Nhóm 4 — Lịch Sử Đảng

Phạm Tuấn Huy · Nguyễn Vũ Đức Thịnh · Hà Đức Long · Trần Hoàng Anh · Phùng Thiệu Quang

Chủ đề: **Đại hội X** — KTPM67B.
