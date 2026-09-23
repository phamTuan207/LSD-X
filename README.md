# Lịch Sử Đảng · Đại Hội X | Nhóm 4

Minigame trắc nghiệm dùng trong lớp: **Đại hội đại biểu toàn quốc lần thứ X của Đảng Cộng sản Việt Nam**.

Chạy trên **localhost**, không cần backend, không cần cài gì phức tạp. Lần đầu mở trang cần internet để tải Google Fonts; gameplay và dữ liệu vẫn chạy bằng các file local.

---

## Chạy nhanh tại lớp

Clone repo rồi mở terminal trong thư mục dự án:

```bash
git clone https://github.com/phamTuan207/LSD-X.git
cd LSD-X
python3 -m http.server 8000
```

Mở trình duyệt vào **http://localhost:8000**

- Không có Python? Dùng extension **Live Server** trong VS Code → mở thư mục → *Go Live*.
- Port 8000 bị bận? Đổi số: `python3 -m http.server 8080` rồi vào `http://localhost:8080`.
- Không gõ được lệnh? Mở trực tiếp `index.html` bằng đúp chuột cũng chạy được phần lớn chức năng (khuyến nghị vẫn dùng server để tránh lỗi CORS với file JSON).

---

## Dành cho người dùng (end-user)

### Chạy game

1. Clone hoặc tải repo này về máy.

2. Mở terminal trong thư mục dự án, chạy:

   ```bash
   python3 -m http.server 8000
   ```

3. Mở trình duyệt vào: **http://localhost:8000**

### Cách chơi (mode lớp học)

- Giáo viên chiếu trang lên máy chiếu / màn hình chung.
- Ở màn khởi động, chọn **Bắt đầu**. Cần *Xáo trộn*, chọn phần, hay chơi theo **2-6 đội** thì mở **Tuỳ chọn**.
- Mỗi câu: giáo viên đọc câu hỏi, **quay tên** học sinh (nút *Vòng quay gọi tên* ở ngay trong màn câu hỏi), bạn đó trả lời miệng.
- Người bấm máy chọn đáp án trên màn → hiện đúng/sai + lý giải + văn kiện. Giáo viên có thời gian giải thích, rồi bấm **Câu tiếp theo** để tiếp tục.
- Bấm nhầm đáp án / chọn nhầm đội → **Hoàn tác, chọn lại** trong phần lý giải. Muốn xem lại câu trước → **← Câu trước**.
- Phím tắt: **1-4** hoặc **A-D** chọn đáp án · **Enter**/**Space** tiếp · **←**/**→** lùi/tới · **Esc** đóng (vòng quay, màn kết quả).
- Nền đổi theo mạch bài: 30 câu chia thành **10 cảnh** (Khởi nguyên → Mặt trận → Đại hội → Kháng chiến → Xây dựng → Sao vàng → Hoa sen → Phù hiệu → Đêm lên đèn → Bình minh), mỗi cảnh 3 câu, chuyển mượt bằng crossfade.
- Khi chơi theo đội, giáo viên bấm vào đội giơ tay nhanh nhất trước khi người chơi trả lời; lựa chọn sẽ khóa sau khi nộp đáp án. Câu đúng cộng điểm và theo dõi chuỗi đúng.
- Cuối trận: điểm tổng, bảng điểm đội, danh sách câu sai, nút chơi lại.

### Gọi tên học sinh

- **Vòng quay gọi tên** (trong màn câu hỏi): vòng tròn 35 tên, quay nhanh rồi chậm dần, dừng đúng một tên. Bấm **Quay** hoặc **Enter**/**Space**; **Esc** để đóng.
- Màn khởi động có nút **Danh sách lớp** để sửa danh sách và rút tên nhanh.
- Danh sách 35 tên lớp KTPM67B đã có sẵn (file `data/names.json`).
- Sửa / thêm tên ngay trong ô textarea, lưu trên trình duyệt (localStorage), không mất khi F5.
- Tên đã gọi không lặp lại cho đến khi hết vòng (vòng quay và rút tên dùng chung một danh sách chờ).

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
├── index.html              # Trang game (quiz + vòng quay gọi tên)
├── admin.html              # CRUD câu hỏi (GUI)
├── css/style.css           # Design system: glass surfaces, crimson×gold cho chữ
├── js/
│   ├── app.js              # State quiz, render, keyboard, slide, shuffle, scoring
│   ├── admin.js            # Form + list + import/export localStorage
│   ├── scenes.js           # 10 cảnh nền (gradient layer + hạt theo cảnh)
│   ├── emblem.js           # Khối 3D trung tâm: sao vàng / hoa sen, parallax
│   ├── wheel.js            # Vòng quay gọi tên (canvas + GSAP)
│   ├── confetti.js         # Gold-leaf particles, chỉ dùng cho màn thắng
│   ├── glass-ui.js         # Mount Liquid Glass CTA (fallback nếu no WebGL)
│   ├── horizon-bg.js       # Nền WebGL, nhận palette theo cảnh (lerp)
│   └── vendor/
│       ├── gsap.min.js
│       ├── html2canvas.min.js
│       └── liquid-glass/    # MIT: container.js, button.js, glass.css
├── data/
│   ├── questions.json      # Bank 30 câu Đại hội X (seed)
│   └── names.json          # 35 tên lớp KTPM67B (seed picker)
└── assets/                 # ảnh nếu có
```

### Quy ước

- **Mỗi feature = 1 commit**, message tiếng Việt không dấu, kiểu `them ...`, `bo ...`, `sua ...`.
- Không thêm build step / framework — vanilla HTML/CSS/JS, mở localhost là chạy.
- Library nhận qua vendored file trong `js/vendor/`; Google Fonts là dependency online duy nhất của phần trình bày.
- `localStorage` keys: `lsd-dhx-questions`, `lsd-dhx-names`.
- Tôn trọng `prefers-reduced-motion` (confetti, sao rơi, GSAP).

### Schema câu hỏi (`data/questions.json`)

```json
{
  "id": 1,
  "section": "Trong Đại hội X",
  "question": "Nội dung câu hỏi?",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "C",
  "explanation": "Lý giải vì sao đúng.",
  "source": "Báo cáo Chính trị."
}
```

### Thêm feature mới

1. Tách nhỏ, xong 1 tính năng → commit → push.
2. UI mới: giữ theme `css/style.css` (token semantic `--accent`, `--line`, `--glass-*`; font display/body), surface là kính trong suốt, đừng phủ vàng lên kính.
3. Không đụng timer, mode lớp học, giáo viên tự điều khiển nhịp.
4. Test nhanh: `node --check js/*.js` rồi mở browser F5.

### Tech đã gắn

| Thành phần | Vai trò |
|---|---|
| GSAP | Slide câu hỏi theo hướng, stagger option, parallax emblem, vòng quay |
| Canvas 2D (`scenes.js`) | 10 cảnh nền: lớp gradient crossfade + hạt riêng từng cảnh (than hồng, cánh sen, đèn lồng, sao…) |
| Emblem 3D (`emblem.js`) | Khối sao vàng / hoa sen nhiều lớp xếp theo trục Z trên `preserve-3d`; nghiêng theo con trỏ, trượt ngang khi đổi câu |
| Vòng quay gọi tên (`wheel.js`) | 35 tên trên vòng tròn, quay nhanh rồi chậm dần (`power4.out`), dừng đúng một tên |
| liquid-glass-js (MIT) | CTA chính dạng kính trong suốt (WebGL); dưới 640px tự rơi về kính CSS |
| Canvas confetti | Chỉ dùng cho màn thắng (điểm ≥75%), không còn bắn mỗi câu đúng |
| WebGL Horizon | Nền WebGL nhận palette từng cảnh và lerp mượt, port shader EmeraldHorizon từ [MengTo/threeui](https://github.com/MengTo/threeui) (MIT), recolor ceremonial. File: `js/horizon-bg.js` |
| Dancing Script | Font viết tay uốn lượn (subset vi) làm điểm nhấn: tên vừa quay, câu nhận xét, chữ *X* trong tiêu đề |

---

## Nhóm 4 · Lịch Sử Đảng

Phạm Tuấn Huy · Nguyễn Vũ Đức Thịnh · Hà Đức Long · Trần Hoàng Anh · Phùng Thiệu Quang

Chủ đề: **Đại hội X** — KTPM67B.

### Cập nhật gần đây

- **10 cảnh nền** cho 30 câu, mỗi cảnh 3 câu, chuyển bằng crossfade + khối 3D trung tâm trượt ngang theo hướng câu.
- **Vòng quay gọi tên** ngay trong màn câu hỏi: quay nhanh → chậm dần → dừng đúng một tên, không lặp cho đến khi hết danh sách.
- Chuyển câu kiểu slide ngang: **→** trượt từ phải, **← Câu trước** trượt từ trái; lùi về câu cũ hiện lại nguyên trạng thái đã trả lời, không cộng điểm lại.
- Bàn phím: **1-4** hoặc **A-D** chọn đáp án, **Enter/Space** tiếp, **←/→** lùi/tới, **Esc** đóng.
- Nền gameplay bỏ hiệu ứng "mưa sao vàng" nhạt nhoà; confetti để dành cho màn thắng.
- Mặt kính trong suốt (trắng, không phủ vàng) cho card/CTA; crimson × gold chỉ còn ở chữ, tiến độ và điểm nhấn.
- `prefers-reduced-motion`: cảnh đổi tức thì, không hạt, không parallax, vòng quay hiện kết quả ngay.
- Sửa lỗi: tên đội mặc định trước đây là Nhóm 1, 2, 3, 5, 6, 6 (thiếu Nhóm 4) → nay đủ Nhóm 1-6.
- Sửa lỗi hiệu năng: glass-ui không còn poll `requestAnimationFrame` vô hạn cho nút đang ẩn.

pull request #1: add classroom team scoring, teacher-controlled pacing, and answer undo.
