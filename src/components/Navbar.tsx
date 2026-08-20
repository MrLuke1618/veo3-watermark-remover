import React from 'react';
import { ShieldCheck, FileCode, HelpCircle, Cpu, RotateCcw } from 'lucide-react';

interface NavbarProps {
  queueCount: number;
  onOpenGuide: () => void;
  onOpenExportModal: () => void;
  onOpenLogs: () => void;
  onStartOver: () => void;
  hasItems: boolean;
  isProcessing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  queueCount,
  onOpenGuide,
  onOpenExportModal,
  onOpenLogs,
  onStartOver,
  hasItems,
  isProcessing,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1A1A1A] bg-[#0A0A0A]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#FF3D00] to-[#FF7D00] flex items-center justify-center font-bold text-white text-sm shadow-[0_0_12px_rgba(255,93,34,0.35)] shrink-0">
            V3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base sm:text-lg tracking-[-0.5px] text-white">
                VEO3 <span className="text-[#FF5D22]">Local Watermark Remover Pro</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-[#FF5D22]/15 text-[#FF5D22] border border-[#FF5D22]/30">
                PRO LOCAL
              </span>
            </div>
            <p className="text-[11px] text-[#666666] hidden sm:block">
              100% Client-Side AI Inpainting & FFmpeg.wasm Engine
            </p>
          </div>
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Start Over Button (When items are present) */}
          {hasItems && (
            <button
              type="button"
              id="btn-start-over"
              onClick={onStartOver}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#FF0000]/15 border border-[#2A2A2A] hover:border-[#FF0000]/30 text-[#E0E0E0] hover:text-[#FF4444] text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Làm mới từ đầu, xóa bộ nhớ cache để chọn video/ảnh mới"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bắt đầu lại / Start Over</span>
              <span className="sm:hidden">Reset</span>
            </button>
          )}

          {/* Engine Logs Button */}
          <button
            type="button"
            id="btn-open-logs"
            onClick={onOpenLogs}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-[#CCCCCC] hover:text-white text-xs transition-all cursor-pointer"
            title="Xem nhật ký bộ máy xử lý"
          >
            <Cpu className={`w-3.5 h-3.5 ${isProcessing ? 'text-[#FF5D22] animate-spin' : 'text-[#888888]'}`} />
            <span className="hidden sm:inline">Logs</span>
          </button>

          {/* Help & Guide Button */}
          <button
            type="button"
            id="btn-open-guide"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-[#CCCCCC] hover:text-white text-xs transition-all cursor-pointer"
            title="Trung tâm Trợ giúp & Hướng dẫn (Tiếng Việt / English)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#FF7D00]" />
            <span className="hidden sm:inline">Trợ giúp / Help</span>
            <span className="sm:hidden">Help</span>
          </button>

          {/* Source Export Button */}
          <button
            type="button"
            id="btn-open-source-bundle"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-semibold shadow-[0_4px_15px_rgba(255,93,34,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Bundle</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
};


