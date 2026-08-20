import React, { useState } from 'react';
import { AlgorithmSettings, ProcessStatus, RemovalAlgorithm, ROI } from '../types';
import { Sparkles, Sliders, Volume2, ShieldCheck, Zap, AlertTriangle, Play, RefreshCw, Layers, Wand2, Info, CheckCircle2 } from 'lucide-react';
import { AIAnalysisResult } from '../services/aiParameterTuner';

interface AlgorithmSettingsPanelProps {
  settings: AlgorithmSettings;
  onSettingsChange: (settings: AlgorithmSettings) => void;
  status: ProcessStatus;
  progress: number;
  statusMessage: string;
  onStartProcess: () => void;
  onCancelProcess?: () => void;
  mediaType: 'video' | 'image';
  onAutoTune?: () => Promise<AIAnalysisResult | null>;
  lastAnalysis?: AIAnalysisResult | null;
  autoTuneEnabled?: boolean;
  onToggleAutoTune?: (enabled: boolean) => void;
}

export const AlgorithmSettingsPanel: React.FC<AlgorithmSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  status,
  progress,
  statusMessage,
  onStartProcess,
  onCancelProcess,
  mediaType,
  onAutoTune,
  lastAnalysis,
  autoTuneEnabled = true,
  onToggleAutoTune,
}) => {
  const isProcessing = status === 'processing' || status === 'preparing';
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAutoTune = async () => {
    if (!onAutoTune || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      await onAutoTune();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const algorithms: { id: RemovalAlgorithm; name: string; tag: string; desc: string; badge?: string }[] = [
    {
      id: 'content_aware',
      name: 'Content-Aware Patching (PatchMatch)',
      tag: 'Khuyên dùng (Nền tảng chính)',
      desc: 'Lấy mẫu các mảng vi hạt (patches) từ vùng lân cận để tái tạo họa tiết bề mặt tự nhiên thay vì làm nhòe. Bù đắp nhiễu hạt sensor và làm mượt viền không lộ vết.',
      badge: '★ Khuyên Dùng',
    },
    {
      id: 'alpha_reversal',
      name: 'Alpha Inversion Pro (Veo 3 / Flow AI)',
      tag: 'Khử logo mờ bán trong suốt',
      desc: 'Phục hồi kênh alpha và độ sáng gốc bên dưới watermark mờ, kết hợp Content-Aware Patching để lấp đầy vết còn sót lại.',
    },
    {
      id: 'delogo',
      name: 'Delogo Gradient Interpolation',
      tag: 'Nội suy biên PDE',
      desc: 'Khuếch tán gradient màu đa hướng từ 4 cạnh biên kết hợp tái tạo vân nền Content-Aware Patching mượt mà.',
    },
    {
      id: 'smart_blur',
      name: 'Feathered Texture Blur',
      tag: 'Làm mờ mềm viền',
      desc: 'Tạo lớp nền Content-Aware Patching sau đó làm mềm viền cục bộ có kiểm soát bán kính.',
    },
  ];

  return (
    <div className="w-full rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] p-5 shadow-xl flex flex-col space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#FF5D22]" />
          <h3 className="font-semibold text-sm text-white uppercase tracking-wider">
            Bảng điều khiển thuật toán
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111111] text-[#00E676] border border-[#222222] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#00E676]" />
          AI Core v3.2
        </span>
      </div>

      {/* AI Smart Auto-Tune Section */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#121212] via-[#0E0E0E] to-[#161616] border border-[#2A2A2A] shadow-inner space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF5D22]/20 border border-[#FF5D22]/40 text-[#FF5D22]">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>AI Hỗ Trợ Tự Động Tối Ưu Thông Số</span>
                <span className="px-1.5 py-0.2 rounded bg-[#FF5D22]/20 text-[#FF7D00] text-[10px] font-mono font-normal border border-[#FF5D22]/30">
                  Smart AI
                </span>
              </h4>
              <p className="text-[11px] text-[#888888]">
                Tự động đo mật độ họa tiết xung quanh & tối ưu độ mượt viền
              </p>
            </div>
          </div>

          {onAutoTune && (
            <button
              type="button"
              id="btn-ai-auto-tune"
              disabled={isAnalyzing || isProcessing}
              onClick={handleRunAutoTune}
              className="px-3 py-1.5 rounded-lg bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_10px_rgba(255,93,34,0.35)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Phân tích vùng chọn và tự động tối ưu hóa thông số ngay"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Phân tích AI ngay</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* AI Analysis Diagnostic feedback banner */}
        {lastAnalysis ? (
          <div className="p-2.5 rounded-lg bg-[#080808] border border-[#222222] text-[11px] space-y-1.5 text-[#AAAAAA]">
            <div className="flex items-center justify-between text-xs text-[#E0E0E0] font-semibold">
              <span className="flex items-center gap-1.5 text-[#00E676]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Kết quả phân tích AI:
              </span>
              <span className="font-mono text-[#FF7D00] text-[11px]">
                Độ phức tạp vân: {lastAnalysis.textureComplexity}%
              </span>
            </div>
            <p className="text-[#BBBBBB] leading-relaxed">
              {lastAnalysis.summary}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-[#777777]">
            <Info className="w-3.5 h-3.5 text-[#FF7D00] shrink-0" />
            <span>AI sẽ tự động đo lường độ phân giải & vân nền xung quanh khi bạn chọn hoặc kéo vùng ROI.</span>
          </div>
        )}

        {/* Auto tune on ROI change toggle */}
        {onToggleAutoTune && (
          <div className="flex items-center justify-between pt-1 border-t border-[#1C1C1C] text-[11px]">
            <span className="text-[#888888]">Tự động cập nhật thông số khi đổi vùng ROI:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[#CCCCCC]">
              <input
                type="checkbox"
                checked={autoTuneEnabled}
                onChange={(e) => onToggleAutoTune(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#FF5D22]"
              />
              <span>Bật tự động</span>
            </label>
          </div>
        )}
      </div>

      {/* Algorithm Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#888888] flex items-center justify-between">
          <span>Chọn thuật toán xử lý:</span>
          <span className="text-[11px] text-[#FF5D22] font-normal">
            {settings.algorithm === 'content_aware' ? '★ Tái tạo vân nền chống lộ' : 'Đang chọn: ' + settings.algorithm}
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {algorithms.map((algo) => (
            <button
              key={algo.id}
              type="button"
              onClick={() => onSettingsChange({ ...settings, algorithm: algo.id })}
              className={`p-3 rounded-lg border text-left transition-all relative ${
                settings.algorithm === algo.id
                  ? 'border-[#FF5D22] bg-[#FF5D22]/10 ring-1 ring-[#FF5D22]/40'
                  : 'border-[#1A1A1A] hover:border-[#262626] bg-[#0D0D0D] hover:bg-[#111111]'
              }`}
            >
              {algo.badge && (
                <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-[#FF5D22] text-white text-[9px] font-bold shadow-sm">
                  {algo.badge}
                </span>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-white">{algo.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#141414] text-[#E0E0E0] border border-[#222222]">
                  {algo.tag}
                </span>
              </div>
              <p className="text-[11px] text-[#888888] line-clamp-2 leading-relaxed">
                {algo.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders & Fine Tuning */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Edge Smoothness (Độ mượt viền chuyển tiếp) */}
        <div className="space-y-2 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888888] font-semibold flex items-center gap-1">
              <span>Độ mượt viền chuyển tiếp:</span>
            </span>
            <span className="font-mono text-[#FF5D22] font-bold">{settings.edgeSmoothness} px</span>
          </div>
          <input
            type="range"
            min="1"
            max="14"
            step="1"
            value={settings.edgeSmoothness}
            onChange={(e) => onSettingsChange({ ...settings, edgeSmoothness: parseInt(e.target.value) || 6 })}
            className="w-full accent-[#FF5D22] h-1.5 bg-[#222222] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#555555] font-mono">
            <span>1px (Sắc nét)</span>
            <span>6-8px (Khuyên dùng)</span>
            <span>14px (Siêu mềm)</span>
          </div>
          <p className="text-[10px] text-[#777777] leading-tight">
            Hòa lẫn viền 4 phía theo đường cong Poisson, triệt tiêu hoàn toàn viền hộp chữ nhật.
          </p>
        </div>

        {/* Blend Radius (Bán kính hòa trộn) */}
        <div className="space-y-2 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888888] font-semibold flex items-center gap-1">
              <span>Bán kính hòa trộn (Radius):</span>
            </span>
            <span className="font-mono text-[#FF7D00] font-bold">{settings.blurRadius} px</span>
          </div>
          <input
            type="range"
            min="1"
            max="18"
            step="1"
            value={settings.blurRadius}
            onChange={(e) => onSettingsChange({ ...settings, blurRadius: parseInt(e.target.value) || 6 })}
            className="w-full accent-[#FF7D00] h-1.5 bg-[#222222] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#555555] font-mono">
            <span>1px (Cục bộ)</span>
            <span>6-8px (Khuyên dùng)</span>
            <span>18px (Rộng)</span>
          </div>
          <p className="text-[10px] text-[#777777] leading-tight">
            Độ sâu và khoảng cách sao chép lan truyền họa tiết từ pixel lân cận vào tâm vùng chọn.
          </p>
        </div>
      </div>

      {/* Alpha luminance threshold slider (when alpha reversal algorithm is selected) */}
      {settings.algorithm === 'alpha_reversal' && (
        <div className="space-y-1.5 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888888] font-medium">Ngưỡng độ sáng Watermark (Alpha Threshold):</span>
            <span className="font-mono text-[#FF7D00] font-semibold">{settings.alphaThreshold}</span>
          </div>
          <input
            type="range"
            min="100"
            max="240"
            step="5"
            value={settings.alphaThreshold}
            onChange={(e) => onSettingsChange({ ...settings, alphaThreshold: parseInt(e.target.value) || 175 })}
            className="w-full accent-[#FF7D00] h-1.5 bg-[#222222] rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-[#555555]">
            Tách biệt pixel chữ màu trắng/sáng của Flow AI/Veo 3 khỏi nền gốc
          </p>
        </div>
      )}

      {/* Video Quality & Audio options (For video) */}
      {mediaType === 'video' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#888888] font-medium">Chất lượng xuất:</span>
            <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded border border-[#222222]">
              {(['fast', 'balanced', 'high'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, quality: q })}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium uppercase transition-all cursor-pointer ${
                    settings.quality === q ? 'bg-[#FF5D22] text-white shadow' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  {q === 'fast' ? 'Nhanh' : q === 'balanced' ? 'Cân bằng' : 'Cao (CRF 18)'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-[#E0E0E0]">
            <input
              type="checkbox"
              checked={settings.preserveAudio}
              onChange={(e) => onSettingsChange({ ...settings, preserveAudio: e.target.checked })}
              className="w-4 h-4 rounded accent-[#FF5D22]"
            />
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-[#888888]" />
              Giữ nguyên âm thanh gốc
            </span>
          </label>
        </div>
      )}

      {/* Real-time Progress Tracking Section */}
      {isProcessing && (
        <div className="p-4 rounded-lg bg-[#0D0D0D] border border-[#FF5D22]/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#FF7D00] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {statusMessage || 'Đang xử lý loại bỏ watermark...'}
            </span>
            <span className="font-mono text-[#FF5D22] font-bold text-sm">{progress}%</span>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#222222] overflow-hidden relative">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#FF3D00] to-[#FF7D00] rounded-full transition-all duration-200 shadow-[0_0_10px_rgba(255,93,34,0.6)]"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#555555]">
            <span>Xử lý 100% trên phần cứng máy khách (Local Browser)</span>
            {onCancelProcess && (
              <button
                type="button"
                onClick={onCancelProcess}
                className="text-[#FF5D22] hover:underline cursor-pointer"
              >
                Hủy tác vụ
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Execution Action Button */}
      <button
        type="button"
        id="btn-remove-watermark-now"
        disabled={isProcessing}
        onClick={onStartProcess}
        className="w-full py-3.5 px-6 rounded-md bg-[#FF5D22] hover:bg-[#FF3D00] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(255,93,34,0.35)] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>ĐANG XỬ LÝ KHUNG HÌNH... ({progress}%)</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-white" />
            <span>Remove Watermark Now</span>
            <kbd className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded bg-black/35 border border-white/20 text-[11px] font-mono font-normal text-white/90 shadow-sm">
              ↵ Enter
            </kbd>
          </>
        )}
      </button>
    </div>
  );
};
