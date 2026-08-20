import React from 'react';
import { MediaItem } from '../types';
import { Download, Trash2, CheckCircle2, RefreshCw, AlertCircle, FileVideo, FileImage, Plus, Package } from 'lucide-react';
import JSZip from 'jszip';

interface BatchQueueProps {
  items: MediaItem[];
  activeId: string | null;
  onSelectItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onProcessAll: () => void;
  onDownloadItem: (item: MediaItem) => void;
  onDownloadAllZip: () => void;
  onAddMoreClick: () => void;
  isProcessingAny: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  activeId,
  onSelectItem,
  onRemoveItem,
  onProcessAll,
  onDownloadItem,
  onDownloadAllZip,
  onAddMoreClick,
  isProcessingAny,
}) => {
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const pendingCount = items.filter((i) => i.status === 'idle').length;

  return (
    <div className="w-full rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] p-4 shadow-xl flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Hàng đợi xử lý ({items.length})
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20">
            {completedCount}/{items.length} Đã xong
          </span>
        </div>

        {/* Global Batch Actions */}
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              type="button"
              id="btn-process-all"
              disabled={isProcessingAny}
              onClick={onProcessAll}
              className="px-2.5 py-1 rounded bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-semibold shadow-[0_2px_10px_rgba(255,93,34,0.3)] flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isProcessingAny ? 'animate-spin' : ''}`} />
              <span>Xử lý tất cả ({pendingCount})</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              type="button"
              id="btn-download-all-zip"
              onClick={onDownloadAllZip}
              className="px-2.5 py-1 rounded bg-[#00E676]/20 hover:bg-[#00E676]/30 text-[#00E676] border border-[#00E676]/30 text-xs font-semibold shadow flex items-center gap-1.5 transition-all"
              title="Tải toàn bộ tệp đã làm sạch dưới dạng file ZIP"
            >
              <Package className="w-3 h-3" />
              <span>Tải ZIP tất cả ({completedCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddMoreClick}
            className="p-1 rounded bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] text-[#E0E0E0] transition-all"
            title="Thêm file khác"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                isActive
                  ? 'border-[#FF5D22] bg-[#FF5D22]/10 shadow-md ring-1 ring-[#FF5D22]/50'
                  : 'border-[#1A1A1A] hover:border-[#262626] bg-[#0D0D0D] hover:bg-[#111111]'
              }`}
            >
              {/* Media Thumbnail & Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-10 h-10 rounded bg-[#141414] border border-[#262626] overflow-hidden shrink-0 flex items-center justify-center">
                  {item.type === 'video' ? (
                    <FileVideo className="w-5 h-5 text-[#FF5D22]" />
                  ) : (
                    <FileImage className="w-5 h-5 text-[#FF7D00]" />
                  )}
                  {item.status === 'completed' && (
                    <div className="absolute inset-0 bg-[#00E676]/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate max-w-[130px]" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#888888] font-mono">
                    <span>{(item.size / 1024 / 1024).toFixed(1)}MB</span>
                    <span>•</span>
                    <span>{item.width}x{item.height}</span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {item.status === 'processing' && (
                  <span className="text-[11px] font-mono text-[#FF5D22] font-semibold animate-pulse">
                    {item.progress}%
                  </span>
                )}
                {item.status === 'completed' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadItem(item);
                    }}
                    className="p-1 rounded bg-[#00E676]/15 hover:bg-[#00E676]/25 text-[#00E676] border border-[#00E676]/30"
                    title="Tải tệp này"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="p-1 rounded bg-[#1A1A1A] hover:bg-[#FF0000]/20 text-[#888888] hover:text-[#FF4444] border border-[#262626] transition-all"
                  title="Xóa khỏi hàng đợi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
