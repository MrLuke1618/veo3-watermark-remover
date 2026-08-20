import React, { useEffect, useRef } from 'react';
import { Terminal, X, Copy, Trash2, Check, AlertCircle } from 'lucide-react';

interface LogTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  onClearLogs: () => void;
  isProcessing: boolean;
}

export const LogTerminalModal: React.FC<LogTerminalModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  isProcessing,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1A1A1A] bg-[#0D0D0D] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#FF5D22]/10 border border-[#FF5D22]/30 text-[#FF5D22]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Nhật ký thời gian thực (Engine Execution Console)</span>
                {isProcessing && (
                  <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                )}
              </h3>
              <p className="text-[11px] text-[#888888] font-mono">
                FFmpeg.wasm & Inpainting Frame Stream Logger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-[#E0E0E0] text-xs flex items-center gap-1 transition-all"
              title="Sao chép toàn bộ log"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
            <button
              type="button"
              onClick={onClearLogs}
              className="p-1.5 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-[#888888] hover:text-[#E0E0E0] transition-all"
              title="Xóa log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-[#888888] hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log Console Body */}
        <div
          ref={logContainerRef}
          className="p-4 bg-[#050505] font-mono text-xs text-[#E0E0E0] overflow-y-auto flex-1 space-y-1.5 select-text scrollbar-thin scrollbar-thumb-[#222222]"
        >
          {logs.length === 0 ? (
            <div className="text-[#555555] italic py-8 text-center">
              Chưa có thông điệp log nào. Khi bắt đầu xử lý, thông số FFmpeg và Canvas sẽ xuất hiện ở đây.
            </div>
          ) : (
            logs.map((log, index) => {
              const isError = log.toLowerCase().includes('lỗi') || log.toLowerCase().includes('error');
              const isSuccess = log.toLowerCase().includes('hoàn tất') || log.toLowerCase().includes('thành công') || log.toLowerCase().includes('complete');
              const isFFmpeg = log.includes('[FFmpeg');

              return (
                <div
                  key={index}
                  className={`leading-relaxed break-all ${
                    isError
                      ? 'text-[#FF4444] font-semibold'
                      : isSuccess
                      ? 'text-[#00E676] font-semibold'
                      : isFFmpeg
                      ? 'text-[#FF7D00]'
                      : 'text-[#888888]'
                  }`}
                >
                  <span className="text-[#444444] mr-2 select-none">
                    {`[${String(index + 1).padStart(3, '0')}]`}
                  </span>
                  {log}
                </div>
              );
            })
          )}
        </div>

        {/* Console Footer Status */}
        <div className="p-3 border-t border-[#1A1A1A] bg-[#0D0D0D] text-xs text-[#888888] flex items-center justify-between">
          <span className="font-mono">Tổng số dòng log: {logs.length}</span>
          <span className="text-[#00E676] font-mono">Trạng thái: 100% Client-Side Active</span>
        </div>
      </div>
    </div>
  );
};
