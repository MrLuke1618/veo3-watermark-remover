import React, { useState } from 'react';
import { MediaItem, ProcessStatus, UndoHistoryEntry } from '../types';
import {
  Upload,
  Plus,
  RefreshCw,
  Package,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileImage,
  Download,
  Layers,
  Undo2,
  History,
  RotateCcw,
  Sparkles,
  Clock,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';

interface QueueManagerProps {
  items: MediaItem[];
  activeId: string | null;
  undoStack: UndoHistoryEntry[];
  onSelectItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onProcessItem: (item: MediaItem) => void;
  onProcessAll: () => void;
  onDownloadItem: (item: MediaItem) => void;
  onDownloadAllZip: () => void;
  onFilesSelected: (files: File[]) => void;
  onUndoLast: () => void;
  onUndoSpecific?: (undoEntryId: string) => void;
  onRevertItem?: (itemId: string) => void;
  isProcessingAny: boolean;
}

type FilterType = 'all' | 'pending' | 'completed';

export const QueueManager: React.FC<QueueManagerProps> = ({
  items,
  activeId,
  undoStack = [],
  onSelectItem,
  onRemoveItem,
  onClearAll,
  onProcessItem,
  onProcessAll,
  onDownloadItem,
  onDownloadAllZip,
  onFilesSelected,
  onUndoLast,
  onUndoSpecific,
  onRevertItem,
  isProcessingAny,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUndoHistoryDropdown, setShowUndoHistoryDropdown] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const pendingCount = items.filter((i) => i.status === 'idle').length;
  const processingCount = items.filter((i) => i.status === 'processing' || i.status === 'preparing').length;

  // Filter items based on active tab
  const filteredItems = items.filter((item) => {
    if (filter === 'pending') return item.status === 'idle' || item.status === 'preparing' || item.status === 'processing';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      const validFiles = fileList.filter(
        (f) => f.type.startsWith('video/') || f.type.startsWith('image/') || f.name.match(/\.(mp4|webm|mov|mkv|jpg|jpeg|png|webp)$/i)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const getAlgorithmLabel = (algo: string) => {
    switch (algo) {
      case 'alpha_reversal':
        return 'Alpha (Flow AI)';
      case 'delogo':
        return 'Delogo FFmpeg';
      case 'content_aware':
        return 'Content-Aware';
      case 'smart_blur':
        return 'Smart Blur';
      default:
        return algo;
    }
  };

  const lastUndoEntry = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full rounded-2xl bg-[#0A0A0A] border transition-all shadow-2xl flex flex-col p-4 sm:p-5 space-y-4 ${
        isDragOver ? 'border-[#FF5D22] ring-2 ring-[#FF5D22]/40 bg-[#120B08]' : 'border-[#1A1A1A]'
      }`}
    >
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        id="queue-multi-file-input"
      />

      {/* Top Header & Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF5D22]/15 border border-[#FF5D22]/30 text-[#FF5D22]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white tracking-wide">
                Queue Manager • Hàng đợi xử lý
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#141414] text-[#E0E0E0] border border-[#262626]">
                {items.length} tệp
              </span>
            </div>
            <p className="text-xs text-[#888888]">
              {items.length === 0
                ? 'Kéo thả hoặc thêm nhiều video/ảnh để xử lý hàng loạt'
                : `${completedCount} hoàn thành • ${pendingCount} chờ xử lý • ${processingCount} đang chạy`}
            </p>
          </div>
        </div>

        {/* Global Batch & Undo Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* UNDO STACK BUTTON */}
          {undoStack.length > 0 && (
            <div className="relative">
              <div className="flex items-center rounded-lg bg-[#2A1810] border border-[#FF5D22]/50 shadow-[0_2px_10px_rgba(255,93,34,0.2)] overflow-hidden">
                <button
                  type="button"
                  id="btn-queue-undo-last"
                  disabled={isProcessingAny}
                  onClick={onUndoLast}
                  className="px-2.5 py-1.5 hover:bg-[#FF5D22]/20 text-[#FF7D00] hover:text-[#FF5D22] text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                  title={`Hoàn tác thao tác xóa gần nhất cho "${lastUndoEntry?.itemName || 'tệp'}"`}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Hoàn tác ({undoStack.length})</span>
                </button>

                {undoStack.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowUndoHistoryDropdown(!showUndoHistoryDropdown)}
                    className="px-1.5 py-1.5 border-l border-[#FF5D22]/30 hover:bg-[#FF5D22]/20 text-[#FF7D00] transition-colors cursor-pointer"
                    title="Xem lịch sử hoàn tác"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Undo History Popup Dropdown */}
              {showUndoHistoryDropdown && undoStack.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#0E0E0E] border border-[#262626] rounded-xl shadow-2xl z-30 p-2 space-y-1 animate-fadeIn">
                  <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-[#AAAAAA] border-b border-[#1A1A1A]">
                    <span className="flex items-center gap-1">
                      <History className="w-3 h-3 text-[#FF5D22]" /> Lịch sử hoàn tác (Undo Stack)
                    </span>
                    <span className="font-mono text-[#FF5D22]">{undoStack.length} bước</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin py-1">
                    {[...undoStack].reverse().map((entry, idx) => (
                      <div
                        key={entry.id}
                        onClick={() => {
                          onUndoSpecific?.(entry.id);
                          setShowUndoHistoryDropdown(false);
                        }}
                        className="p-2 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#222222] hover:border-[#FF5D22]/40 text-xs cursor-pointer flex items-center justify-between gap-2 group transition-all"
                      >
                        <div className="min-w-0">
                          <span className="text-white font-medium truncate block">{entry.itemName}</span>
                          <span className="text-[10px] text-[#777777] font-mono">
                            {new Date(entry.timestamp).toLocaleTimeString()} • {entry.reason === 'revert_removal' ? 'Hủy xóa watermark' : 'Khôi phục tham số'}
                          </span>
                        </div>
                        <RotateCcw className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#FF5D22] shrink-0 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Multiple Files Button */}
          <button
            type="button"
            id="btn-queue-add-files"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-[#2A2A2A] hover:border-[#3A3A3A] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Tải lên thêm nhiều video/ảnh cùng lúc"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF5D22]" />
            <span>Thêm tệp</span>
          </button>

          {/* Process All Button */}
          {pendingCount > 0 && (
            <button
              type="button"
              id="btn-queue-process-all"
              disabled={isProcessingAny}
              onClick={onProcessAll}
              className="px-3 py-1.5 rounded-lg bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-semibold shadow-[0_2px_12px_rgba(255,93,34,0.35)] flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAny ? 'animate-spin' : ''}`} />
              <span>Xử lý tất cả ({pendingCount})</span>
            </button>
          )}

          {/* Download All as ZIP */}
          {completedCount > 0 && (
            <button
              type="button"
              id="btn-queue-download-zip"
              onClick={onDownloadAllZip}
              className="px-3 py-1.5 rounded-lg bg-[#00E676]/15 hover:bg-[#00E676]/25 text-[#00E676] border border-[#00E676]/30 text-xs font-semibold shadow flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải toàn bộ tệp đã xử lý dưới dạng file nén ZIP"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Tải ZIP ({completedCount})</span>
            </button>
          )}

          {/* Clear Queue Button */}
          {items.length > 0 && (
            <button
              type="button"
              id="btn-queue-clear-all"
              disabled={isProcessingAny}
              onClick={onClearAll}
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#FF0000]/20 text-[#888888] hover:text-[#FF4444] border border-[#222222] transition-all cursor-pointer disabled:opacity-40"
              title="Xóa toàn bộ hàng đợi và làm mới"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-lg border border-[#222222]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#222222] text-white font-semibold'
                  : 'text-[#888888] hover:text-[#CCCCCC]'
              }`}
            >
              Tất cả ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-[#222222] text-[#FF7D00] font-semibold'
                  : 'text-[#888888] hover:text-[#CCCCCC]'
              }`}
            >
              Chờ xử lý ({pendingCount + processingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-[#222222] text-[#00E676] font-semibold'
                  : 'text-[#888888] hover:text-[#CCCCCC]'
              }`}
            >
              Đã xong ({completedCount})
            </button>
          </div>

          <span className="text-[11px] text-[#666666] hidden sm:inline">
            Bấm vào tệp để căn chỉnh viền ROI hoặc xem kết quả
          </span>
        </div>
      )}

      {/* Media Items List or Empty State */}
      {items.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#222222] hover:border-[#FF5D22]/60 rounded-xl p-8 text-center cursor-pointer transition-all bg-[#080808] hover:bg-[#0D0D0D] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#262626] text-[#FF5D22] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-sm text-white mb-1">
            Chưa có tệp nào trong hàng đợi
          </h4>
          <p className="text-xs text-[#888888] max-w-sm mx-auto">
            Kéo thả nhiều video hoặc ảnh vào đây, hoặc bấm để chọn tệp từ máy tính.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredItems.map((item) => {
            const isActive = item.id === activeId;
            const isProcessing = item.status === 'processing' || item.status === 'preparing';
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className={`relative rounded-xl border p-3 flex flex-col justify-between gap-2.5 cursor-pointer transition-all ${
                  isActive
                    ? 'border-[#FF5D22] bg-[#FF5D22]/10 shadow-[0_4px_20px_rgba(255,93,34,0.2)] ring-1 ring-[#FF5D22]/50'
                    : 'border-[#1A1A1A] hover:border-[#2A2A2A] bg-[#0D0D0D] hover:bg-[#121212]'
                }`}
              >
                {/* Top Row: Thumbnail + Info */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Thumbnail / Icon Container */}
                  <div className="relative w-12 h-12 rounded-lg bg-[#141414] border border-[#262626] overflow-hidden shrink-0 flex items-center justify-center">
                    {item.type === 'video' ? (
                      <FileVideo className="w-6 h-6 text-[#FF5D22]" />
                    ) : (
                      <FileImage className="w-6 h-6 text-[#FF7D00]" />
                    )}

                    {/* Status Overlay Icon */}
                    {isCompleted && (
                      <div className="absolute inset-0 bg-[#00E676]/25 backdrop-blur-[1px] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[#00E676] drop-shadow" />
                      </div>
                    )}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-[#FF5D22] animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className="text-xs font-semibold text-white truncate max-w-[170px]"
                        title={item.name}
                      >
                        {item.name}
                      </h4>
                      {isActive && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#FF5D22] text-white font-bold shrink-0">
                          ĐANG CHỌN
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#888888] font-mono mt-0.5">
                      <span>{(item.size / 1024 / 1024).toFixed(1)}MB</span>
                      <span>•</span>
                      <span>{item.width}x{item.height}</span>
                      {item.duration && (
                        <>
                          <span>•</span>
                          <span>{item.duration.toFixed(1)}s</span>
                        </>
                      )}
                    </div>

                    {/* Mode Tag */}
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#161616] text-[#AAAAAA] border border-[#262626]">
                        {getAlgorithmLabel(item.settings.algorithm)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar if processing */}
                {isProcessing && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#FF7D00] truncate max-w-[180px]">{item.statusMessage || 'Đang xử lý...'}</span>
                      <span className="text-[#FF5D22] font-bold">{item.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden">
                      <div
                        style={{ width: `${item.progress}%` }}
                        className="h-full bg-gradient-to-r from-[#FF3D00] to-[#FF7D00] rounded-full transition-all duration-150"
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Row: Status Badge & Quick Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-[#181818] text-xs">
                  {/* Status Indicator */}
                  <div>
                    {item.status === 'idle' && (
                      <span className="text-[10px] font-mono text-[#888888] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#666666]" />
                        Chờ xử lý
                      </span>
                    )}
                    {isProcessing && (
                      <span className="text-[10px] font-mono text-[#FF5D22] font-semibold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Đang xóa...
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-mono text-[#00E676] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
                        Đã làm sạch
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-[10px] font-mono text-[#FF4444] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Lỗi
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Process Single button if idle or error */}
                    {(item.status === 'idle' || item.status === 'error') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProcessItem(item);
                        }}
                        disabled={isProcessingAny}
                        className="p-1.5 rounded-md bg-[#FF5D22]/15 hover:bg-[#FF5D22]/30 text-[#FF5D22] border border-[#FF5D22]/30 transition-all cursor-pointer disabled:opacity-40"
                        title="Xử lý riêng tệp này"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Revert / Undo Single button if completed */}
                    {isCompleted && onRevertItem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRevertItem(item.id);
                        }}
                        className="p-1.5 rounded-md bg-[#26150D] hover:bg-[#3D2014] text-[#FF7D00] hover:text-[#FF5D22] border border-[#FF5D22]/30 transition-all cursor-pointer"
                        title="Hoàn tác trạng thái làm sạch (chuyển về chờ xử lý để tinh chỉnh lại ROI/AI)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Download Single if completed */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadItem(item);
                        }}
                        className="p-1.5 rounded-md bg-[#00E676]/15 hover:bg-[#00E676]/30 text-[#00E676] border border-[#00E676]/30 transition-all cursor-pointer"
                        title="Tải tệp đã làm sạch"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="p-1.5 rounded-md bg-[#141414] hover:bg-[#FF0000]/20 text-[#777777] hover:text-[#FF4444] border border-[#222222] transition-all cursor-pointer"
                      title="Xóa khỏi hàng đợi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
