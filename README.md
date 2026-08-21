# Face Fortune React

MVP React + TypeScript + Vite dùng camera và MediaPipe Face Landmarker để:

- Phát hiện khuôn mặt realtime.
- Trích xuất facial landmarks.
- Phân tích một số đặc điểm hình học của khuôn mặt.
- Ước lượng biểu cảm từ face blendshapes.
- Sinh nội dung tướng số theo rule engine đơn giản.
- Không upload ảnh khuôn mặt lên backend trong MVP.

## 1. Yêu cầu

- Node.js 20+ khuyến nghị.
- Trình duyệt hiện đại có camera.
- Camera permission.
- Camera API yêu cầu secure context: `localhost` khi development hoặc HTTPS khi deploy.

## 2. Cài đặt

```bash
npm install
npm run dev
```

Sau đó mở URL Vite hiển thị, thường là:

```text
http://localhost:5173
```

## 3. Build production

```bash
npm run build
npm run preview
```

## 4. Kiến trúc

```text
Camera
  ↓
getUserMedia()
  ↓
MediaPipe Face Landmarker
  ↓
Facial Landmarks + Blendshapes
  ↓
faceAnalyzer.ts
  ├── Face shape
  ├── Eyes
  ├── Eyebrows
  ├── Nose
  ├── Mouth
  ├── Chin
  └── Emotion
        ↓
fortuneEngine / rule logic
        ↓
React UI
```

## 5. Lưu ý về tướng số và cảm xúc

Các kết luận tướng số trong project chỉ là nội dung giải trí/tham khảo theo các quy tắc được lập trình. Không nên dùng chúng để kết luận khoa học về tính cách, vận mệnh, năng lực hoặc giá trị của một người.

Phần emotion cũng chỉ là ước lượng biểu cảm nhìn thấy trên khuôn mặt, không phải đọc chính xác trạng thái tâm lý bên trong.

## 6. Hướng phát triển tiếp theo

- Vẽ 478 landmarks/mesh lên camera.
- Thêm màn hình scan với animation.
- Tách `fortuneEngine.ts` thành bộ luật tướng số riêng.
- Thêm lịch sử kết quả.
- Thêm nhiều loại báo cáo: công danh, tình duyên, tài vận.
- Thêm AI để biến feature JSON thành báo cáo tự nhiên.
- Có thể thêm backend để quản lý tài khoản/subscription, nhưng không cần upload ảnh nếu không có nhu cầu.
- Thêm consent/privacy policy nếu triển khai thương mại.
