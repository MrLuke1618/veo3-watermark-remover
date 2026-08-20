/**
 * VEO3 Local Watermark Remover Pro
 * 100% Client-Side AI Media Cleaner (Flow AI / Flow Omni, Veo 3, Gemini)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, ROI, AlgorithmSettings, UndoHistoryEntry } from './types';
import { createDefaultROI } from './utils/presets';
import { ImageInpaintingEngine } from './services/imageInpainting';
import { FFmpegEngine } from './services/ffmpegEngine';
import { AIParameterTuner, AIAnalysisResult } from './services/aiParameterTuner';
import { Navbar } from './components/Navbar';
import { DropZone } from './components/DropZone';
import { ROISelectorCanvas } from './components/ROISelectorCanvas';
import { SplitScreenPreview } from './components/SplitScreenPreview';
import { AlgorithmSettingsPanel } from './components/AlgorithmSettingsPanel';
import { QueueManager } from './components/QueueManager';
import { TechGuideModal } from './components/TechGuideModal';
import { ExportSourceModal } from './components/ExportSourceModal';
import { LogTerminalModal } from './components/LogTerminalModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Youtube, Github } from 'lucide-react';
import JSZip from 'jszip';

export default function App() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoHistoryEntry[]>([]);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AIAnalysisResult | null>(null);
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(true);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // Global Engine Logs
  const [engineLogs, setEngineLogs] = useState<string[]>([
    '[System Ready] VEO3 Local Watermark Remover Pro v3.2 đã sẵn sàng.',
    '[Privacy Guard] Tất cả tác vụ giải mã, inpainting và mã hóa video đều thực hiện 100% trên CPU/GPU máy khách.',
    '[AI Smart Engine] Bộ phân tích AI hỗ trợ tự động điều chỉnh độ mượt viền và tái tạo họa tiết vùng chọn đã kích hoạt.',
  ]);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const activeItem = items.find((i) => i.id === activeItemId) || items[0] || null;
  const isProcessingAny = items.some((i) => i.status === 'processing' || i.status === 'preparing');

  const addLog = (log: string) => {
    setEngineLogs((prev) => [...prev, log]);
  };

  // Start Over / Reset to Beginning with complete memory & cache purge
  const handleStartOver = () => {
    // Revoke all created object URLs to free up RAM
    items.forEach((item) => {
      if (item.originalUrl && item.originalUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.originalUrl);
        } catch (_) {}
      }
      if (item.processedUrl && item.processedUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(item.processedUrl);
        } catch (_) {}
      }
    });

    // Reset all application state to initial empty dropzone state
    setItems([]);
    setActiveItemId(null);
    setIsGeneratingSample(false);

    // Reset file input elements if any exist in DOM
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach((input) => {
      input.value = '';
    });

    addLog('[Start Over] Đã giải phóng RAM, xóa sạch cache và chuyển về trạng thái ban đầu.');
  };

  const autoTuneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI Smart Auto Parameter Tuning Method
  const runAIAutoTune = useCallback(
    async (targetItem?: MediaItem, targetROI?: ROI): Promise<AIAnalysisResult | null> => {
      const item = targetItem || activeItem;
      if (!item) return null;
      const roiToAnalyze = targetROI || item.roi;

      setIsAnalyzingAI(true);
      try {
        let sourceElement: HTMLImageElement | HTMLVideoElement;
        if (item.type === 'video') {
          sourceElement = document.createElement('video');
          sourceElement.src = item.originalUrl;
          sourceElement.crossOrigin = 'anonymous';
          sourceElement.preload = 'auto';
          await new Promise<void>((res) => {
            sourceElement.onloadeddata = () => res();
            sourceElement.onerror = () => res();
            setTimeout(res, 600);
          });
        } else {
          sourceElement = new Image();
          sourceElement.src = item.originalUrl;
          sourceElement.crossOrigin = 'anonymous';
          await new Promise<void>((res) => {
            sourceElement.onload = () => res();
            sourceElement.onerror = () => res();
            setTimeout(res, 600);
          });
        }

        const result = await AIParameterTuner.analyze(sourceElement, roiToAnalyze, item.settings);
        setLastAnalysis(result);

        // Apply recommended parameters to item
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, settings: result.recommendedSettings } : i))
        );

        addLog(`[AI Auto-Tune] Tối ưu cho "${item.name}": Viền ${result.recommendedSettings.edgeSmoothness}px, Bán kính ${result.recommendedSettings.blurRadius}px (${result.recommendedSettings.algorithm.toUpperCase()})`);
        return result;
      } catch (err) {
        console.error('Lỗi phân tích AI Auto-Tune:', err);
        return null;
      } finally {
        setIsAnalyzingAI(false);
      }
    },
    [activeItem]
  );

  // Add Files handler (Supports single or multi-file upload)
  const handleFilesSelected = async (files: File[]) => {
    const newItems: MediaItem[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith('video') || file.name.match(/\.(mp4|webm|mov|mkv)$/i) !== null;
      const objectUrl = URL.createObjectURL(file);

      // Probe native dimensions and duration
      let width = 1280;
      let height = 720;
      let duration: number | undefined = undefined;
      let sourceElement: HTMLVideoElement | HTMLImageElement;

      if (isVideo) {
        const video = document.createElement('video');
        video.src = objectUrl;
        video.preload = 'metadata';
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            width = video.videoWidth || 1280;
            height = video.videoHeight || 720;
            duration = video.duration;
            resolve();
          };
          video.onerror = () => resolve();
        });
        sourceElement = video;
      } else {
        const img = new Image();
        img.src = objectUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            width = img.naturalWidth || 1280;
            height = img.naturalHeight || 720;
            resolve();
          };
          img.onerror = () => resolve();
        });
        sourceElement = img;
      }

      const defaultROI = createDefaultROI(width, height);
      // Initial base settings
      let defaultSettings: AlgorithmSettings = {
        algorithm: 'content_aware',
        blurRadius: 7,
        edgeSmoothness: 7,
        alphaThreshold: 175,
        colorCorrection: true,
        quality: 'high',
        preserveAudio: true,
        temporalStability: true,
      };

      // Perform instant smart analysis on first frame/image
      try {
        const analysis = await AIParameterTuner.analyze(sourceElement, defaultROI, defaultSettings);
        defaultSettings = analysis.recommendedSettings;
        setLastAnalysis(analysis);
      } catch (_) {}

      const newItem: MediaItem = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        type: isVideo ? 'video' : 'image',
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/png'),
        originalUrl: objectUrl,
        processedUrl: null,
        processedBlob: null,
        width,
        height,
        duration,
        roi: defaultROI,
        status: 'idle',
        progress: 0,
        statusMessage: 'Chờ xử lý',
        logs: [],
        createdAt: Date.now(),
        settings: defaultSettings,
      };

      newItems.push(newItem);
      addLog(`[File Added] Đã nạp "${file.name}" (${width}x${height}px) - AI Tối ưu: Viền ${defaultSettings.edgeSmoothness}px, Bán kính ${defaultSettings.blurRadius}px, Thuật toán: ${defaultSettings.algorithm.toUpperCase()}`);
    }

    setItems((prev) => [...prev, ...newItems]);
    if (!activeItemId && newItems.length > 0) {
      setActiveItemId(newItems[0].id);
    }
  };

  // ROI change for active item with debounced AI auto-tuning
  const handleROIChange = (newROI: ROI) => {
    if (!activeItem) return;
    setItems((prev) =>
      prev.map((item) => (item.id === activeItem.id ? { ...item, roi: newROI } : item))
    );

    // If autoTune is enabled, debounce auto-parameter adjustment
    if (autoTuneEnabled) {
      if (autoTuneTimeoutRef.current) {
        clearTimeout(autoTuneTimeoutRef.current);
      }
      autoTuneTimeoutRef.current = setTimeout(() => {
        runAIAutoTune(activeItem, newROI);
      }, 350);
    }
  };

  // Settings change for active item
  const handleSettingsChange = (newSettings: AlgorithmSettings) => {
    if (!activeItem) return;
    setItems((prev) =>
      prev.map((item) => (item.id === activeItem.id ? { ...item, settings: newSettings } : item))
    );
  };

  // Process a single item
  const processSingleItem = async (targetItem: MediaItem) => {
    const id = targetItem.id;
    addLog(`[Process Start] Đang xóa watermark cho "${targetItem.name}" (Thuật toán: ${targetItem.settings.algorithm})...`);

    // Record undo state before processing item (clone complete snapshot)
    const undoEntry: UndoHistoryEntry = {
      id: `undo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      itemId: targetItem.id,
      itemName: targetItem.name,
      timestamp: Date.now(),
      previousItemState: {
        ...targetItem,
        settings: { ...targetItem.settings },
        roi: { ...targetItem.roi },
        logs: [...targetItem.logs],
      },
      reason: 'revert_removal',
    };

    setUndoStack((prev) => [...prev.slice(-19), undoEntry]); // Keep max 20 undo entries

    // Update status to preparing
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'processing',
              progress: 5,
              statusMessage: 'Đang khởi tạo thuật toán...',
            }
          : item
      )
    );

    try {
      let outputBlob: Blob;

      if (targetItem.type === 'image') {
        const img = new Image();
        img.src = targetItem.originalUrl;
        await new Promise<void>((r) => (img.onload = () => r()));

        outputBlob = await ImageInpaintingEngine.processImage(
          img,
          targetItem.roi,
          targetItem.settings,
          (progress, status) => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, progress, statusMessage: status } : item
              )
            );
          }
        );
      } else {
        // Video processing
        outputBlob = await FFmpegEngine.processVideo(
          targetItem.file,
          targetItem.originalUrl,
          targetItem.roi,
          targetItem.settings,
          (progress, status) => {
            setItems((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, progress, statusMessage: status } : item
              )
            );
          },
          (logMsg) => {
            addLog(logMsg);
            setItems((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, logs: [...item.logs, logMsg] } : item
              )
            );
          }
        );
      }

      const processedUrl = URL.createObjectURL(outputBlob);

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'completed',
                progress: 100,
                statusMessage: 'Đã hoàn tất!',
                processedUrl,
                processedBlob: outputBlob,
                completedAt: Date.now(),
              }
            : item
        )
      );

      addLog(`[Process Complete] Đã xử lý xong "${targetItem.name}" sạch 100%!`);
    } catch (err) {
      const errMsg = (err as Error).message || 'Lỗi không xác định khi xử lý';
      addLog(`[Error] Lỗi khi xử lý "${targetItem.name}": ${errMsg}`);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'error',
                statusMessage: `Lỗi: ${errMsg}`,
              }
            : item
        )
      );
    }
  };

  // Trigger process for active item
  const handleStartProcess = () => {
    if (!activeItem || activeItem.status === 'processing') return;
    processSingleItem(activeItem);
  };

  // Trigger process for all idle items
  const handleProcessAll = async () => {
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (pending.length === 0) return;

    addLog(`[Batch Start] Bắt đầu xử lý hàng loạt ${pending.length} tệp...`);
    for (const item of pending) {
      setActiveItemId(item.id);
      await processSingleItem(item);
    }
    addLog('[Batch Complete] Đã hoàn thành tất cả tệp trong hàng đợi!');
  };

  // Download a single cleaned file
  const handleDownloadItem = (item: MediaItem) => {
    if (!item.processedUrl) return;
    const a = document.createElement('a');
    a.href = item.processedUrl;
    const ext = item.type === 'video' ? 'mp4' : 'png';
    const baseName = item.name.replace(/\.[^/.]+$/, '');
    a.download = `Cleaned_${baseName}.${ext}`;
    a.click();
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const completed = items.filter((i) => i.status === 'completed' && i.processedBlob);
    if (completed.length === 0) return;

    addLog(`[ZIP Export] Đang nén ${completed.length} tệp đã làm sạch vào file ZIP...`);
    const zip = new JSZip();

    for (let idx = 0; idx < completed.length; idx++) {
      const item = completed[idx];
      const ext = item.type === 'video' ? 'mp4' : 'png';
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      zip.file(`Cleaned_${baseName}_${idx + 1}.${ext}`, item.processedBlob!);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VEO3_Cleaned_Media_Batch_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('[ZIP Export] Đã xuất file ZIP thành công!');
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) {
      if (target.originalUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(target.originalUrl); } catch (_) {}
      }
      if (target.processedUrl && target.processedUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(target.processedUrl); } catch (_) {}
      }
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeItemId === id) {
      const remaining = items.filter((i) => i.id !== id);
      setActiveItemId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Clear all items in queue
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(item.originalUrl); } catch (_) {}
      }
      if (item.processedUrl && item.processedUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(item.processedUrl); } catch (_) {}
      }
    });
    setItems([]);
    setActiveItemId(null);
    setUndoStack([]);
    addLog('[Queue Cleared] Đã xóa toàn bộ danh sách hàng đợi.');
  };

  // Undo removal process for the last processed item or specific undo entry
  const handleUndoLast = () => {
    if (undoStack.length === 0) return;
    const lastEntry = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    setItems((prev) => {
      const exists = prev.some((i) => i.id === lastEntry.itemId);
      if (!exists) {
        // Item might have been removed, restore it
        return [...prev, lastEntry.previousItemState];
      }
      return prev.map((item) => {
        if (item.id === lastEntry.itemId) {
          // Clean up old processedUrl if it changed
          if (item.processedUrl && item.processedUrl !== lastEntry.previousItemState.processedUrl && item.processedUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(item.processedUrl); } catch (_) {}
          }
          return {
            ...lastEntry.previousItemState,
            status: 'idle',
            progress: 0,
            statusMessage: 'Đã hoàn tác về trạng thái gốc',
            processedUrl: null,
            processedBlob: null,
            completedAt: undefined,
          };
        }
        return item;
      });
    });

    setActiveItemId(lastEntry.itemId);
    addLog(`[Undo] Đã hoàn tác kết quả xử lý của "${lastEntry.itemName}", khôi phục về trạng thái chờ.`);
  };

  const handleUndoSpecific = (undoEntryId: string) => {
    const entryIndex = undoStack.findIndex((e) => e.id === undoEntryId);
    if (entryIndex === -1) return;
    const entry = undoStack[entryIndex];
    setUndoStack((prev) => prev.filter((e) => e.id !== undoEntryId));

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === entry.itemId) {
          if (item.processedUrl && item.processedUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(item.processedUrl); } catch (_) {}
          }
          return {
            ...entry.previousItemState,
            status: 'idle',
            progress: 0,
            statusMessage: 'Đã hoàn tác về trạng thái gốc',
            processedUrl: null,
            processedBlob: null,
            completedAt: undefined,
          };
        }
        return item;
      })
    );

    setActiveItemId(entry.itemId);
    addLog(`[Undo] Đã khôi phục tệp "${entry.itemName}" từ lịch sử hoàn tác.`);
  };

  // Revert a single completed item back to idle state for fine-tuning
  const handleRevertItem = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.processedUrl && item.processedUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(item.processedUrl); } catch (_) {}
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              status: 'idle',
              progress: 0,
              statusMessage: 'Chờ xử lý lại...',
              processedUrl: null,
              processedBlob: null,
              completedAt: undefined,
            }
          : i
      )
    );

    setActiveItemId(itemId);
    addLog(`[Revert] Đã hoàn tác tệp "${item.name}" về chế độ căn chỉnh ROI.`);
  };

  // Keyboard Shortcuts hook:
  // - Space: Toggle video preview play/pause
  // - R / r: Reset ROI for active media
  // - Enter: Start watermark removal process
  useKeyboardShortcuts({
    onTogglePlay: () => {
      window.dispatchEvent(new CustomEvent('veo3:toggle-play'));
    },
    onResetROI: () => {
      if (activeItem && activeItem.status !== 'completed') {
        const defaultROI = createDefaultROI(activeItem.width, activeItem.height);
        handleROIChange(defaultROI);
        addLog(`[Shortcut] Đã khôi phục vùng chọn ROI mặc định cho "${activeItem.name}" (phím tắt R).`);
      }
    },
    onStartProcess: () => {
      if (activeItem && activeItem.status !== 'processing' && activeItem.status !== 'preparing') {
        handleStartProcess();
      }
    },
    disabled: isGuideOpen || isExportOpen || isLogsOpen,
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col selection:bg-[#FF5D22] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        queueCount={items.length}
        hasItems={items.length > 0}
        onStartOver={() => setIsResetConfirmOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
        isProcessing={isProcessingAny}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* If no media loaded, show rich Dropzone */}
        {items.length === 0 ? (
          <div className="max-w-3xl mx-auto py-6">
            <DropZone
              onFilesSelected={handleFilesSelected}
              isGeneratingSample={isGeneratingSample}
              setIsGeneratingSample={setIsGeneratingSample}
            />
          </div>
        ) : (
          /* Active Media Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Main Column: Stage (ROI Selector OR Split-Screen Result) & Queue Manager */}
            <div className="lg:col-span-8 flex flex-col space-y-5">
              {activeItem && (
                <>
                  {activeItem.status === 'completed' && activeItem.processedUrl ? (
                    <SplitScreenPreview
                      item={activeItem}
                      onDownload={handleDownloadItem}
                      onStartOver={() => setIsResetConfirmOpen(true)}
                    />
                  ) : (
                    <ROISelectorCanvas
                      mediaType={activeItem.type}
                      mediaUrl={activeItem.originalUrl}
                      nativeWidth={activeItem.width}
                      nativeHeight={activeItem.height}
                      roi={activeItem.roi}
                      onROIChange={handleROIChange}
                      videoDuration={activeItem.duration}
                      onAutoTune={() => runAIAutoTune()}
                      isAnalyzing={isAnalyzingAI}
                    />
                  )}
                </>
              )}

              {/* Comprehensive Queue Manager */}
              <QueueManager
                items={items}
                activeId={activeItemId}
                undoStack={undoStack}
                onSelectItem={(id) => setActiveItemId(id)}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearAll}
                onProcessItem={processSingleItem}
                onProcessAll={handleProcessAll}
                onDownloadItem={handleDownloadItem}
                onDownloadAllZip={handleDownloadAllZip}
                onFilesSelected={handleFilesSelected}
                onUndoLast={handleUndoLast}
                onUndoSpecific={handleUndoSpecific}
                onRevertItem={handleRevertItem}
                isProcessingAny={isProcessingAny}
              />
            </div>

            {/* Right Column: Algorithm Controls & Process Button */}
            <div className="lg:col-span-4 flex flex-col space-y-4 sticky top-20">
              {activeItem && (
                <AlgorithmSettingsPanel
                  settings={activeItem.settings}
                  onSettingsChange={handleSettingsChange}
                  status={activeItem.status}
                  progress={activeItem.progress}
                  statusMessage={activeItem.statusMessage}
                  onStartProcess={handleStartProcess}
                  mediaType={activeItem.type}
                  onAutoTune={() => runAIAutoTune()}
                  lastAnalysis={lastAnalysis}
                  autoTuneEnabled={autoTuneEnabled}
                  onToggleAutoTune={setAutoTuneEnabled}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer with Watermark & Social Media Links */}
      <footer className="w-full border-t border-[#1A1A1A] bg-[#0A0A0A] py-6 text-xs text-[#888888]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Watermark for the app */}
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="text-[#CCCCCC] font-medium">
              @{2026 >= currentYear ? '2026' : `2026-${currentYear}`}. Developed by MrLuke1618.
            </span>
            <span className="hidden sm:inline text-[#444444]">•</span>
            <span className="hidden sm:inline text-[#777777]">
              VEO3 Local Watermark Remover Pro
            </span>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-5 text-xs">
            <a
              href="https://www.youtube.com/@luke1618gamer/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#AAAAAA] hover:text-[#FF0000] transition-colors group cursor-pointer"
              title="YouTube: @luke1618gamer"
            >
              <Youtube className="w-4 h-4 text-[#888888] group-hover:text-[#FF0000] transition-colors" />
              <span>YouTube</span>
            </a>

            <a
              href="https://www.tiktok.com/@hoangcao2704"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#AAAAAA] hover:text-[#25F4EE] transition-colors group cursor-pointer"
              title="TikTok: @hoangcao2704"
            >
              <svg
                className="w-3.5 h-3.5 fill-[#888888] group-hover:fill-[#25F4EE] transition-colors"
                viewBox="0 0 24 24"
              >
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.27 1.76-.23.99-.04 2.09.6 2.89.65.84 1.74 1.27 2.8 1.15 1.09-.09 2.08-.82 2.51-1.83.27-.61.35-1.28.35-1.95V.02z" />
              </svg>
              <span>TikTok</span>
            </a>

            <a
              href="https://github.com/MrLuke1618/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#AAAAAA] hover:text-white transition-colors group cursor-pointer"
              title="GitHub: MrLuke1618"
            >
              <Github className="w-4 h-4 text-[#888888] group-hover:text-white transition-colors" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TechGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <ExportSourceModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        items={items}
        onStartProcessAll={handleProcessAll}
        isProcessing={isProcessingAny}
        onAddLog={addLog}
      />
      <LogTerminalModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={engineLogs}
        onClearLogs={() => setEngineLogs([])}
        isProcessing={isProcessingAny}
      />
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleStartOver}
        itemCount={items.length}
        isProcessing={isProcessingAny}
      />
    </div>
  );
}
