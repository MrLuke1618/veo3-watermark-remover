import { useEffect } from 'react';

export interface UseKeyboardShortcutsOptions {
  onTogglePlay?: () => void;
  onResetROI?: () => void;
  onStartProcess?: () => void;
  disabled?: boolean;
}

/**
 * Custom hook to handle global keyboard shortcuts:
 * - 'Space': Toggle play/pause on preview video
 * - 'R' / 'r': Reset ROI bounding box to default position
 * - 'Enter': Start watermark removal process
 */
export function useKeyboardShortcuts({
  onTogglePlay,
  onResetROI,
  onStartProcess,
  disabled = false,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input, textarea, select, or contenteditable elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Ignore if modifier keys (Ctrl, Meta, Alt) are pressed (prevent overriding browser actions)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // 1. 'Space': Toggle play/pause
      if (e.code === 'Space' || e.key === ' ') {
        if (onTogglePlay) {
          e.preventDefault();
          onTogglePlay();
        }
      }
      // 2. 'R' / 'r': Reset ROI
      else if (e.key.toLowerCase() === 'r' || e.code === 'KeyR') {
        if (onResetROI) {
          e.preventDefault();
          onResetROI();
        }
      }
      // 3. 'Enter': Start the removal process
      else if (e.key === 'Enter' || e.code === 'Enter') {
        if (onStartProcess) {
          e.preventDefault();
          onStartProcess();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onTogglePlay, onResetROI, onStartProcess, disabled]);
}
