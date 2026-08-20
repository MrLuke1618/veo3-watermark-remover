import React from 'react';
import { RotateCcw, AlertTriangle, Trash2, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemCount: number;
  isProcessing: boolean;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  isProcessing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0D0D0D] border border-[#262626] rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF5D22]/15 border border-[#FF5D22]/30 text-[#FF5D22]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Bắt đầu lại / Start Over
              </h3>
              <p className="text-xs text-[#888888]">
                Xóa toàn bộ bộ nhớ tạm (cache) và làm mới ứng dụng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666666] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning / Summary Info */}
        <div className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] text-xs space-y-2 text-[#AAAAAA]">
          {isProcessing ? (
            <div className="flex items-start gap-2.5 text-[#FF7D00]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Cảnh báo:</strong> Đang có tiến trình xử lý video/ảnh đang chạy. Nếu bắt đầu lại, tiến trình sẽ được hủy và giải phóng ngay lập tức.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 text-[#CCCCCC]">
              <Trash2 className="w-4 h-4 text-[#FF5D22] shrink-0 mt-0.5" />
              <span>
                Toàn bộ <strong>{itemCount} tệp</strong> trong hàng đợi, URL tạm thời (Blob Memory), và kết quả đã xử lý sẽ được dọn sạch hoàn toàn khỏi RAM trình duyệt.
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-[#1F1F1F] flex items-center gap-2 text-[#777777] text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
            <span>Màn hình sẽ chuyển ngay về khung tải tệp ban đầu (DropZone).</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-xs font-semibold text-[#CCCCCC] hover:text-white transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            id="btn-confirm-start-over"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-bold flex items-center gap-2 shadow-[0_2px_12px_rgba(255,93,34,0.35)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xác nhận bắt đầu lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};
