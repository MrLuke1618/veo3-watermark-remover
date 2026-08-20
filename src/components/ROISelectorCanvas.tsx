import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ROI, PresetROI } from '../types';
import { PRESETS } from '../utils/presets';
import { RotateCcw, Crosshair, Sparkles, Move, Play, Pause, Search, ZoomIn, Wand2, RefreshCw } from 'lucide-react';

interface ROISelectorCanvasProps {
  mediaType: 'video' | 'image';
  mediaUrl: string;
  nativeWidth: number;
  nativeHeight: number;
  roi: ROI;
  onROIChange: (roi: ROI) => void;
  videoDuration?: number;
  onAutoTune?: () => void;
  isAnalyzing?: boolean;
}

type DragMode = 'draw' | 'move' | 'resize' | null;
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;

export const ROISelectorCanvas: React.FC<ROISelectorCanvasProps> = ({
  mediaType,
  mediaUrl,
  nativeWidth,
  nativeHeight,
  roi,
  onROIChange,
  videoDuration,
  onAutoTune,
  isAnalyzing,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null);

  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startROI, setStartROI] = useState<ROI>(roi);

  // Video playback state for scrubbing
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Magnifying Glass (Loupe) State
  const [isMagnifierEnabled, setIsMagnifierEnabled] = useState(true);
  const [magnifierZoom, setMagnifierZoom] = useState<number>(3); // 2x, 3x, 4x
  const [hoverPos, setHoverPos] = useState<{
    displayX: number;
    displayY: number;
    nativeX: number;
    nativeY: number;
  } | null>(null);

  // Calculate container aspect ratio and scale factor
  const [displayDims, setDisplayDims] = useState<{ width: number; height: number }>({
    width: 800,
    height: 450,
  });

  const updateDisplayDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cWidth = rect.width;
    const aspect = (nativeHeight || 9) / (nativeWidth || 16);
    const cHeight = cWidth * aspect;
    setDisplayDims({ width: cWidth, height: cHeight });
  }, [nativeWidth, nativeHeight]);

  useEffect(() => {
    updateDisplayDimensions();
    window.addEventListener('resize', updateDisplayDimensions);
    return () => window.removeEventListener('resize', updateDisplayDimensions);
  }, [updateDisplayDimensions]);

  // Scale helpers between native media coords and display coords
  const scaleX = displayDims.width / (nativeWidth || 1);
  const scaleY = displayDims.height / (nativeHeight || 1);

  const displayROI = {
    x: roi.x * scaleX,
    y: roi.y * scaleY,
    width: roi.width * scaleX,
    height: roi.height * scaleY,
  };

  // Convert mouse screen client coords to native coords
  const getEventMediaCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0, displayX: 0, displayY: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const clickY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const nativeX = Math.round(clickX / scaleX);
    const nativeY = Math.round(clickY / scaleY);

    return {
      x: Math.max(0, Math.min(nativeWidth, nativeX)),
      y: Math.max(0, Math.min(nativeHeight, nativeY)),
      displayX: clickX,
      displayY: clickY,
    };
  };

  // Render real-time Magnifying Glass canvas frame
  const renderMagnifier = useCallback(() => {
    if (!isMagnifierEnabled || !hoverPos || !magnifierCanvasRef.current) return;
    const canvas = magnifierCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceElement = mediaType === 'video' ? videoRef.current : imageRef.current;
    if (!sourceElement) return;

    const lensSize = canvas.width; // 160px
    const zoomFactor = magnifierZoom;
    const srcSize = lensSize / zoomFactor;

    // Center source crop window around native hover position
    const sx = Math.max(0, Math.min(nativeWidth - srcSize, hoverPos.nativeX - srcSize / 2));
    const sy = Math.max(0, Math.min(nativeHeight - srcSize, hoverPos.nativeY - srcSize / 2));

    ctx.clearRect(0, 0, lensSize, lensSize);

    // Disable image smoothing for crisp pixel-level edge alignment
    ctx.imageSmoothingEnabled = false;

    // Draw magnified media
    try {
      ctx.drawImage(sourceElement, sx, sy, srcSize, srcSize, 0, 0, lensSize, lensSize);
    } catch {
      // Ignore if video frame not yet ready
    }

    // Draw subtle pixel grid overlay for high magnification
    if (zoomFactor >= 3) {
      const step = zoomFactor;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= lensSize; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, lensSize);
        ctx.stroke();
      }
      for (let y = 0; y <= lensSize; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(lensSize, y);
        ctx.stroke();
      }
    }

    // Draw magnified ROI boundary if overlapping with the magnified viewport
    const roiLensX = (roi.x - sx) * zoomFactor;
    const roiLensY = (roi.y - sy) * zoomFactor;
    const roiLensW = roi.width * zoomFactor;
    const roiLensH = roi.height * zoomFactor;

    // Fill semi-transparent red inside ROI
    ctx.fillStyle = 'rgba(255, 0, 0, 0.18)';
    ctx.fillRect(roiLensX, roiLensY, roiLensW, roiLensH);

    // Stroke crisp red dashed ROI border
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(roiLensX, roiLensY, roiLensW, roiLensH);
    ctx.setLineDash([]);

    // Draw central Reticle / Crosshair for pinpoint alignment
    const center = lensSize / 2;
    const crosshairSize = 14;
    const gap = 3;

    ctx.strokeStyle = '#FF5D22';
    ctx.lineWidth = 1.5;

    // Horizontal crosshair lines
    ctx.beginPath();
    ctx.moveTo(center - crosshairSize, center);
    ctx.lineTo(center - gap, center);
    ctx.moveTo(center + gap, center);
    ctx.lineTo(center + crosshairSize, center);
    ctx.stroke();

    // Vertical crosshair lines
    ctx.beginPath();
    ctx.moveTo(center, center - crosshairSize);
    ctx.lineTo(center, center - gap);
    ctx.moveTo(center, center + gap);
    ctx.lineTo(center, center + crosshairSize);
    ctx.stroke();

    // Center micro dot
    ctx.fillStyle = '#00E676';
    ctx.beginPath();
    ctx.arc(center, center, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }, [isMagnifierEnabled, hoverPos, magnifierZoom, mediaType, nativeWidth, nativeHeight, roi]);

  // Continuous animation frame loop for video playback loupe updates
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderMagnifier();
      if (isPlaying || dragMode) {
        animId = requestAnimationFrame(loop);
      }
    };
    renderMagnifier();
    if (isPlaying || dragMode) {
      animId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animId);
  }, [renderMagnifier, isPlaying, dragMode]);

  // Mouse Move on Container to update Hover / Loupe position
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const coords = getEventMediaCoords(e);
    setHoverPos({
      displayX: coords.displayX,
      displayY: coords.displayY,
      nativeX: coords.x,
      nativeY: coords.y,
    });
  };

  const handleContainerMouseLeave = () => {
    setHoverPos(null);
  };

  // Mouse Down handler: Detect if clicking a resize handle, inside ROI to move, or blank space to draw new ROI
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = getEventMediaCoords(e);

    // Check if clicked near resize handles
    const handleThreshold = 10;
    const dx = coords.displayX;
    const dy = coords.displayY;

    const rx = displayROI.x;
    const ry = displayROI.y;
    const rw = displayROI.width;
    const rh = displayROI.height;

    let handle: ResizeHandle = null;

    if (Math.abs(dx - rx) < handleThreshold && Math.abs(dy - ry) < handleThreshold) handle = 'nw';
    else if (Math.abs(dx - (rx + rw)) < handleThreshold && Math.abs(dy - ry) < handleThreshold) handle = 'ne';
    else if (Math.abs(dx - (rx + rw)) < handleThreshold && Math.abs(dy - (ry + rh)) < handleThreshold) handle = 'se';
    else if (Math.abs(dx - rx) < handleThreshold && Math.abs(dy - (ry + rh)) < handleThreshold) handle = 'sw';
    else if (Math.abs(dy - ry) < handleThreshold && dx >= rx && dx <= rx + rw) handle = 'n';
    else if (Math.abs(dx - (rx + rw)) < handleThreshold && dy >= ry && dy <= ry + rh) handle = 'e';
    else if (Math.abs(dy - (ry + rh)) < handleThreshold && dx >= rx && dx <= rx + rw) handle = 's';
    else if (Math.abs(dx - rx) < handleThreshold && dy >= ry && dy <= ry + rh) handle = 'w';

    if (handle) {
      setDragMode('resize');
      setActiveHandle(handle);
      setStartPos({ x: coords.x, y: coords.y });
      setStartROI({ ...roi });
      return;
    }

    // Check if clicked inside ROI to move
    if (coords.x >= roi.x && coords.x <= roi.x + roi.width && coords.y >= roi.y && coords.y <= roi.y + roi.height) {
      setDragMode('move');
      setStartPos({ x: coords.x, y: coords.y });
      setStartROI({ ...roi });
      return;
    }

    // Clicked outside: Start drawing a brand new rectangle ROI
    setDragMode('draw');
    setStartPos({ x: coords.x, y: coords.y });
    onROIChange({
      x: coords.x,
      y: coords.y,
      width: 2,
      height: 2,
    });
  };

  // Global mouse move & up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragMode) return;
      const coords = getEventMediaCoords(e);
      setHoverPos({
        displayX: coords.displayX,
        displayY: coords.displayY,
        nativeX: coords.x,
        nativeY: coords.y,
      });

      if (dragMode === 'draw') {
        const x1 = Math.min(startPos.x, coords.x);
        const y1 = Math.min(startPos.y, coords.y);
        const x2 = Math.max(startPos.x, coords.x);
        const y2 = Math.max(startPos.y, coords.y);

        onROIChange({
          x: Math.max(0, x1),
          y: Math.max(0, y1),
          width: Math.max(4, Math.min(nativeWidth - x1, x2 - x1)),
          height: Math.max(4, Math.min(nativeHeight - y1, y2 - y1)),
        });
      } else if (dragMode === 'move') {
        const deltaX = coords.x - startPos.x;
        const deltaY = coords.y - startPos.y;

        const newX = Math.max(0, Math.min(nativeWidth - startROI.width, startROI.x + deltaX));
        const newY = Math.max(0, Math.min(nativeHeight - startROI.height, startROI.y + deltaY));

        onROIChange({
          ...startROI,
          x: Math.round(newX),
          y: Math.round(newY),
        });
      } else if (dragMode === 'resize' && activeHandle) {
        const deltaX = coords.x - startPos.x;
        const deltaY = coords.y - startPos.y;

        let newX = startROI.x;
        let newY = startROI.y;
        let newW = startROI.width;
        let newH = startROI.height;

        if (activeHandle.includes('e')) newW = Math.max(4, startROI.width + deltaX);
        if (activeHandle.includes('s')) newH = Math.max(4, startROI.height + deltaY);
        if (activeHandle.includes('w')) {
          const proposedW = startROI.width - deltaX;
          if (proposedW >= 4) {
            newX = startROI.x + deltaX;
            newW = proposedW;
          }
        }
        if (activeHandle.includes('n')) {
          const proposedH = startROI.height - deltaY;
          if (proposedH >= 4) {
            newY = startROI.y + deltaY;
            newH = proposedH;
          }
        }

        onROIChange({
          x: Math.max(0, Math.min(nativeWidth - 4, Math.round(newX))),
          y: Math.max(0, Math.min(nativeHeight - 4, Math.round(newY))),
          width: Math.max(4, Math.min(nativeWidth - newX, Math.round(newW))),
          height: Math.max(4, Math.min(nativeHeight - newY, Math.round(newH))),
        });
      }
    };

    const handleMouseUp = () => {
      setDragMode(null);
      setActiveHandle(null);
    };

    if (dragMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, activeHandle, startPos, startROI, nativeWidth, nativeHeight, onROIChange]);

  const handleApplyPreset = (preset: PresetROI) => {
    const newROI = preset.calcROI(nativeWidth, nativeHeight);
    onROIChange(newROI);
  };

  const handleResetROI = () => {
    const defaultPreset = PRESETS[0];
    onROIChange(defaultPreset.calcROI(nativeWidth, nativeHeight));
  };

  // Video Scrubbing controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Listen to global shortcut trigger for video play/pause (Space key)
  useEffect(() => {
    const handleGlobalToggle = () => {
      if (mediaType === 'video') {
        togglePlay();
      }
    };
    window.addEventListener('veo3:toggle-play', handleGlobalToggle);
    return () => {
      window.removeEventListener('veo3:toggle-play', handleGlobalToggle);
    };
  }, [mediaType]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Calculate intelligent screen positioning for the magnifying loupe
  const getLoupePosition = () => {
    if (!hoverPos) return { left: 16, top: 16 };
    const lensRadius = 80;
    const margin = 20;

    // Prefer top-right of cursor, flip if near edge
    let left = hoverPos.displayX + margin;
    let top = hoverPos.displayY - lensRadius * 2 - margin;

    // Flip to left if hitting right container boundary
    if (left + lensRadius * 2 > displayDims.width - 10) {
      left = hoverPos.displayX - lensRadius * 2 - margin;
    }
    // Flip to bottom if hitting top container boundary
    if (top < 10) {
      top = hoverPos.displayY + margin;
    }

    // Clamp inside container
    left = Math.max(10, Math.min(displayDims.width - lensRadius * 2 - 10, left));
    top = Math.max(10, Math.min(displayDims.height - lensRadius * 2 - 10, top));

    return { left, top };
  };

  const loupePos = getLoupePosition();

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Top Controls Toolbar: Quick Presets & Magnifier Controls & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A]">
        {/* Preset quick buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-xs font-semibold text-[#888888] flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5D22]" />
            Presets:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 rounded text-xs font-medium bg-[#141414] hover:bg-[#1F1F1F] text-[#E0E0E0] border border-[#262626] hover:border-[#333333] transition-all whitespace-nowrap active:scale-95"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Right Tools: Magnifier Toggle & Zoom + Reset ROI */}
        <div className="flex items-center gap-2">
          {/* Magnifier Glass Toggle & Zoom selector */}
          <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded border border-[#262626]">
            <button
              type="button"
              id="btn-toggle-magnifier"
              onClick={() => setIsMagnifierEnabled(!isMagnifierEnabled)}
              className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                isMagnifierEnabled
                  ? 'bg-[#FF5D22] text-white shadow-[0_2px_8px_rgba(255,93,34,0.3)]'
                  : 'text-[#888888] hover:text-white'
              }`}
              title={isMagnifierEnabled ? 'Đang bật Kính lúp phóng đại' : 'Bật Kính lúp phóng đại khi rê chuột'}
            >
              <Search className="w-3 h-3" />
              <span>Kính lúp</span>
            </button>

            {isMagnifierEnabled && (
              <div className="flex items-center pl-1 pr-1 gap-1 border-l border-[#262626]">
                {[2, 3, 4].map((zoom) => (
                  <button
                    key={zoom}
                    type="button"
                    onClick={() => setMagnifierZoom(zoom)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                      magnifierZoom === zoom
                        ? 'bg-[#222222] text-[#FF5D22] font-bold'
                        : 'text-[#666666] hover:text-[#AAAAAA]'
                    }`}
                    title={`Phóng đại ${zoom}x`}
                  >
                    {zoom}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Auto Tune Button */}
          {onAutoTune && (
            <button
              type="button"
              id="btn-roi-ai-autotune"
              disabled={isAnalyzing}
              onClick={onAutoTune}
              className="px-2.5 py-1 rounded text-xs font-semibold bg-[#FF5D22] hover:bg-[#FF3D00] text-white flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(255,93,34,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Phân tích vùng chọn và tự động tối ưu hóa thông số (Độ mượt viền & Bán kính hòa trộn)"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Đang đo...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3" />
                  <span>AI Tối Ưu</span>
                </>
              )}
            </button>
          )}

          {/* Action button: Reset ROI */}
          <button
            type="button"
            id="btn-reset-roi"
            onClick={handleResetROI}
            className="px-2.5 py-1 rounded text-xs font-medium bg-[#FF0000]/15 hover:bg-[#FF0000]/25 text-[#FF4444] border border-[#FF0000]/30 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Khôi phục vùng chọn mặc định góc dưới phải (Phím tắt: R)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ROI</span>
            <kbd className="px-1 py-0.5 rounded bg-black/50 border border-[#FF0000]/40 text-[10px] font-mono text-[#FFAAAA]">R</kbd>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseLeave={handleContainerMouseLeave}
        style={{ height: displayDims.height }}
        className="relative w-full rounded-xl bg-black overflow-hidden border border-[#1A1A1A] shadow-2xl select-none cursor-crosshair group"
      >
        {/* Media Preview (Video or Image) */}
        {mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
            muted
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <img
            ref={imageRef}
            src={mediaUrl}
            alt="Original Preview"
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Darkened overlay outside the ROI */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Interactive Red Rectangle ROI Box */}
        <div
          id="roi-rectangle-box"
          style={{
            left: `${displayROI.x}px`,
            top: `${displayROI.y}px`,
            width: `${displayROI.width}px`,
            height: `${displayROI.height}px`,
          }}
          className="absolute border-2 border-[#FF0000] bg-[#FF0000]/15 shadow-[0_0_15px_rgba(255,0,0,0.45)] cursor-move transition-[box-shadow]"
        >
          {/* Clear highlight cutout */}
          <div className="absolute inset-0 bg-transparent" />

          {/* Grid lines inside box */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-30 pointer-events-none">
            <div className="border-r border-b border-[#FF4444]" />
            <div className="border-b border-[#FF4444]" />
            <div className="border-r border-[#FF4444]" />
            <div />
          </div>

          {/* Center Crosshair icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
            <Crosshair className="w-4 h-4 text-[#FF4444]" />
          </div>

          {/* ROI Info Tooltip Tag */}
          <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded bg-black border border-[#FF0000] text-[#FF4444] text-[10px] font-mono font-bold tracking-tight whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000]" />
            TARGET_WATERMARK [{roi.width}×{roi.height}]
          </div>

          {/* 8 Resize Handles on Corners & Edges */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-nwse-resize shadow" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-nesw-resize shadow" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-nwse-resize shadow" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-nesw-resize shadow" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-ns-resize shadow" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-ns-resize shadow" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-ew-resize shadow" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2.5 h-2.5 bg-[#FF0000] rounded-none cursor-ew-resize shadow" />
        </div>

        {/* Real-time Magnifying Glass Loupe Lens (when hovered) */}
        {isMagnifierEnabled && hoverPos && (
          <div
            id="magnifying-glass-loupe"
            style={{
              left: `${loupePos.left}px`,
              top: `${loupePos.top}px`,
            }}
            className="absolute z-30 pointer-events-none w-[160px] h-[160px] rounded-2xl bg-[#0A0A0A] border-2 border-[#FF5D22] shadow-[0_0_25px_rgba(255,93,34,0.5),0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center justify-center transition-transform duration-75 ease-out"
          >
            {/* Magnifier Canvas rendering zoomed viewport */}
            <canvas
              ref={magnifierCanvasRef}
              width={160}
              height={160}
              className="w-full h-full object-cover"
            />

            {/* Top HUD Badge: Zoom Level & Mode */}
            <div className="absolute top-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-[#222222] text-[9px] font-mono text-[#00E676] font-semibold flex items-center justify-between shadow">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-2.5 h-2.5 text-[#FF5D22]" />
                LOUPE {magnifierZoom}X
              </span>
              <span className="text-[#888888]">1:1 PIXELS</span>
            </div>

            {/* Bottom HUD Badge: Native Cursor Pixel Coordinates */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-[#222222] text-[9px] font-mono text-[#E0E0E0] flex items-center justify-between shadow">
              <span>X: <strong className="text-[#FF5D22]">{hoverPos.nativeX}</strong></span>
              <span>Y: <strong className="text-[#FF5D22]">{hoverPos.nativeY}</strong></span>
            </div>
          </div>
        )}

        {/* Live Instruction Banner at Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/90 backdrop-blur-md border border-[#1A1A1A] text-[11px] text-[#888888] pointer-events-none flex items-center gap-2 shadow-lg whitespace-nowrap">
          <Move className="w-3 h-3 text-[#FF5D22]" />
          <span>Kéo chuột căn viền</span>
          <span className="text-[#444444]">•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#141414] border border-[#262626] text-[9px] font-mono text-[#AAAAAA]">Space</kbd> Play/Pause</span>
          <span className="text-[#444444]">•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#141414] border border-[#262626] text-[9px] font-mono text-[#AAAAAA]">R</kbd> Reset</span>
          <span className="text-[#444444]">•</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[#141414] border border-[#262626] text-[9px] font-mono text-[#AAAAAA]">Enter</kbd> Xử lý</span>
        </div>
      </div>

      {/* Video Playback & Frame Scrubber (Only for Video) */}
      {mediaType === 'video' && (
        <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] flex items-center gap-3">
          <button
            type="button"
            id="btn-toggle-video-play"
            onClick={togglePlay}
            className="p-1.5 rounded bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#333333] transition-all flex items-center gap-1.5 cursor-pointer"
            title={isPlaying ? 'Tạm dừng video (Phím Space)' : 'Phát video (Phím Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-black/50 border border-[#333333] text-[9px] font-mono text-[#888888]">Space</kbd>
          </button>

          <span className="text-xs font-mono text-[#888888] min-w-[45px]">
            {currentTime.toFixed(1)}s
          </span>

          <input
            type="range"
            min="0"
            max={videoDuration || 10}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-[#FF5D22] h-1.5 bg-[#222222] rounded-lg cursor-pointer"
          />

          <span className="text-xs font-mono text-[#888888] min-w-[45px]">
            {(videoDuration || 0).toFixed(1)}s
          </span>
        </div>
      )}

      {/* Numeric Coordinate Fine-tuning Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
          <span className="text-[#888888] font-mono">Tọa độ X:</span>
          <input
            type="number"
            value={roi.x}
            min={0}
            max={nativeWidth}
            onChange={(e) => onROIChange({ ...roi, x: parseInt(e.target.value) || 0 })}
            className="w-16 bg-[#141414] text-right px-1.5 py-0.5 rounded border border-[#262626] text-[#E0E0E0] font-mono focus:outline-none focus:border-[#FF5D22]"
          />
        </div>
        <div className="p-2 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
          <span className="text-[#888888] font-mono">Tọa độ Y:</span>
          <input
            type="number"
            value={roi.y}
            min={0}
            max={nativeHeight}
            onChange={(e) => onROIChange({ ...roi, y: parseInt(e.target.value) || 0 })}
            className="w-16 bg-[#141414] text-right px-1.5 py-0.5 rounded border border-[#262626] text-[#E0E0E0] font-mono focus:outline-none focus:border-[#FF5D22]"
          />
        </div>
        <div className="p-2 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
          <span className="text-[#888888] font-mono">Chiều rộng (W):</span>
          <input
            type="number"
            value={roi.width}
            min={4}
            max={nativeWidth}
            onChange={(e) => onROIChange({ ...roi, width: parseInt(e.target.value) || 4 })}
            className="w-16 bg-[#141414] text-right px-1.5 py-0.5 rounded border border-[#262626] text-[#E0E0E0] font-mono focus:outline-none focus:border-[#FF5D22]"
          />
        </div>
        <div className="p-2 rounded bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-between">
          <span className="text-[#888888] font-mono">Chiều cao (H):</span>
          <input
            type="number"
            value={roi.height}
            min={4}
            max={nativeHeight}
            onChange={(e) => onROIChange({ ...roi, height: parseInt(e.target.value) || 4 })}
            className="w-16 bg-[#141414] text-right px-1.5 py-0.5 rounded border border-[#262626] text-[#E0E0E0] font-mono focus:outline-none focus:border-[#FF5D22]"
          />
        </div>
      </div>
    </div>
  );
};
