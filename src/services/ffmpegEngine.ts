import { AlgorithmSettings, ROI } from '../types';
import { VideoFrameProcessor } from './videoFrameProcessor';

declare global {
  interface Window {
    FFmpeg?: {
      createFFmpeg: (options?: {
        log?: boolean;
        corePath?: string;
        progress?: (p: { ratio: number }) => void;
      }) => FFmpegInstance;
    };
  }
}

interface FFmpegInstance {
  load: () => Promise<void>;
  isLoaded: () => boolean;
  FS: (cmd: string, ...args: unknown[]) => unknown;
  run: (...args: string[]) => Promise<void>;
  setLogger: (logger: (msg: { type: string; message: string }) => void) => void;
  setProgress: (progress: (p: { ratio: number }) => void) => void;
  exit: () => void;
}

export class FFmpegEngine {
  private static ffmpegInstance: FFmpegInstance | null = null;
  private static isInitializing = false;

  /**
   * Check if FFmpeg is supported in the current environment
   */
  public static isFFmpegAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.FFmpeg !== 'undefined';
  }

  /**
   * Load FFmpeg instance with fallback
   */
  public static async getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpegInstance | null> {
    if (this.ffmpegInstance && this.ffmpegInstance.isLoaded()) {
      return this.ffmpegInstance;
    }

    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return this.ffmpegInstance;
    }

    this.isInitializing = true;
    try {
      if (!window.FFmpeg) {
        onLog?.('[Engine Notice] FFmpeg script CDN chưa sẵn sàng. Sẽ chuyển sang High-Speed Canvas Engine...');
        this.isInitializing = false;
        return null;
      }

      onLog?.('[FFmpeg.wasm] Đang khởi động FFmpeg v0.10.x WebAssembly...');
      const ffmpeg = window.FFmpeg.createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
      });

      await ffmpeg.load();
      this.ffmpegInstance = ffmpeg;
      onLog?.('[FFmpeg.wasm] Đã tải thành công lõi FFmpeg WebAssembly!');
      return ffmpeg;
    } catch (err) {
      onLog?.(`[FFmpeg.wasm Info] Khởi tạo FFmpeg WASM không khả dụng trong iframe hiện tại (${(err as Error).message}). Đang chuyển hướng sang Local Canvas Engine tối ưu.`);
      return null;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Main video processing gateway
   */
  public static async processVideo(
    file: File,
    videoUrl: string,
    roi: ROI,
    settings: AlgorithmSettings,
    onProgress: (progress: number, status: string) => void,
    onLog: (log: string) => void,
    abortSignal?: { aborted: boolean }
  ): Promise<Blob> {
    onLog(`[Start] Bắt đầu tác vụ xử lý video: "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    onProgress(2, 'Đang chuẩn bị bộ máy xử lý...');

    // Try FFmpeg first if available and file is not overly huge
    const ffmpeg = await this.getFFmpeg(onLog);

    if (ffmpeg && ffmpeg.isLoaded()) {
      try {
        return await this.runFFmpegDelogo(
          ffmpeg,
          file,
          roi,
          settings,
          onProgress,
          onLog
        );
      } catch (err) {
        onLog(`[FFmpeg Fallback] FFmpeg gặp lỗi bộ nhớ: ${(err as Error).message}. Đang tự động chuyển sang Video Frame Inpainting Engine...`);
      }
    }

    // Fallback or Primary: Canvas + WebCodecs / MediaRecorder Engine
    return await VideoFrameProcessor.processVideoWithCanvas(
      videoUrl,
      roi,
      settings,
      onProgress,
      onLog,
      abortSignal
    );
  }

  /**
   * Runs FFmpeg delogo filter command
   */
  private static async runFFmpegDelogo(
    ffmpeg: FFmpegInstance,
    file: File,
    roi: ROI,
    settings: AlgorithmSettings,
    onProgress: (progress: number, status: string) => void,
    onLog: (log: string) => void
  ): Promise<Blob> {
    const inputName = 'input.mp4';
    const outputName = 'output_clean.mp4';

    onLog('[FFmpeg] Đang đọc dữ liệu video vào bộ nhớ ảo WASM FS...');
    onProgress(10, 'Đang nạp video vào bộ nhớ WebAssembly...');

    const fileData = new Uint8Array(await file.arrayBuffer());
    ffmpeg.FS('writeFile', inputName, fileData);

    ffmpeg.setLogger(({ message }) => {
      onLog(`[FFmpeg Stdout] ${message}`);
    });

    ffmpeg.setProgress(({ ratio }) => {
      const p = Math.min(95, Math.max(10, Math.round(ratio * 90) + 10));
      onProgress(p, `Đang xử lý luồng FFmpeg: ${p}%...`);
    });

    // Delogo parameters
    // FFmpeg delogo requires width and height >= 1, and x+w <= videoWidth
    const x = Math.max(0, Math.round(roi.x));
    const y = Math.max(0, Math.round(roi.y));
    const w = Math.max(2, Math.round(roi.width));
    const h = Math.max(2, Math.round(roi.height));

    onLog(`[FFmpeg Filter] delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`);
    onProgress(25, 'Đang chạy bộ lọc Delogo & Re-encode...');

    const preset = settings.quality === 'fast' ? 'ultrafast' : settings.quality === 'balanced' ? 'medium' : 'slow';
    const crf = settings.quality === 'high' ? '18' : settings.quality === 'balanced' ? '22' : '28';

    // Execute FFmpeg command
    await ffmpeg.run(
      '-i',
      inputName,
      '-vf',
      `delogo=x=${x}:y=${y}:w=${w}:h=${h}:show=0`,
      '-c:v',
      'libx264',
      '-preset',
      preset,
      '-crf',
      crf,
      '-c:a',
      'copy',
      outputName
    );

    onProgress(95, 'Đang xuất tệp kết quả từ bộ nhớ...');
    const resultData = ffmpeg.FS('readFile', outputName) as Uint8Array;

    // Cleanup FS
    try {
      ffmpeg.FS('unlink', inputName);
      ffmpeg.FS('unlink', outputName);
    } catch {
      // ignore
    }

    const outputBlob = new Blob([resultData.buffer], { type: 'video/mp4' });
    onLog(`[FFmpeg Complete] Đã xóa watermark thành công! Kích thước file: ${(outputBlob.size / 1024 / 1024).toFixed(2)} MB`);
    onProgress(100, 'Hoàn tất xử lý video bằng FFmpeg!');

    return outputBlob;
  }
}
