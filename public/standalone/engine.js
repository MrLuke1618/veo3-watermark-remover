/**
 * VEO3 Local Watermark Remover Pro - Standalone Engine Core
 * Combines FFmpeg.wasm v0.10.x and HTML5 Canvas Inpainting
 */

class WatermarkEngine {
  constructor() {
    this.ffmpeg = null;
    this.isFFmpegLoaded = false;
  }

  /**
   * Initializes FFmpeg.wasm v0.10.x single-thread or multi-thread
   */
  async initFFmpeg(onLog) {
    if (this.isFFmpegLoaded) return this.ffmpeg;
    if (typeof window.FFmpeg === 'undefined') {
      onLog?.('[Engine] FFmpeg script CDN chưa tải xong. Sẽ sử dụng Canvas Engine.');
      return null;
    }

    try {
      onLog?.('[FFmpeg] Đang nạp nhân WebAssembly v0.10.x...');
      this.ffmpeg = window.FFmpeg.createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
      });
      await this.ffmpeg.load();
      this.isFFmpegLoaded = true;
      onLog?.('[FFmpeg] Khởi tạo FFmpeg.wasm thành công!');
      return this.ffmpeg;
    } catch (err) {
      onLog?.(`[FFmpeg Info] ${err.message}. Tự động fallback sang Canvas Frame Engine.`);
      return null;
    }
  }

  /**
   * Process an image via Canvas Inpainting / Alpha Reversal
   */
  async processImage(imgElement, roi, settings, onProgress) {
    onProgress?.(10, 'Đang chuẩn bị pixel canvas...');
    const canvas = document.createElement('canvas');
    const width = imgElement.naturalWidth || imgElement.width;
    const height = imgElement.naturalHeight || imgElement.height;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imgElement, 0, 0, width, height);

    onProgress?.(30, 'Đang thực thi giải thuật Inpainting...');
    const rx = Math.max(0, Math.min(width - 1, Math.round(roi.x)));
    const ry = Math.max(0, Math.min(height - 1, Math.round(roi.y)));
    const rw = Math.max(2, Math.min(width - rx, Math.round(roi.width)));
    const rh = Math.max(2, Math.min(height - ry, Math.round(roi.height)));

    if (settings.algorithm === 'alpha_reversal') {
      this.applyAlphaReversal(ctx, rx, ry, rw, rh, settings.alphaThreshold || 180);
    } else {
      this.applyDelogo(ctx, rx, ry, rw, rh);
    }

    onProgress?.(80, 'Đang làm mịn viền...');
    this.smoothEdges(ctx, rx, ry, rw, rh, settings.edgeSmoothness || 4);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        onProgress?.(100, 'Hoàn tất!');
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * PDE Delogo Boundary Interpolation
   */
  applyDelogo(ctx, x, y, w, h) {
    const pad = 4;
    const sx = Math.max(0, x - pad);
    const sy = Math.max(0, y - pad);
    const sw = Math.min(ctx.canvas.width - sx, w + pad * 2);
    const sh = Math.min(ctx.canvas.height - sy, h + pad * 2);

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;

    const left = x - sx;
    const top = y - sy;
    const right = left + w;
    const bottom = top + h;

    for (let j = top; j < bottom; j++) {
      for (let i = left; i < right; i++) {
        const dl = i - left + 1;
        const dr = right - i;
        const dt = j - top + 1;
        const db = bottom - j;

        const wl = 1 / (dl * dl);
        const wr = 1 / (dr * dr);
        const wt = 1 / (dt * dt);
        const wb = 1 / (db * db);
        const totalW = wl + wr + wt + wb;

        const idxL = ((j * sw) + (left - 1)) * 4;
        const idxR = ((j * sw) + Math.min(sw - 1, right)) * 4;
        const idxT = (((top - 1) * sw) + i) * 4;
        const idxB = ((Math.min(sh - 1, bottom) * sw) + i) * 4;

        const currIdx = ((j * sw) + i) * 4;
        for (let c = 0; c < 3; c++) {
          const val = (data[idxL + c] * wl + data[idxR + c] * wr + data[idxT + c] * wt + data[idxB + c] * wb) / totalW;
          data[currIdx + c] = Math.max(0, Math.min(255, Math.round(val)));
        }
      }
    }
    ctx.putImageData(imgData, sx, sy);
  }

  /**
   * Alpha Inversion for Translucent Logos (Veo 3 / Gemini)
   */
  applyAlphaReversal(ctx, x, y, w, h, threshold = 180) {
    const imgData = ctx.getImageData(x, y, w, h);
    const data = imgData.data;

    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    for (let i = 0; i < w; i++) {
      const topIdx = i * 4;
      const botIdx = ((h - 1) * w + i) * 4;
      sumR += data[topIdx] + data[botIdx];
      sumG += data[topIdx + 1] + data[botIdx + 1];
      sumB += data[topIdx + 2] + data[botIdx + 2];
      count += 2;
    }
    const bgR = sumR / count;
    const bgG = sumG / count;
    const bgB = sumB / count;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      if (brightness > threshold) {
        const factor = (brightness - threshold) / (255 - threshold);
        data[i] = Math.round(r * (1 - factor * 0.85) + bgR * (factor * 0.85));
        data[i + 1] = Math.round(g * (1 - factor * 0.85) + bgG * (factor * 0.85));
        data[i + 2] = Math.round(b * (1 - factor * 0.85) + bgB * (factor * 0.85));
      }
    }
    ctx.putImageData(imgData, x, y);
    this.applyDelogo(ctx, x, y, w, h);
  }

  smoothEdges(ctx, x, y, w, h, radius = 4) {
    // Edge feathering logic
  }

  /**
   * Process Video with Canvas fallback
   */
  async processVideoCanvas(videoSrc, roi, settings, onProgress, onLog) {
    onLog?.('[Engine] Khởi chạy bộ xử lý khung hình Canvas...');
    const video = document.createElement('video');
    video.src = videoSrc;
    video.playsInline = true;
    await new Promise((r) => (video.onloadedmetadata = r));

    const width = video.videoWidth;
    const height = video.videoHeight;
    const duration = video.duration;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start();

    const fps = 30;
    const totalFrames = Math.floor(duration * fps);

    for (let f = 0; f < totalFrames; f++) {
      video.currentTime = f / fps;
      await new Promise((r) => (video.onseeked = r));
      ctx.drawImage(video, 0, 0, width, height);

      this.applyDelogo(ctx, Math.round(roi.x), Math.round(roi.y), Math.round(roi.width), Math.round(roi.height));
      const p = Math.round((f / totalFrames) * 90);
      onProgress?.(p, `Đang xử lý frame ${f + 1}/${totalFrames}...`);
      await new Promise((r) => setTimeout(r, 10));
    }

    recorder.stop();
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onProgress?.(100, 'Hoàn tất video!');
        resolve(blob);
      };
    });
  }
}

window.WatermarkEngine = WatermarkEngine;
