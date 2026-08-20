import React, { useRef, useState, useEffect } from 'react';
import { MediaItem } from '../types';
import {
  Download,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  SplitSquareHorizontal,
  Eye,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Columns,
  Maximize2,
  Crosshair,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SplitScreenPreviewProps {
  item: MediaItem;
  onDownload: (item: MediaItem) => void;
  onStartOver?: () => void;
}

export const SplitScreenPreview: React.FC<SplitScreenPreviewProps> = ({
  item,
  onDownload,
  onStartOver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const dualBeforeVideoRef = useRef<HTMLVideoElement>(null);
  const dualAfterVideoRef = useRef<HTMLVideoElement>(null);

  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split-slider' | 'dual-window'>('split-slider');
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 100%, 150%, 200%, 250%
  const [highlightROI, setHighlightROI] = useState<boolean>(false);

  // Synchronized playback controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(item.duration || 5);

  useEffect(() => {
    // Fire celebratory confetti on first mount of completed item
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FF5D22', '#00E676', '#FFD600', '#00B0FF'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Synchronize playback across all active video refs
  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    if (item.type === 'video') {
      const vids = [
        beforeVideoRef.current,
        afterVideoRef.current,
        dualBeforeVideoRef.current,
        dualAfterVideoRef.current,
      ];

      vids.forEach((v) => {
        if (v) {
          if (nextState) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      });
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setCurrentTime(video.currentTime);
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    const vids = [
      beforeVideoRef.current,
      afterVideoRef.current,
      dualBeforeVideoRef.current,
      dualAfterVideoRef.current,
    ];
    vids.forEach((v) => {
      if (v) v.currentTime = time;
    });
  };

  // Sync dual-pane video events
  const syncVideos = (sourceTime: number) => {
    const vids = [
      dualBeforeVideoRef.current,
      dualAfterVideoRef.current,
      beforeVideoRef.current,
      afterVideoRef.current,
    ];
    vids.forEach((v) => {
      if (v && Math.abs(v.currentTime - sourceTime) > 0.3) {
        v.currentTime = sourceTime;
      }
    });
  };

  // Listen to global shortcut trigger for video play/pause (Space key)
  useEffect(() => {
    const handleGlobalToggle = () => {
      if (item.type === 'video') {
        togglePlay();
      }
    };
    window.addEventListener('veo3:toggle-play', handleGlobalToggle);
    return () => {
      window.removeEventListener('veo3:toggle-play', handleGlobalToggle);
    };
  }, [isPlaying, item.type]);

  // Slider Drag Events
  const handleSliderMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSlider(true);
    handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      }
    };
    const handleGlobalMouseUp = () => {
      setIsDraggingSlider(false);
    };

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingSlider]);

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Action & View Mode Toolbar */}
      <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">Đã xóa sạch Watermark</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E676]/15 text-[#00E676] font-semibold border border-[#00E676]/30">
                100% SẠCH
              </span>
            </div>
            <p className="text-xs text-[#888888] font-mono">
              {item.width}×{item.height}px • Thuật toán {item.settings.algorithm.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Center View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#050505] rounded-lg border border-[#1A1A1A] text-xs">
          <button
            type="button"
            id="btn-view-split-slider"
            onClick={() => setViewMode('split-slider')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'split-slider'
                ? 'bg-[#FF5D22] text-white shadow-[0_2px_8px_rgba(255,93,34,0.35)]'
                : 'text-[#888888] hover:text-white'
            }`}
            title="Thanh trượt chia đôi so sánh trước/sau (Split-slider comparison)"
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
            <span>Split-Slider (Thanh trượt)</span>
          </button>

          <button
            type="button"
            id="btn-view-side-by-side"
            onClick={() => setViewMode('dual-window')}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'dual-window'
                ? 'bg-[#FF5D22] text-white shadow-[0_2px_8px_rgba(255,93,34,0.35)]'
                : 'text-[#888888] hover:text-white'
            }`}
            title="So sánh song song 2 cửa sổ để soi chi tiết (Side-by-side dual-window comparison)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side (Song song)</span>
          </button>
        </div>

        {/* Right Tools: Zoom & Download */}
        <div className="flex items-center gap-2">
          {/* Watermark ROI Marker Toggle */}
          <button
            type="button"
            onClick={() => setHighlightROI((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              highlightROI
                ? 'bg-[#FF5D22]/15 border-[#FF5D22]/50 text-[#FF5D22]'
                : 'bg-[#050505] border-[#1A1A1A] text-[#888888] hover:text-white'
            }`}
            title="Bật/tắt đánh dấu vị trí vùng watermark ban đầu"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vùng ROI</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#050505] px-2 py-1 rounded border border-[#1A1A1A] text-xs text-[#E0E0E0]">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(100, z - 50))}
              disabled={zoomLevel <= 100}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono min-w-[38px] text-center text-xs">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(250, z + 50))}
              disabled={zoomLevel >= 250}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Phóng to để soi chi tiết từng pixel"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onStartOver && (
            <button
              type="button"
              id="btn-preview-start-over"
              onClick={onStartOver}
              className="px-3 py-2 rounded-md bg-[#141414] hover:bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#FF5D22]/40 text-[#CCCCCC] hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Làm mới để chọn và xử lý video/ảnh mới"
            >
              <RotateCcw className="w-4 h-4 text-[#FF5D22]" />
              <span>Xử lý tệp khác</span>
            </button>
          )}

          <button
            type="button"
            id="btn-download-clean-file"
            onClick={() => onDownload(item)}
            className="px-4 py-2 rounded-md bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-[0_4px_15px_rgba(255,93,34,0.35)] transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải tệp sạch ({item.type === 'video' ? 'MP4/WebM' : 'PNG'})</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Stage */}
      {viewMode === 'split-slider' ? (
        /* ================= 1. SPLIT SLIDER VIEW ================= */
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#1A1A1A] shadow-2xl select-none cursor-ew-resize group"
        >
          <div
            className="w-full h-full relative transition-transform duration-100"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'bottom right',
            }}
          >
            {/* AFTER (Cleaned Media) - Full Background */}
            <div className="absolute inset-0 w-full h-full">
              {item.type === 'video' ? (
                <video
                  ref={afterVideoRef}
                  src={item.processedUrl!}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                  loop
                  muted
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <img
                  src={item.processedUrl!}
                  alt="Cleaned After"
                  className="w-full h-full object-contain pointer-events-none"
                />
              )}
            </div>

            {/* BEFORE (Original Media) - Clipped by Slider */}
            <div
              style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
              className="absolute inset-0 w-full h-full"
            >
              {item.type === 'video' ? (
                <video
                  ref={beforeVideoRef}
                  src={item.originalUrl}
                  playsInline
                  loop
                  muted
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <img
                  src={item.originalUrl}
                  alt="Original Before"
                  className="w-full h-full object-contain pointer-events-none"
                />
              )}

              {/* Optional ROI Bounding Box Highlight on Before */}
              {highlightROI && item.roi && (
                <div
                  style={{
                    left: `${(item.roi.x / (item.width || 1280)) * 100}%`,
                    top: `${(item.roi.y / (item.height || 720)) * 100}%`,
                    width: `${(item.roi.width / (item.width || 1280)) * 100}%`,
                    height: `${(item.roi.height / (item.height || 720)) * 100}%`,
                  }}
                  className="absolute border-2 border-dashed border-[#FF5D22] bg-[#FF5D22]/10 pointer-events-none rounded"
                >
                  <span className="absolute -top-5 left-0 px-1 py-0.2 rounded bg-[#FF5D22] text-white text-[9px] font-mono font-bold">
                    Vùng watermark
                  </span>
                </div>
              )}
            </div>

            {/* Draggable Vertical Divider Bar */}
            <div
              style={{ left: `${sliderPos}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)] pointer-events-none"
            >
              {/* Center Handle / Grip */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FF5D22] text-white shadow-2xl flex items-center justify-center border-2 border-white pointer-events-auto cursor-ew-resize active:scale-110 transition-transform">
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Fixed Floating HUD Badges */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/85 border border-[#262626] backdrop-blur-md text-[#888888] text-xs font-semibold flex items-center gap-1.5 shadow-lg pointer-events-none">
            <Eye className="w-3.5 h-3.5 text-[#FF5D22]" />
            <span>BEFORE (GỐC)</span>
          </div>

          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/85 border border-[#00E676]/50 backdrop-blur-md text-[#00E676] text-xs font-semibold flex items-center gap-1.5 shadow-lg pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
            <span>AFTER (ĐÃ XÓA SẠCH)</span>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 border border-[#262626] text-[11px] text-[#AAAAAA] backdrop-blur-md pointer-events-none">
            Kéo thanh trượt qua trái / phải để so sánh
          </div>
        </div>
      ) : (
        /* ================= 2. SIDE-BY-SIDE DUAL WINDOW VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Window: BEFORE (Original Media) */}
          <div className="relative aspect-video rounded-xl bg-black border border-[#2A2A2A] overflow-hidden shadow-xl flex flex-col group">
            {/* Header Badge */}
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/85 border border-[#333333] backdrop-blur-md text-xs font-semibold text-[#888888] flex items-center gap-1.5 shadow-md">
              <Eye className="w-3.5 h-3.5 text-[#FF5D22]" />
              <span>GỐC (CÓ WATERMARK)</span>
            </div>

            <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded bg-black/80 border border-[#222222] text-[10px] font-mono text-[#888888]">
              {item.width}×{item.height}px
            </div>

            {/* Media Content with zoom */}
            <div
              className="w-full h-full relative overflow-hidden transition-transform duration-100 flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'bottom right',
              }}
            >
              {item.type === 'video' ? (
                <video
                  ref={dualBeforeVideoRef}
                  src={item.originalUrl}
                  onTimeUpdate={(e) => syncVideos(e.currentTarget.currentTime)}
                  playsInline
                  loop
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={item.originalUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Watermark Region Outline on Dual-View */}
              {(highlightROI || zoomLevel > 100) && item.roi && (
                <div
                  style={{
                    left: `${(item.roi.x / (item.width || 1280)) * 100}%`,
                    top: `${(item.roi.y / (item.height || 720)) * 100}%`,
                    width: `${(item.roi.width / (item.width || 1280)) * 100}%`,
                    height: `${(item.roi.height / (item.height || 720)) * 100}%`,
                  }}
                  className="absolute border border-dashed border-[#FF5D22] bg-[#FF5D22]/10 pointer-events-none rounded"
                />
              )}
            </div>

            <div className="absolute bottom-2 left-3 text-[10px] text-[#666666] font-mono z-10">
              Vị trí Watermark: ({Math.round(item.roi.x)}, {Math.round(item.roi.y)})
            </div>
          </div>

          {/* Right Window: AFTER (Cleaned Result) */}
          <div className="relative aspect-video rounded-xl bg-black border border-[#00E676]/40 overflow-hidden shadow-2xl shadow-[#00E676]/10 flex flex-col group">
            {/* Header Badge */}
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/85 border border-[#00E676]/50 backdrop-blur-md text-xs font-semibold text-[#00E676] flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#00E676]" />
              <span>KẾT QUẢ ĐÃ XÓA SẠCH</span>
            </div>

            <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded bg-black/80 border border-[#00E676]/30 text-[10px] font-mono text-[#00E676]">
              {item.settings.algorithm.toUpperCase()}
            </div>

            {/* Media Content with zoom */}
            <div
              className="w-full h-full relative overflow-hidden transition-transform duration-100 flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'bottom right',
              }}
            >
              {item.type === 'video' ? (
                <video
                  ref={dualAfterVideoRef}
                  src={item.processedUrl!}
                  onTimeUpdate={(e) => {
                    handleTimeUpdate(e);
                    syncVideos(e.currentTarget.currentTime);
                  }}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                  loop
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={item.processedUrl!}
                  alt="Cleaned Result"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="absolute bottom-2 left-3 text-[10px] text-[#00E676]/80 font-mono z-10 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
              <span>Hòa trộn họa tiết lân cận tự nhiên (Không lộ vết)</span>
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Video Controller (For Video items) */}
      {item.type === 'video' && (
        <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] flex items-center gap-3 shadow-lg">
          <button
            type="button"
            id="btn-preview-toggle-play"
            onClick={togglePlay}
            className="p-2 rounded-lg bg-[#FF5D22] hover:bg-[#FF3D00] text-white transition-all shadow-[0_2px_10px_rgba(255,93,34,0.3)] flex items-center gap-1.5 cursor-pointer"
            title={isPlaying ? 'Tạm dừng cả 2 video (Phím Space)' : 'Phát đồng bộ Before/After (Phím Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-black/40 border border-white/20 text-[9px] font-mono text-white/90">
              Space
            </kbd>
          </button>

          <span className="text-xs font-mono text-[#AAAAAA] min-w-[45px]">
            {currentTime.toFixed(1)}s
          </span>

          <input
            type="range"
            min="0"
            max={duration || 10}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-[#FF5D22] h-1.5 bg-[#222222] rounded-lg cursor-pointer"
          />

          <span className="text-xs font-mono text-[#888888] min-w-[45px]">
            {duration.toFixed(1)}s
          </span>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111111] text-[#777777] border border-[#222222] hidden md:inline-block">
            {viewMode === 'split-slider' ? 'Split-Slider Mode' : 'Dual-Window Mode'}
          </span>
        </div>
      )}
    </div>
  );
};
