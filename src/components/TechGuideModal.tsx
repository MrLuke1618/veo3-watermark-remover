import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  MousePointer,
  Keyboard,
  Server,
  Copy,
  Check,
  ChevronRight,
  Globe,
  Sliders,
  Layers,
  Columns,
  Eye,
  Wand2,
  Cpu,
  SplitSquareHorizontal,
  CheckCircle2,
} from 'lucide-react';

interface TechGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'quickstart' | 'algorithms' | 'compare_features' | 'shortcuts' | 'offline_tech';
type LanguageType = 'vi' | 'en';

export const TechGuideModal: React.FC<TechGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('quickstart');
  const [lang, setLang] = useState<LanguageType>('vi');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const liveServerSnippet = `{
  "liveServer.settings.headers": {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
}`;

  const viteSnippet = `// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});`;

  const nodeExpressSnippet = `// server.js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use(express.static('public'));
app.listen(3000, () => console.log('Server running on http://localhost:3000'));`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl rounded-2xl bg-[#0A0A0A] border border-[#1F1F1F] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-[#1A1A1A] bg-[#0D0D0D] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF5D22]/15 border border-[#FF5D22]/30 text-[#FF5D22]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {lang === 'vi' ? 'Trung tâm Trợ giúp & Cẩm nang Công nghệ' : 'Help Center & Capability Guide'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FF5D22]/15 text-[#FF5D22] font-bold border border-[#FF5D22]/30">
                  AI Core v3.2
                </span>
              </div>
              <p className="text-xs text-[#888888]">
                {lang === 'vi'
                  ? 'Tổng quan toàn bộ tính năng: Content-Aware Patching, AI Auto-Tune, So sánh Side-by-side & Bảo mật Cục bộ'
                  : 'Complete overview: Content-Aware Patching, AI Auto-Tune, Side-by-side inspection & Local Privacy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher Button */}
            <div className="flex items-center bg-[#141414] p-1 rounded-lg border border-[#222222]">
              <Globe className="w-3.5 h-3.5 text-[#888888] ml-1 mr-1" />
              <button
                type="button"
                id="btn-lang-vi"
                onClick={() => setLang('vi')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  lang === 'vi'
                    ? 'bg-[#FF5D22] text-white shadow-[0_1px_6px_rgba(255,93,34,0.4)]'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                id="btn-lang-en"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#FF5D22] text-white shadow-[0_1px_6px_rgba(255,93,34,0.4)]'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Close Modal */}
            <button
              type="button"
              id="btn-close-help-modal"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#222222] text-[#888888] hover:text-white transition-all cursor-pointer"
              title={lang === 'vi' ? 'Đóng' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-[#090909] border-b border-[#1A1A1A] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'quickstart'
                ? 'bg-[#1F1F1F] text-white border border-[#333333]'
                : 'text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF5D22]" />
            {lang === 'vi' ? '1. Quy trình 3 bước' : '1. 3-Step Workflow'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('algorithms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'algorithms'
                ? 'bg-[#1F1F1F] text-white border border-[#333333]'
                : 'text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#00E676]" />
            {lang === 'vi' ? '2. Content-Aware & Thuật toán' : '2. Content-Aware Patching'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compare_features')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compare_features'
                ? 'bg-[#1F1F1F] text-white border border-[#333333]'
                : 'text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-[#00B0FF]" />
            {lang === 'vi' ? '3. So sánh Side-by-Side & Zoom' : '3. Side-by-Side & Zoom'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'bg-[#1F1F1F] text-white border border-[#333333]'
                : 'text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-[#FFD600]" />
            {lang === 'vi' ? '4. Phím tắt & Kính lúp' : '4. Shortcuts & Loupe'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline_tech')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'offline_tech'
                ? 'bg-[#1F1F1F] text-white border border-[#333333]'
                : 'text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#FF7D00]" />
            {lang === 'vi' ? '5. Chạy Offline & Bảo mật' : '5. Offline & Privacy'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto text-sm text-[#E0E0E0] leading-relaxed scrollbar-thin">
          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              {/* Privacy Banner */}
              <div className="p-3.5 rounded-xl bg-[#00E676]/10 border border-[#00E676]/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00E676] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#00E676] uppercase tracking-wide">
                    {lang === 'vi' ? 'Bảo mật Cục bộ 100% (Zero Server Upload)' : '100% Client-Side Private (Zero Upload)'}
                  </h4>
                  <p className="text-xs text-[#AAAAAA] mt-0.5">
                    {lang === 'vi'
                      ? 'Tất cả video và hình ảnh được giải mã, inpainting và kết xuất 100% ngay trên CPU/GPU trong trình duyệt máy bạn. Không một byte dữ liệu nào bị gửi lên internet.'
                      : 'All video/image decoding, texture inpainting, and rendering happen 100% locally on your device CPU/GPU. No media bytes ever leave your machine.'}
                  </p>
                </div>
              </div>

              {/* 3 Step Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5D22] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm">
                      {lang === 'vi' ? 'Tải lên Video hoặc Hình ảnh' : 'Upload Video or Image'}
                    </h5>
                    <p className="text-xs text-[#888888] mt-1">
                      {lang === 'vi'
                        ? 'Kéo thả file MP4, WebM, MOV, JPG, PNG vào khu vực tải lên. Bạn có thể tải lên cùng lúc nhiều file để xử lý hàng loạt.'
                        : 'Drag and drop MP4, WebM, MOV, JPG, PNG files into the dropzone. Batch processing multiple files is fully supported.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5D22] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm">
                      {lang === 'vi' ? 'Căn chỉnh khung ROI & Bật AI Auto-Tune' : 'Position ROI & Enable AI Auto-Tune'}
                    </h5>
                    <p className="text-xs text-[#888888] mt-1">
                      {lang === 'vi'
                        ? 'Dùng chuột kéo khung màu đỏ vừa khít logo/chữ (kính lúp 2x-4x sẽ tự động phóng to hỗ trợ bạn). Bộ AI Auto-Tune sẽ tức thì đo độ phức tạp của vân nền xung quanh để tối ưu thông số viền.'
                        : 'Drag the red box snugly over the watermark (use the 2x-4x loupe for precision). The AI Auto-Tune engine automatically optimizes edge smoothness and blend radius.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5D22] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-sm">
                      {lang === 'vi' ? 'Bấm "Xóa Watermark", So sánh Before/After & Tải về' : 'Click "Remove Watermark", Compare & Download'}
                    </h5>
                    <p className="text-xs text-[#888888] mt-1">
                      {lang === 'vi'
                        ? 'Bấm nút cam "Remove Watermark Now" (hoặc nhấn phím Enter). Kiểm tra độ hoàn thiện bằng thanh trượt Split-Slider hoặc chế độ Song song Side-by-Side với độ phóng đại lên đến 250%.'
                        : 'Click "Remove Watermark Now" (or hit Enter). Inspect results using the Split-Slider or Side-by-Side dual windows with up to 250% zoom.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT-AWARE PATCHING & ALGORITHMS */}
          {activeTab === 'algorithms' && (
            <div className="space-y-4">
              {/* Highlight Core Feature: Content-Aware Patching */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF5D22]/15 via-[#FF5D22]/5 to-transparent border border-[#FF5D22]/30 space-y-2">
                <div className="flex items-center gap-2 text-[#FF5D22]">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-sm font-bold uppercase tracking-wide">
                    {lang === 'vi'
                      ? 'Nền tảng cốt lõi: Content-Aware Patching (PatchMatch)'
                      : 'Core Foundation: Content-Aware Patching (PatchMatch)'}
                  </h4>
                </div>
                <p className="text-xs text-[#CCCCCC]">
                  {lang === 'vi'
                    ? 'Thay vì chỉ làm nhòe (blur) hoặc nội suy màu đơn giản gây đốm mờ, thuật toán Content-Aware Patching quét các mảng vi hạt (exemplar patches) từ vùng lân cận để tái tạo vân bề mặt thực tế (cỏ cây, vải vóc, da người, kiến trúc, sóng nước). Thuật toán này đóng vai trò là nền tảng cốt lõi cho mọi chế độ xử lý trong ứng dụng.'
                    : 'Instead of plain blurring or interpolation that creates blurry smudges, Content-Aware Patching samples micro-texture exemplar patches from immediate surroundings to reconstruct authentic surface textures (grass, fabrics, skin, architecture, water). This serves as the underlying base engine for all removal modes in the app.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-[#AAAAAA]">
                  <div className="p-2 rounded bg-black/60 border border-[#222222]">
                    <span className="text-white font-bold block">1. Patch Matching (SSD)</span>
                    <span>{lang === 'vi' ? 'Tìm mảng vân khớp nhất từ 4 hướng' : 'Best donor search via SSD matching'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-[#222222]">
                    <span className="text-white font-bold block">2. Tách Cấu trúc & Vân</span>
                    <span>{lang === 'vi' ? 'Giữ gradient sáng & hoa văn chi tiết' : 'Decomposes lighting & micro-textures'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-[#222222]">
                    <span className="text-white font-bold block">3. Khớp Hạt Nhiễu Sensor</span>
                    <span>{lang === 'vi' ? 'Bù hạt nhiễu chuẩn máy quay gốc' : 'Synthesizes matching sensor grain'}</span>
                  </div>
                </div>
              </div>

              {/* 4 Algorithms Detail List */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-semibold text-[#888888] uppercase tracking-wider">
                  {lang === 'vi' ? 'Các chế độ thuật toán được hỗ trợ' : 'Supported Algorithm Modes'}
                </h5>

                <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00E676]"></span>
                      Content-Aware Patching (PatchMatch)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E676]/15 text-[#00E676] font-semibold border border-[#00E676]/30">
                      {lang === 'vi' ? 'Mặc định & Khuyên dùng' : 'Default & Recommended'}
                    </span>
                  </div>
                  <p className="text-xs text-[#888888]">
                    {lang === 'vi'
                      ? 'Lấy mẫu vân nền lân cận, tái tạo chi tiết tự nhiên không tì vết. Thích hợp nhất cho 95% trường hợp ảnh & video AI.'
                      : 'Samples surrounding texture patches for seamless natural background reconstruction. Best for 95% of AI videos & images.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF5D22]"></span>
                      Alpha Inversion Pro (Veo 3 / Flow AI / Flow Omni)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF5D22]/15 text-[#FF5D22] font-semibold border border-[#FF5D22]/30">
                      {lang === 'vi' ? 'Logo bán trong suốt' : 'Semi-transparent Logos'}
                    </span>
                  </div>
                  <p className="text-xs text-[#888888]">
                    {lang === 'vi'
                      ? 'Tính toán nghịch đảo kênh alpha để khôi phục lớp ảnh gốc bên dưới watermark mờ, sau đó dùng Content-Aware Patching để hoàn thiện vết còn sót.'
                      : 'Computes alpha inversion to restore underlying content beneath semi-transparent watermarks, finished with Content-Aware Patching.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00B0FF]"></span>
                      Delogo Gradient Interpolation (PDE)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00B0FF]/15 text-[#00B0FF] font-semibold border border-[#00B0FF]/30">
                      {lang === 'vi' ? 'Chuẩn FFmpeg' : 'FFmpeg Standard'}
                    </span>
                  </div>
                  <p className="text-xs text-[#888888]">
                    {lang === 'vi'
                      ? 'Nội suy biên PDE đa hướng kết hợp khuếch tán gradient màu, phù hợp cho vùng nền phẳng hoặc gradient bầu trời.'
                      : 'Multi-directional PDE boundary interpolation combined with color gradient diffusion, ideal for smooth skies or flat tones.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FFD600]"></span>
                      Feathered Texture Blur
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFD600]/15 text-[#FFD600] font-semibold border border-[#FFD600]/30">
                      {lang === 'vi' ? 'Làm mờ mềm viền' : 'Soft Edge Blur'}
                    </span>
                  </div>
                  <p className="text-xs text-[#888888]">
                    {lang === 'vi'
                      ? 'Tạo lớp đệm vân nền Content-Aware Patching rồi làm mờ nhẹ theo bán kính với đường cong viền cosine mượt mà.'
                      : 'Builds a Content-Aware patch underlay and applies controlled radius blur with smooth cosine transition curves.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIDE-BY-SIDE & COMPARISON INSPECTION */}
          {activeTab === 'compare_features' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-3">
                <h5 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Columns className="w-4 h-4 text-[#00B0FF]" />
                  {lang === 'vi' ? '2 Chế độ so sánh Before / After chuyên nghiệp' : '2 Professional Before/After Comparison Modes'}
                </h5>
                <p className="text-xs text-[#888888]">
                  {lang === 'vi'
                    ? 'Ứng dụng cung cấp thanh công cụ so sánh trực quan để bạn kiểm tra từng chi tiết trước và sau khi xóa watermark:'
                    : 'The app offers dedicated comparison viewports to verify inpainting quality down to the individual pixel:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <SplitSquareHorizontal className="w-4 h-4 text-[#FF5D22]" />
                      <span>Split-Slider (Thanh trượt)</span>
                    </div>
                    <p className="text-xs text-[#AAAAAA]">
                      {lang === 'vi'
                        ? 'Kéo con trượt qua lại giữa video/ảnh gốc (bên trái) và kết quả sạch (bên phải) trên cùng một khung hình để thấy sự khác biệt tức thì.'
                        : 'Drag the interactive divider across the canvas to seamlessly reveal original (left) vs cleaned (right) media.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <Columns className="w-4 h-4 text-[#00E676]" />
                      <span>Side-by-Side (Song song 2 cửa sổ)</span>
                    </div>
                    <p className="text-xs text-[#AAAAAA]">
                      {lang === 'vi'
                        ? 'Hiển thị song song 2 màn hình gốc và sạch độc lập. Tua và phát video đồng bộ 100% từng khung hình (frame-locked sync).'
                        : 'Displays two independent panels side-by-side with synchronized frame-locked video playback and scrub controls.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Zoom & ROI Indicators */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-2">
                <h5 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#00E676]" />
                  {lang === 'vi' ? 'Soi chi tiết với Zoom 100% – 250% & Vùng ROI' : 'Pixel-Level Zoom (100% – 250%) & ROI Markers'}
                </h5>
                <p className="text-xs text-[#888888]">
                  {lang === 'vi'
                    ? 'Bạn có thể bấm nút phóng to (+) để soi cận cảnh khu vực xóa watermark ở mức 150%, 200%, 250%. Bật nút "Vùng ROI" để hiển thị khung đánh dấu vị trí watermark ban đầu.'
                    : 'Use the zoom controls (+) to inspect the inpainted area at 150%, 200%, or 250% scale. Toggle "ROI Region" to highlight the watermark position on the original footage.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SHORTCUTS & TIPS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              {/* Keyboard Shortcuts List */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C]">
                <h5 className="font-semibold text-white text-sm flex items-center gap-2 mb-3">
                  <Keyboard className="w-4 h-4 text-[#00E676]" />
                  {lang === 'vi' ? 'Phím tắt bàn phím tiện lợi' : 'Convenient Keyboard Shortcuts'}
                </h5>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#222222]">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 rounded bg-[#0A0A0A] border border-[#333333] font-mono text-xs text-white font-bold shadow-sm">
                        Space
                      </kbd>
                      <span className="text-xs text-[#CCCCCC]">
                        {lang === 'vi' ? 'Phát / Tạm dừng video preview' : 'Play / Pause video preview'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#888888] hidden sm:inline">
                      {lang === 'vi' ? 'Dừng tại khung hình cần chọn' : 'Pause on target frame'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#222222]">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 rounded bg-[#0A0A0A] border border-[#333333] font-mono text-xs text-white font-bold shadow-sm">
                        R
                      </kbd>
                      <span className="text-xs text-[#CCCCCC]">
                        {lang === 'vi' ? 'Khôi phục vùng chọn (Reset ROI)' : 'Reset ROI bounding box'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#888888] hidden sm:inline">
                      {lang === 'vi' ? 'Đưa khung đỏ về vị trí mặc định' : 'Reset to default corner'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#222222]">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 rounded bg-[#0A0A0A] border border-[#333333] font-mono text-xs text-white font-bold shadow-sm">
                        ↵ Enter
                      </kbd>
                      <span className="text-xs text-[#CCCCCC]">
                        {lang === 'vi' ? 'Bắt đầu xử lý xóa Watermark' : 'Trigger watermark removal'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#888888] hidden sm:inline">
                      {lang === 'vi' ? 'Kích hoạt ngay' : 'Start processing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Undo Stack & Batch Export Tips */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-3">
                <h5 className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5D22]" />
                  {lang === 'vi' ? 'Tính năng Hoàn tác (Undo Stack) & Xuất Batch có Ngày Giờ' : 'Undo Stack & Batch Export with Timestamps'}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#AAAAAA]">
                  <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] space-y-1">
                    <span className="font-bold text-white block">
                      {lang === 'vi' ? 'Hoàn tác tức thì (Undo Stack):' : 'Instant Undo Stack:'}
                    </span>
                    <p>
                      {lang === 'vi'
                        ? 'Nếu watermark chưa sạch hoàn toàn hoặc AI Auto-Tune cần tinh chỉnh lại, bấm "Hoàn tác" ở Queue Manager để khôi phục ngay trạng thái trước đó mà không mất dữ liệu.'
                        : 'If the watermark is not fully removed or you want to adjust AI parameters, click "Undo" in the Queue Manager to immediately revert the state.'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] space-y-1">
                    <span className="font-bold text-white block">
                      {lang === 'vi' ? 'Tên tệp kèm Ngày & Giờ:' : 'Date & Time in Filenames:'}
                    </span>
                    <p>
                      {lang === 'vi'
                        ? 'Tự động thêm dấu mốc thời gian YYYYMMDD_HHMMSS vào tên tệp xuất và gói Batch ZIP giúp bạn dễ dàng đối chiếu các phiên bản xuất khác nhau.'
                        : 'Automatically attaches a YYYYMMDD_HHMMSS timestamp to exported files and batch ZIP archives for easy version tracking.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Magnifying Glass Feature Explanation */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-2">
                <h5 className="font-semibold text-white text-sm flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-[#FF5D22]" />
                  {lang === 'vi' ? 'Kính lúp (Magnifying Loupe) độ nét cao' : 'High-Precision Magnifying Loupe'}
                </h5>
                <p className="text-xs text-[#888888]">
                  {lang === 'vi'
                    ? 'Khi rê chuột qua khung video hoặc ảnh, kính lúp sẽ tự động phóng to 2x, 3x, 4x các điểm ảnh xung quanh con trỏ chuột. Hãy căn khung màu đỏ vừa khít mép watermark để thuật toán đạt kết quả xóa hoàn hảo nhất.'
                    : 'Hovering over the preview canvas reveals a 2x-4x magnifying lens. Snug the red box tightly against the logo boundary for optimal blending.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#FF7D00] font-medium pt-1">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'vi'
                      ? 'Mẹo: Khung chọn càng khít chữ/logo, thuật toán càng ít phải can thiệp và giữ nguyên 100% độ sắc nét xung quanh.'
                      : 'Pro-Tip: Keeping the ROI snug around the logo minimizes inpainting footprint and preserves total background sharpness.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TECHNICAL & OFFLINE RUNNING */}
          {activeTab === 'offline_tech' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#1A1A1A] space-y-1.5">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00E676]" />
                  {lang === 'vi' ? 'Kiến trúc Dual-Engine (FFmpeg.wasm & Canvas Pipeline)' : 'Dual-Engine Architecture (FFmpeg.wasm & Canvas)'}
                </h4>
                <p className="text-xs text-[#888888]">
                  {lang === 'vi'
                    ? 'Ứng dụng tự động điều phối giữa WebAssembly C++ đa luồng và HTML5 Canvas TypedArray siêu tốc. Khi chạy trên môi trường có header COOP/COEP, FFmpeg.wasm sẽ tăng tốc phần cứng. Trên các môi trường khác, Canvas Inpainting Engine vẫn chạy mượt mà độc lập 100%.'
                    : 'The app dynamically routes tasks between multi-threaded WebAssembly C++ and ultra-fast HTML5 Canvas TypedArrays, guaranteeing universal offline execution without server dependencies.'}
                </p>
              </div>

              {/* Section: VS Code Live Server */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#FF7D00]" />
                    {lang === 'vi' ? 'Cấu hình VS Code Live Server (Offline)' : 'VS Code Live Server Offline Setup'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => copyCode('vscode', liveServerSnippet)}
                    className="px-2 py-1 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-xs text-[#E0E0E0] flex items-center gap-1 font-mono cursor-pointer"
                  >
                    {copiedSection === 'vscode' ? <Check className="w-3 h-3 text-[#00E676]" /> : <Copy className="w-3 h-3" />}
                    {lang === 'vi' ? 'Sao chép' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#050505] border border-[#222222] text-xs font-mono text-[#FF7D00] overflow-x-auto">
                  {liveServerSnippet}
                </pre>
              </div>

              {/* Section: Vite & Express */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#00E676]" />
                    {lang === 'vi' ? 'Cấu hình Vite / Node.js Server' : 'Vite / Node.js Server Config'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => copyCode('vite', viteSnippet)}
                    className="px-2 py-1 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-xs text-[#E0E0E0] flex items-center gap-1 font-mono cursor-pointer"
                  >
                    {copiedSection === 'vite' ? <Check className="w-3 h-3 text-[#00E676]" /> : <Copy className="w-3 h-3" />}
                    {lang === 'vi' ? 'Sao chép' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#050505] border border-[#222222] text-xs font-mono text-[#00E676] overflow-x-auto">
                  {viteSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-[#1A1A1A] bg-[#0D0D0D] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#666666]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
            <span>
              {lang === 'vi'
                ? 'Hỗ trợ Veo 3, Flow AI / Omni, Gemini, TikTok, CapCut'
                : 'Supports Veo 3, Flow AI / Omni, Gemini, TikTok, CapCut'}
            </span>
          </div>
          <button
            type="button"
            id="btn-confirm-close-guide"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-semibold shadow-[0_2px_10px_rgba(255,93,34,0.3)] transition-all cursor-pointer"
          >
            {lang === 'vi' ? 'Đã hiểu & Đóng' : 'Got it & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
