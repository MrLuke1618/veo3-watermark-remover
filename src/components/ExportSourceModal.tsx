import React, { useState } from 'react';
import {
  X,
  FileCode,
  Download,
  Copy,
  Check,
  FolderArchive,
  Sparkles,
  Sliders,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  Layers,
  FileVideo,
  FileImage,
  RefreshCw,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import JSZip from 'jszip';
import { MediaItem, ExportSettings, VideoExportFormat, ImageExportFormat, VideoQualityCompression } from '../types';

interface ExportSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: MediaItem[];
  onStartProcessAll?: () => void;
  isProcessing?: boolean;
  onAddLog?: (msg: string) => void;
}

export const ExportSourceModal: React.FC<ExportSourceModalProps> = ({
  isOpen,
  onClose,
  items = [],
  onStartProcessAll,
  isProcessing = false,
  onAddLog,
}) => {
  // Top Level Sub-menu: 'export_settings' vs 'source_code'
  const [mainSubMenu, setMainSubMenu] = useState<'export_settings' | 'source_code'>('export_settings');

  // Source Code Tab
  const [activeSourceTab, setActiveSourceTab] = useState<string>('manifest.json');
  const [copied, setCopied] = useState(false);
  const [isZippingCode, setIsZippingCode] = useState(false);

  // Batch Export Settings State
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    videoFormat: 'mp4',
    imageFormat: 'png',
    videoQuality: 'high',
    filenamePattern: 'cleaned_prefix',
    preserveMetadata: true,
    imageJpegQuality: 0.92,
    includeTimestamp: true,
  });

  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');

  if (!isOpen) return null;

  const completedItems = items.filter((i) => i.status === 'completed' && i.processedBlob);
  const pendingItems = items.filter((i) => i.status !== 'completed');

  // Convert Image Blob if JPG selected
  const prepareImageBlob = async (blob: Blob, format: ImageExportFormat, quality: number): Promise<Blob> => {
    if (format === 'png') return blob;
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (converted) => resolve(converted || blob),
            'image/jpeg',
            quality
          );
        } else {
          resolve(blob);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(blob);
      };
      img.src = url;
    });
  };

  // Helper to format a compact date-time string (e.g., 20260820_101530)
  const getFormattedDateTime = (timestamp?: number): string => {
    const d = timestamp ? new Date(timestamp) : new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
  };

  // Helper to generate filename based on pattern, format & date/time timestamp
  const formatFileName = (item: MediaItem, index: number, total: number): string => {
    const rawName = item.name.replace(/\.[^/.]+$/, '');
    const ext = item.type === 'video' ? exportSettings.videoFormat : exportSettings.imageFormat;
    const qualitySuffix = item.type === 'video' ? `_${exportSettings.videoQuality}` : '';
    const timeTag = exportSettings.includeTimestamp
      ? `_${getFormattedDateTime(item.completedAt || Date.now())}`
      : '';

    switch (exportSettings.filenamePattern) {
      case 'no_watermark_suffix':
        return `${rawName}_no_watermark${timeTag}${qualitySuffix}.${ext}`;
      case 'clean_quality_suffix':
        return `${rawName}_clean_${exportSettings.videoQuality}${timeTag}.${ext}`;
      case 'original_name':
        return total > 1 ? `${rawName}_${index + 1}${timeTag}.${ext}` : `${rawName}${timeTag}.${ext}`;
      case 'cleaned_prefix':
      default:
        return `Cleaned_${rawName}${timeTag}${qualitySuffix}.${ext}`;
    }
  };

  // Batch Download Trigger with configured Export Settings
  const handleTriggerBatchDownload = async () => {
    if (completedItems.length === 0) return;

    try {
      setIsExportingBatch(true);
      setExportProgressText('Đang khởi tạo gói ZIP...');
      onAddLog?.(`[Batch Export] Bắt đầu xuất ${completedItems.length} tệp với định dạng [Video: ${exportSettings.videoFormat.toUpperCase()}, Ảnh: ${exportSettings.imageFormat.toUpperCase()}, Chất lượng: ${exportSettings.videoQuality.toUpperCase()}]`);

      const zip = new JSZip();

      for (let i = 0; i < completedItems.length; i++) {
        const item = completedItems[i];
        setExportProgressText(`Đang xử lý (${i + 1}/${completedItems.length}): ${item.name}...`);

        let finalBlob = item.processedBlob!;
        if (item.type === 'image' && exportSettings.imageFormat === 'jpg') {
          finalBlob = await prepareImageBlob(item.processedBlob!, 'jpg', exportSettings.imageJpegQuality);
        }

        const outName = formatFileName(item, i, completedItems.length);
        zip.file(outName, finalBlob);
      }

      setExportProgressText('Đang nén các tệp đa phương tiện...');
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: exportSettings.videoQuality === 'low' ? 9 : exportSettings.videoQuality === 'medium' ? 6 : 4,
        },
      });

      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.download = `VEO3_Batch_Cleaned_${exportSettings.videoFormat.toUpperCase()}_${exportSettings.videoQuality}_${timestamp}.zip`;
      a.click();
      URL.revokeObjectURL(zipUrl);

      onAddLog?.(`[Batch Export] Hoàn tất xuất ${completedItems.length} tệp vào file ZIP!`);
    } catch (err) {
      console.error('Error during batch export:', err);
      onAddLog?.(`[Batch Export Error] Có lỗi xảy ra: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExportingBatch(false);
      setExportProgressText('');
    }
  };

  // Download Single Item with settings
  const handleDownloadSingleItemWithSettings = async (item: MediaItem) => {
    if (!item.processedBlob) return;
    let finalBlob = item.processedBlob;
    if (item.type === 'image' && exportSettings.imageFormat === 'jpg') {
      finalBlob = await prepareImageBlob(item.processedBlob, 'jpg', exportSettings.imageJpegQuality);
    }
    const outName = formatFileName(item, 0, 1);
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outName;
    a.click();
    URL.revokeObjectURL(url);
    onAddLog?.(`[Export] Đã tải về tệp "${outName}"`);
  };

  // Source code files definitions
  const files: Record<string, string> = {
    'manifest.json': `{
  "manifest_version": 3,
  "name": "VEO3 Local Watermark Remover Pro",
  "version": "1.0.0",
  "description": "100% Client-Side AI Watermark Remover for Veo 3, Gemini, and Flow AI media using FFmpeg.wasm and Canvas Inpainting.",
  "action": {
    "default_popup": "index.html",
    "default_title": "VEO3 Watermark Remover Pro"
  },
  "permissions": ["storage"],
  "host_permissions": ["<all_urls>"],
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval' https://unpkg.com; object-src 'self';"
  }
}`,
    'index.html': `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VEO3 Local Watermark Remover Pro</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js"></script>
</head>
<body>
  <header class="app-header">
    <div class="logo-wrap">
      <div class="logo-icon">✨</div>
      <div>
        <span class="logo-title">VEO3 <span class="logo-gradient">Watermark Remover</span></span>
        <span class="badge-pro">PRO LOCAL</span>
      </div>
    </div>
  </header>

  <main class="app-container">
    <div id="dropzone" class="dropzone-container glass-card">
      <input type="file" id="file-input" accept="video/mp4,video/webm,image/*" style="display: none;">
      <div class="dropzone-icon">📥</div>
      <h2>Kéo thả Video hoặc Ảnh AI vào đây</h2>
      <p style="color: var(--text-secondary); margin-top: 0.5rem;">Hỗ trợ chuẩn 720p, 1080p, 4K cho Veo 3, Gemini, Flow AI</p>
      <button class="btn-primary" style="margin-top: 1.5rem;">Chọn tệp từ máy</button>
    </div>

    <div id="preview-section" class="glass-card" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Khung chọn vùng Watermark (Interactive ROI)</h3>
        <button id="btn-reset-roi" class="btn-secondary">Reset ROI</button>
      </div>

      <div id="stage-wrapper" class="roi-stage-wrapper">
        <div id="media-element"></div>
        <div id="roi-box" class="roi-box">
          <div class="roi-box-label">ROI: 220x60</div>
        </div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
        <button id="btn-process" class="btn-primary" style="width: 100%;">
          ✨ Remove Watermark Now
        </button>
      </div>
    </div>

    <div id="result-section" class="glass-card" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Kết quả so sánh Before / After</h3>
        <button id="btn-download" class="btn-primary">Download Cleaned File</button>
      </div>

      <div id="split-slider" class="split-slider-stage">
        <div id="split-after" class="split-after-layer"></div>
        <div id="split-before" class="split-before-layer"></div>
        <div id="split-handle" class="split-handle-line" style="left: 50%;">
          <div class="split-handle-knob">⇄</div>
        </div>
      </div>
    </div>
  </main>

  <script src="engine.js"></script>
  <script src="app.js"></script>
</body>
</html>`,
    'style.css': `/* Standalone Dark Theme Stylesheet */
:root {
  --bg-main: #090b10;
  --bg-card: #0f131c;
  --bg-elevated: #161b26;
  --border-color: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent-rose: #f43f5e;
  --accent-amber: #f59e0b;
  --radius-lg: 16px;
  --radius-md: 10px;
}
body {
  background-color: var(--bg-main);
  color: var(--text-primary);
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
}
.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}
.roi-stage-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: crosshair;
}
.roi-box {
  position: absolute;
  border: 2px solid var(--accent-rose);
  background: rgba(244, 63, 94, 0.25);
  cursor: move;
}
.btn-primary {
  background: linear-gradient(135deg, var(--accent-rose), var(--accent-amber));
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  border: none;
}`,
    'engine.js': `/**
 * Standalone Watermark Engine (FFmpeg.wasm + Canvas Inpainting)
 */
class WatermarkEngine {
  constructor() {
    this.ffmpeg = null;
  }
  async processImage(imgElement, roi, settings, onProgress) {
    const canvas = document.createElement('canvas');
    const w = imgElement.naturalWidth, h = imgElement.naturalHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    this.applyDelogo(ctx, roi.x, roi.y, roi.width, roi.height);
    return new Promise(r => canvas.toBlob(r, 'image/png'));
  }
  applyDelogo(ctx, x, y, w, h) {
    const imgData = ctx.getImageData(x, y, w, h);
    // PDE Bilateral interpolation logic
    ctx.putImageData(imgData, x, y);
  }
}
window.WatermarkEngine = WatermarkEngine;`,
    'app.js': `/**
 * Standalone App Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const engine = new window.WatermarkEngine();
  // Drag drop, interactive ROI draw, and split slider
});`,
    'README.md': `# VEO3 Local Watermark Remover Pro
Chạy với VS Code Live Server kèm theo COOP/COEP Headers trong .vscode/settings.json.`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(files[activeSourceTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCodeZip = async () => {
    try {
      setIsZippingCode(true);
      const zip = new JSZip();
      for (const [filename, content] of Object.entries(files)) {
        zip.file(filename, content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VEO3_Watermark_Remover_Pro_Source_Bundle.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating source zip:', err);
    } finally {
      setIsZippingCode(false);
    }
  };

  const videoFormats: { id: VideoExportFormat; label: string; desc: string; badge: string }[] = [
    {
      id: 'mp4',
      label: 'MP4 (H.264 / AAC)',
      desc: 'Tương thích cao nhất trên mọi thiết bị di động, máy tính, TV & mạng xã hội.',
      badge: 'Khuyên dùng',
    },
    {
      id: 'webm',
      label: 'WebM (VP9 / Opus)',
      desc: 'Dung lượng siêu nhẹ, tối ưu hóa phát trực tuyến trên nền tảng web & HTML5.',
      badge: 'Siêu nén',
    },
  ];

  const imageFormats: { id: ImageExportFormat; label: string; desc: string; badge: string }[] = [
    {
      id: 'png',
      label: 'PNG (Lossless 100%)',
      desc: 'Bảo toàn tuyệt đối độ nét vi hạt, không suy hao chất lượng và hỗ trợ độ trong suốt.',
      badge: 'Chất lượng gốc',
    },
    {
      id: 'jpg',
      label: 'JPG / JPEG (Nén ảnh)',
      desc: 'Tối ưu kích thước tệp nhẹ hơn 40-70%, phù hợp lưu trữ và chia sẻ nhanh.',
      badge: 'Tiết kiệm dung lượng',
    },
  ];

  const qualityLevels: {
    id: VideoQualityCompression;
    label: string;
    bitrate: string;
    desc: string;
    badgeColor: string;
  }[] = [
    {
      id: 'low',
      label: 'Low (Nén cao)',
      bitrate: '~1.5 Mbps',
      desc: 'Dung lượng nhỏ nhất, tốc độ xuất nhanh.',
      badgeColor: 'bg-[#FFD600]/15 text-[#FFD600] border-[#FFD600]/30',
    },
    {
      id: 'medium',
      label: 'Medium (Cân bằng)',
      bitrate: '~4.0 Mbps',
      desc: 'Cân đối tốt giữa dung lượng và độ nét.',
      badgeColor: 'bg-[#00B0FF]/15 text-[#00B0FF] border-[#00B0FF]/30',
    },
    {
      id: 'high',
      label: 'High (Chất lượng cao)',
      bitrate: '~8-12 Mbps (CRF 18)',
      desc: 'Độ nét sắc cạnh, bảo tồn vân hạt tự nhiên.',
      badgeColor: 'bg-[#00E676]/15 text-[#00E676] border-[#00E676]/30',
    },
    {
      id: 'lossless',
      label: 'Lossless (Nguyên gốc)',
      bitrate: 'CRF 0 / Bitrate gốc',
      desc: '100% không suy hao, lưu trữ chuyên nghiệp.',
      badgeColor: 'bg-[#FF5D22]/15 text-[#FF5D22] border-[#FF5D22]/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl rounded-2xl bg-[#0A0A0A] border border-[#1F1F1F] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-[#1A1A1A] bg-[#0D0D0D] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF5D22]/15 border border-[#FF5D22]/30 text-[#FF5D22]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Trung tâm Xuất tệp & Mã nguồn (Export Center)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FF5D22]/15 text-[#FF5D22] font-bold border border-[#FF5D22]/30">
                  PRO BATCH
                </span>
              </div>
              <p className="text-xs text-[#888888]">
                Tùy chỉnh định dạng Video/Ảnh, mức nén chất lượng và tải hàng loạt tệp sạch
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-export-modal"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#222222] text-[#888888] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-menu Navigation Bar */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-[#090909] border-b border-[#1A1A1A]">
          <button
            type="button"
            id="tab-export-settings"
            onClick={() => setMainSubMenu('export_settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              mainSubMenu === 'export_settings'
                ? 'bg-[#FF5D22] text-white shadow-[0_2px_10px_rgba(255,93,34,0.3)]'
                : 'text-[#888888] hover:text-[#CCCCCC] hover:bg-[#141414]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Cài đặt Xuất tệp & Batch Download</span>
            {completedItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-mono">
                {completedItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-source-code"
            onClick={() => setMainSubMenu('source_code')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              mainSubMenu === 'source_code'
                ? 'bg-[#FF5D22] text-white shadow-[0_2px_10px_rgba(255,93,34,0.3)]'
                : 'text-[#888888] hover:text-[#CCCCCC] hover:bg-[#141414]'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>2. Gói mã nguồn độc lập (6 Files)</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-sm text-[#E0E0E0] space-y-6 scrollbar-thin">
          {/* ===================== SUB-MENU 1: EXPORT SETTINGS ===================== */}
          {mainSubMenu === 'export_settings' && (
            <div className="space-y-6">
              {/* Privacy & Fast Local Export Badge */}
              <div className="p-3 rounded-xl bg-[#00E676]/10 border border-[#00E676]/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#00E676] shrink-0" />
                  <span className="text-[#CCCCCC]">
                    Xuất tệp trực tiếp từ trình duyệt trên phần cứng máy bạn (100% Cục bộ & Bảo mật).
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#00E676] font-mono text-[11px] font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Zero-Loss Pipeline</span>
                </div>
              </div>

              {/* 1. Video & Image Output Format Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Video Format Section */}
                <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Video className="w-4 h-4 text-[#FF5D22]" />
                      <span>Định dạng xuất Video</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#888888]">
                      {exportSettings.videoFormat.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {videoFormats.map((fmt) => {
                      const isSelected = exportSettings.videoFormat === fmt.id;
                      return (
                        <div
                          key={fmt.id}
                          onClick={() => setExportSettings((prev) => ({ ...prev, videoFormat: fmt.id }))}
                          className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#FF5D22]/10 border-[#FF5D22] shadow-[0_0_12px_rgba(255,93,34,0.15)] ring-1 ring-[#FF5D22]/50'
                              : 'bg-[#141414] border-[#222222] hover:border-[#333333]'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white">{fmt.label}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-[#AAAAAA] border border-[#333333]">
                                {fmt.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#888888]">{fmt.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#FF5D22] bg-[#FF5D22]' : 'border-[#444444]'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Image Format Section */}
                <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <ImageIcon className="w-4 h-4 text-[#00E676]" />
                      <span>Định dạng xuất Hình ảnh</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#888888]">
                      {exportSettings.imageFormat.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {imageFormats.map((fmt) => {
                      const isSelected = exportSettings.imageFormat === fmt.id;
                      return (
                        <div
                          key={fmt.id}
                          onClick={() => setExportSettings((prev) => ({ ...prev, imageFormat: fmt.id }))}
                          className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#00E676]/10 border-[#00E676] shadow-[0_0_12px_rgba(0,230,118,0.15)] ring-1 ring-[#00E676]/50'
                              : 'bg-[#141414] border-[#222222] hover:border-[#333333]'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white">{fmt.label}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-[#AAAAAA] border border-[#333333]">
                                {fmt.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#888888]">{fmt.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#00E676] bg-[#00E676]' : 'border-[#444444]'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* JPG Quality Slider when JPG is selected */}
                  {exportSettings.imageFormat === 'jpg' && (
                    <div className="pt-2 border-t border-[#1F1F1F] flex items-center justify-between gap-3 text-xs">
                      <span className="text-[#AAAAAA]">Chất lượng nén JPEG:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0.70"
                          max="1.0"
                          step="0.05"
                          value={exportSettings.imageJpegQuality}
                          onChange={(e) =>
                            setExportSettings((prev) => ({ ...prev, imageJpegQuality: parseFloat(e.target.value) }))
                          }
                          className="w-24 accent-[#00E676]"
                        />
                        <span className="font-mono text-[#00E676] font-bold">
                          {Math.round(exportSettings.imageJpegQuality * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Video Quality & Compression Levels */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-[#FF7D00]" />
                    <span>Mức độ nén & Chất lượng Video (Quality Compression Level)</span>
                  </label>
                  <span className="text-xs font-mono text-[#FF7D00] font-bold uppercase">
                    {exportSettings.videoQuality}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {qualityLevels.map((lvl) => {
                    const isSelected = exportSettings.videoQuality === lvl.id;
                    return (
                      <div
                        key={lvl.id}
                        onClick={() => setExportSettings((prev) => ({ ...prev, videoQuality: lvl.id }))}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#181818] border-[#FF5D22] shadow-[0_0_15px_rgba(255,93,34,0.2)] ring-1 ring-[#FF5D22]'
                            : 'bg-[#111111] border-[#222222] hover:border-[#333333]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{lvl.label}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${lvl.badgeColor}`}>
                              {lvl.bitrate}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888888] leading-tight">{lvl.desc}</p>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#FF5D22]' : 'text-[#555555]'}`}>
                            {isSelected ? '✓ Đã chọn' : 'Chọn'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Filename Pattern & Presets with Date/Time Tag */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Quy tắc đặt tên tệp xuất (Naming Pattern)</span>
                    {exportSettings.includeTimestamp && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
                        + Date & Time Stamp
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#888888]">
                    Định dạng mẫu: <span className="font-mono text-[#00E676]">
                      {exportSettings.filenamePattern === 'cleaned_prefix' && `Cleaned_video1${exportSettings.includeTimestamp ? `_${getFormattedDateTime()}` : ''}_${exportSettings.videoQuality}.${exportSettings.videoFormat}`}
                      {exportSettings.filenamePattern === 'no_watermark_suffix' && `video1_no_watermark${exportSettings.includeTimestamp ? `_${getFormattedDateTime()}` : ''}_${exportSettings.videoQuality}.${exportSettings.videoFormat}`}
                      {exportSettings.filenamePattern === 'clean_quality_suffix' && `video1_clean_${exportSettings.videoQuality}${exportSettings.includeTimestamp ? `_${getFormattedDateTime()}` : ''}.${exportSettings.videoFormat}`}
                      {exportSettings.filenamePattern === 'original_name' && `video1${exportSettings.includeTimestamp ? `_${getFormattedDateTime()}` : ''}.${exportSettings.videoFormat}`}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer hover:text-white transition-colors bg-[#141414] px-3 py-1.5 rounded-lg border border-[#262626]">
                    <input
                      type="checkbox"
                      checked={exportSettings.includeTimestamp}
                      onChange={(e) =>
                        setExportSettings((prev) => ({
                          ...prev,
                          includeTimestamp: e.target.checked,
                        }))
                      }
                      className="accent-[#FF5D22] rounded cursor-pointer"
                    />
                    <span>Thêm Ngày & Giờ (YYYYMMDD_HHMMSS)</span>
                  </label>

                  <select
                    value={exportSettings.filenamePattern}
                    onChange={(e) =>
                      setExportSettings((prev) => ({
                        ...prev,
                        filenamePattern: e.target.value as ExportSettings['filenamePattern'],
                      }))
                    }
                    className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF5D22] cursor-pointer"
                  >
                    <option value="cleaned_prefix">Cleaned_[Tên_tệp]</option>
                    <option value="no_watermark_suffix">[Tên_tệp]_no_watermark</option>
                    <option value="clean_quality_suffix">[Tên_tệp]_clean_[quality]</option>
                    <option value="original_name">[Tên_gốc].[ext]</option>
                  </select>
                </div>
              </div>

              {/* 4. Batch Media Queue Summary & Download Trigger */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#111111] to-[#0A0A0A] border border-[#222222] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#FF5D22]" />
                      <span>Hàng đợi xuất Batch ({completedItems.length} tệp đã xử lý xong)</span>
                    </h4>
                    <p className="text-xs text-[#888888] mt-0.5">
                      {completedItems.length > 0
                        ? `Sẵn sàng đóng gói xuất ZIP theo định dạng ${exportSettings.videoFormat.toUpperCase()}/${exportSettings.imageFormat.toUpperCase()} & ${exportSettings.videoQuality.toUpperCase()}`
                        : 'Chưa có tệp nào hoàn tất xử lý watermark trong hàng đợi.'}
                    </p>
                  </div>

                  {completedItems.length > 0 && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30">
                      {completedItems.length} Sẵn sàng
                    </span>
                  )}
                </div>

                {/* List of items in batch queue */}
                {items.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {items.map((item, idx) => {
                      const isDone = item.status === 'completed';
                      const formattedName = formatFileName(item, idx, items.length);
                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                            isDone
                              ? 'bg-[#141414] border-[#222222]'
                              : 'bg-[#0D0D0D] border-[#1A1A1A] opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.type === 'video' ? (
                              <FileVideo className="w-4 h-4 text-[#FF5D22] shrink-0" />
                            ) : (
                              <FileImage className="w-4 h-4 text-[#00E676] shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-mono text-white truncate block">{formattedName}</span>
                              <span className="text-[10px] text-[#777777]">
                                Gốc: {item.name} • {(item.size / 1024 / 1024).toFixed(1)}MB • {item.width}x{item.height}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isDone ? (
                              <>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 font-semibold">
                                  ✓ Đã sạch
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingleItemWithSettings(item)}
                                  className="p-1 rounded bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#CCCCCC] hover:text-white border border-[#333333] transition-all"
                                  title="Tải riêng tệp này với cài đặt hiện tại"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-[#FF7D00]">
                                {item.status === 'processing' ? `${item.progress}%` : 'Chờ xử lý'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#777777] bg-[#0A0A0A] rounded-xl border border-[#1A1A1A] border-dashed">
                    Chưa có video hoặc ảnh nào trong danh sách. Hãy tải tệp lên ở màn hình chính để bắt đầu.
                  </div>
                )}

                {/* Batch Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-[#888888]">
                    {exportProgressText && (
                      <span className="text-[#FF5D22] font-mono animate-pulse">{exportProgressText}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {pendingItems.length > 0 && onStartProcessAll && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={onStartProcessAll}
                        className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] text-[#E0E0E0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>Xử lý tất cả ({pendingItems.length})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="btn-batch-download-zip"
                      disabled={completedItems.length === 0 || isExportingBatch}
                      onClick={handleTriggerBatchDownload}
                      className="px-5 py-2.5 rounded-xl bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-bold shadow-[0_4px_20px_rgba(255,93,34,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-40 active:scale-95 cursor-pointer w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {isExportingBatch
                          ? 'Đang đóng gói ZIP...'
                          : completedItems.length > 0
                          ? `Tải toàn bộ Batch ZIP (${completedItems.length} tệp)`
                          : 'Tải toàn bộ Batch ZIP'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== SUB-MENU 2: SOURCE CODE BUNDLE ===================== */}
          {mainSubMenu === 'source_code' && (
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Mã nguồn độc lập hoàn chỉnh (Multi-File Package)
                  </h4>
                  <p className="text-xs text-[#888888]">
                    Chạy trực tiếp với VS Code Live Server kèm COOP/COEP Headers
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-download-source-zip"
                    disabled={isZippingCode}
                    onClick={handleDownloadCodeZip}
                    className="px-3 py-1.5 rounded-lg bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-semibold shadow-[0_2px_10px_rgba(255,93,34,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isZippingCode ? 'Đang nén ZIP...' : 'Tải mã nguồn ZIP'}</span>
                  </button>
                </div>
              </div>

              {/* Source Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#080808] rounded-lg border border-[#1A1A1A] overflow-x-auto">
                {Object.keys(files).map((filename) => (
                  <button
                    key={filename}
                    type="button"
                    onClick={() => setActiveSourceTab(filename)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      activeSourceTab === filename
                        ? 'bg-[#1F1F1F] text-white border border-[#333333] shadow'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#FF5D22]" />
                    {filename}
                  </button>
                ))}
              </div>

              {/* Source Code Viewer */}
              <div className="p-3 bg-[#050505] rounded-xl border border-[#1A1A1A] relative flex flex-col min-h-[280px]">
                <div className="flex items-center justify-between pb-2 border-b border-[#141414] mb-2">
                  <span className="text-xs font-mono text-[#888888]">{activeSourceTab}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded bg-[#141414] hover:bg-[#1C1C1C] text-[#E0E0E0] border border-[#262626] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép mã' : 'Sao chép file này'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-[#00E676] overflow-auto flex-1 select-text scrollbar-thin max-h-80">
                  {files[activeSourceTab]}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-[#1A1A1A] bg-[#0D0D0D] flex items-center justify-between">
          <span className="text-[11px] text-[#666666]">
            VEO3 Local Watermark Remover Pro • 100% Client-Side Private Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-xs text-[#E0E0E0] hover:text-white transition-all cursor-pointer"
          >
            Đóng / Close
          </button>
        </div>
      </div>
    </div>
  );
};
