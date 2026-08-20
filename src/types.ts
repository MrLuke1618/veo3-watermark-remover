/**
 * Types and interfaces for VEO3 Local Watermark Remover Pro
 */

export type MediaType = 'video' | 'image';

export interface ROI {
  x: number;       // In actual media pixel coordinate
  y: number;
  width: number;
  height: number;
  normalized?: {   // 0.0 to 1.0 relative
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type RemovalAlgorithm = 'delogo' | 'alpha_reversal' | 'content_aware' | 'smart_blur';

export interface AlgorithmSettings {
  algorithm: RemovalAlgorithm;
  blurRadius: number;           // 1 - 20
  edgeSmoothness: number;       // 1 - 10
  alphaThreshold: number;       // 0 - 255 (for alpha reversal)
  colorCorrection: boolean;     // Adaptive histogram matching
  quality: 'fast' | 'balanced' | 'high';
  preserveAudio: boolean;       // For video
  temporalStability: boolean;   // For video frame smoothing
}

export type ProcessStatus = 'idle' | 'preparing' | 'processing' | 'completed' | 'error';

export interface MediaItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: MediaType;
  mimeType: string;
  originalUrl: string;
  processedUrl: string | null;
  processedBlob: Blob | null;
  width: number;
  height: number;
  duration?: number;           // in seconds (for video)
  fps?: number;
  roi: ROI;
  status: ProcessStatus;
  progress: number;            // 0 - 100
  statusMessage: string;
  logs: string[];
  createdAt: number;
  completedAt?: number;
  settings: AlgorithmSettings;
}

export interface PresetROI {
  id: string;
  name: string;
  description: string;
  provider: 'Veo 3' | 'Gemini' | 'Flow AI' | 'Runway Gen-3' | 'Kling' | 'Sora' | 'Custom';
  calcROI: (width: number, height: number) => ROI;
}

export interface ProcessingStats {
  elapsedMs: number;
  fps?: number;
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeLeftSec?: number;
}

export interface UndoHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  timestamp: number;
  previousItemState: MediaItem;
  reason: 'revert_removal' | 'reset_tuning' | 'batch_revert';
}

export type VideoExportFormat = 'mp4' | 'webm';
export type ImageExportFormat = 'png' | 'jpg';
export type VideoQualityCompression = 'low' | 'medium' | 'high' | 'lossless';

export interface ExportSettings {
  videoFormat: VideoExportFormat;
  imageFormat: ImageExportFormat;
  videoQuality: VideoQualityCompression;
  filenamePattern: 'cleaned_prefix' | 'no_watermark_suffix' | 'clean_quality_suffix' | 'original_name';
  preserveMetadata: boolean;
  imageJpegQuality: number; // 0.6 to 1.0
  includeTimestamp: boolean;
}
