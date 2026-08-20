import React, { useRef, useState } from 'react';
import { UploadCloud, Film, Image as ImageIcon, Sparkles, Video } from 'lucide-react';
import { SampleMediaGenerator } from '../utils/sampleMedia';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isGeneratingSample: boolean;
  setIsGeneratingSample: (loading: boolean) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isGeneratingSample,
  setIsGeneratingSample,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async (type: 'video' | 'image', provider: 'Veo 3' | 'Gemini' | 'Flow AI') => {
    try {
      setIsGeneratingSample(true);
      let sampleFile: File;
      if (type === 'video') {
        sampleFile = await SampleMediaGenerator.createSampleVideo(provider);
      } else {
        sampleFile = await SampleMediaGenerator.createSampleImage(provider);
      }
      onFilesSelected([sampleFile]);
    } catch (err) {
      console.error('Error generating sample:', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div className="w-full">
      {/* Main Upload Dropzone */}
      <div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center overflow-hidden ${
          isDragOver
            ? 'border-[#FF5D22] bg-[#FF5D22]/10 shadow-2xl scale-[1.005]'
            : 'border-[#262626] hover:border-[#333333] bg-[#0A0A0A] hover:bg-[#0D0D0D]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="media-file-input"
          accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Ambient subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF3D00]/5 via-transparent to-[#FF7D00]/5 pointer-events-none" />

        {/* Upload Icon */}
        <div className="relative mb-5 flex items-center justify-center w-16 h-16 rounded-xl bg-[#111111] border border-[#262626] group-hover:border-[#FF5D22]/50 group-hover:scale-105 transition-all">
          <UploadCloud className="w-8 h-8 text-[#FF5D22] group-hover:text-[#FF7D00] transition-colors" />
          <div className="absolute -bottom-1 -right-1 p-1 rounded-md bg-[#FF5D22]/20 border border-[#FF5D22]/40 text-[#FF5D22]">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
          Kéo thả Video hoặc Ảnh AI vào đây
        </h3>
        <p className="text-sm text-[#888888] max-w-lg mb-6 leading-relaxed">
          Hỗ trợ xóa watermark cho video/ảnh tạo bởi <span className="text-[#FF5D22] font-semibold">Google Veo 3</span>,{' '}
          <span className="text-white font-semibold">Gemini</span>, <span className="text-[#FF7D00] font-semibold">Flow AI</span>, Kling, Sora, Runway. Xử lý 100% trên trình duyệt.
        </p>

        {/* Badges of formats & resolution */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-xs text-[#888888]">
          <span className="px-3 py-1 rounded bg-[#111111] border border-[#222222] flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#FF5D22]" />
            MP4, WebM, MOV (Max 50MB)
          </span>
          <span className="px-3 py-1 rounded bg-[#111111] border border-[#222222] flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#E0E0E0]" />
            PNG, JPG, WebP
          </span>
          <span className="px-3 py-1 rounded bg-[#111111] border border-[#222222] text-[#00E676] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
            720p / 1080p / 4K
          </span>
        </div>

        {/* Choose File Button */}
        <button
          type="button"
          className="px-6 py-2.5 rounded-md bg-[#FF5D22] hover:bg-[#FF3D00] text-white text-sm font-semibold shadow-[0_4px_15px_rgba(255,93,34,0.3)] transition-all active:scale-95"
        >
          Chọn tệp từ máy tính
        </button>
      </div>

      {/* Quick Test Demo Presets */}
      <div className="mt-4 p-4 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#888888]">
          <Sparkles className="w-4 h-4 text-[#FF7D00]" />
          <span>Chưa có sẵn tệp? Thử ngay media mẫu có watermark:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-sample-flow-video"
            disabled={isGeneratingSample}
            onClick={() => handleLoadSample('video', 'Flow AI')}
            className="px-3 py-1.5 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-[#FF7D00] text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#FF7D00]" />
            ❖ Video Flow AI / Omni Mẫu
          </button>
          <button
            type="button"
            id="btn-sample-veo-video"
            disabled={isGeneratingSample}
            onClick={() => handleLoadSample('video', 'Veo 3')}
            className="px-3 py-1.5 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-[#FF5D22] text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#FF5D22]" />
            {isGeneratingSample ? 'Đang tạo...' : '⚡ Video Veo 3 Mẫu'}
          </button>
          <button
            type="button"
            id="btn-sample-gemini-image"
            disabled={isGeneratingSample}
            onClick={() => handleLoadSample('image', 'Gemini')}
            className="px-3 py-1.5 rounded bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] text-[#E0E0E0] text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#E0E0E0]" />
            ✦ Ảnh Gemini Mẫu
          </button>
        </div>
      </div>
    </div>
  );
};

