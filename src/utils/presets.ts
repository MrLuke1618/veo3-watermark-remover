import { PresetROI, ROI } from '../types';

export const PRESETS: PresetROI[] = [
  {
    id: 'flow_ai_omni',
    name: 'Flow AI / Flow Omni (Mặc định)',
    description: 'Logo chữ & biểu tượng mờ đặc trưng của Flow AI / Flow Omni ở góc dưới',
    provider: 'Flow AI',
    calcROI: (width: number, height: number): ROI => {
      const rw = Math.round(width * 0.20);
      const rh = Math.round(height * 0.075);
      const rx = Math.max(0, width - rw - Math.round(width * 0.03));
      const ry = Math.max(0, height - rh - Math.round(height * 0.03));
      return {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        normalized: {
          x: rx / width,
          y: ry / height,
          width: rw / width,
          height: rh / height,
        },
      };
    },
  },
  {
    id: 'veo3_bottom_right',
    name: 'Google Veo 3 / Veo 2',
    description: 'Logo & watermark ở góc dưới bên phải chuẩn kích thước Veo 3',
    provider: 'Veo 3',
    calcROI: (width: number, height: number): ROI => {
      // Typically ~14% width, ~7% height from bottom right with 2% margin
      const rw = Math.round(width * 0.16);
      const rh = Math.round(height * 0.08);
      const rx = Math.max(0, width - rw - Math.round(width * 0.025));
      const ry = Math.max(0, height - rh - Math.round(height * 0.035));
      return {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        normalized: {
          x: rx / width,
          y: ry / height,
          width: rw / width,
          height: rh / height,
        },
      };
    },
  },
  {
    id: 'gemini_sparkle',
    name: 'Gemini AI Sparkle',
    description: 'Biểu tượng ngôi sao 4 cánh & watermark Gemini ở góc dưới',
    provider: 'Gemini',
    calcROI: (width: number, height: number): ROI => {
      const rw = Math.round(width * 0.18);
      const rh = Math.round(height * 0.09);
      const rx = Math.max(0, width - rw - Math.round(width * 0.02));
      const ry = Math.max(0, height - rh - Math.round(height * 0.02));
      return {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        normalized: {
          x: rx / width,
          y: ry / height,
          width: rw / width,
          height: rh / height,
        },
      };
    },
  },
  {
    id: 'kling_bottom_right',
    name: 'Kling AI / Hailuo',
    description: 'Góc dưới bên phải kích thước mở rộng',
    provider: 'Kling',
    calcROI: (width: number, height: number): ROI => {
      const rw = Math.round(width * 0.15);
      const rh = Math.round(height * 0.065);
      const rx = Math.max(0, width - rw - Math.round(width * 0.02));
      const ry = Math.max(0, height - rh - Math.round(height * 0.025));
      return {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        normalized: {
          x: rx / width,
          y: ry / height,
          width: rw / width,
          height: rh / height,
        },
      };
    },
  },
  {
    id: 'runway_gen3',
    name: 'Runway Gen-3 Alpha',
    description: 'Logo text mờ nhạt ở góc dưới bên phải hoặc góc trên',
    provider: 'Runway Gen-3',
    calcROI: (width: number, height: number): ROI => {
      const rw = Math.round(width * 0.17);
      const rh = Math.round(height * 0.07);
      const rx = Math.max(0, width - rw - Math.round(width * 0.02));
      const ry = Math.max(0, height - rh - Math.round(height * 0.02));
      return {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        normalized: {
          x: rx / width,
          y: ry / height,
          width: rw / width,
          height: rh / height,
        },
      };
    },
  },
  {
    id: 'top_right_corner',
    name: 'Góc trên bên phải (Top Right)',
    description: 'Dành cho các mô hình AI đặt logo ở góc trên bên phải',
    provider: 'Custom',
    calcROI: (width: number, height: number): ROI => {
      const rw = Math.round(width * 0.16);
      const rh = Math.round(height * 0.08);
      const rx = Math.max(0, width - rw - Math.round(width * 0.025));
      const ry = Math.round(height * 0.025);
      return {
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        normalized: {
          x: rx / width,
          y: ry / height,
          width: rw / width,
          height: rh / height,
        },
      };
    },
  },
];

export function createDefaultROI(width: number, height: number): ROI {
  return PRESETS[0].calcROI(width, height);
}
