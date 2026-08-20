# VEO3 Local Watermark Remover Pro (Standalone Package)

## 📌 Tổng quan
Ứng dụng web chuyên nghiệp xử lý đa phương tiện 100% cục bộ trên trình duyệt (Client-Side Only), loại bỏ hoàn toàn watermark của các mô hình AI video/ảnh như **Google Veo 3**, **Gemini**, **Flow AI**, **Kling**, **Runway**, **Sora** mà không tải dữ liệu lên bất kỳ máy chủ nào.

## 🚀 Hướng dẫn chạy trên Localhost (VS Code Live Server)
Do tính năng WebAssembly & SharedArrayBuffer yêu cầu bảo mật Cross-Origin Isolation, bạn cần cấu hình các headers sau khi chạy Live Server:

1. Cài đặt extension **Live Server** trong Visual Studio Code.
2. Mở thư mục chứa các file (`manifest.json`, `index.html`, `style.css`, `engine.js`, `app.js`).
3. Tạo hoặc chỉnh sửa file `.vscode/settings.json`:
```json
{
  "liveServer.settings.headers": {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
}
```
4. Nhấp chuột phải vào `index.html` và chọn **Open with Live Server**.
5. Thưởng thức tốc độ xử lý video & ảnh cục bộ siêu nhanh!

## 🧩 Cấu trúc tệp
- `manifest.json`: Cấu hình Chrome Extension/PWA Web App.
- `index.html`: Giao diện chính với Dropzone, Interactive ROI Stage và Split-Screen Before/After.
- `style.css`: Giao diện Dark Mode chuẩn thương mại với hiệu ứng glowing.
- `engine.js`: Bộ máy xử lý lõi tích hợp FFmpeg.wasm v0.10.x & HTML5 Canvas Inpainting.
- `app.js`: Quản lý sự kiện kéo thả chuột để vẽ khung đỏ (Interactive ROI) và xuất tệp.
