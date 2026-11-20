import { useState, useCallback } from 'react';
import { soundManager, isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

export function useSound() {
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) {
      soundManager.playClick();
    }
  }, [soundOn]);

  return {
    soundOn,
    toggleSound,
    playWelcome: soundManager.playWelcome,
    playClick: soundManager.playClick,
    playTab: soundManager.playTab,
    playSuccess: soundManager.playSuccess,
    playWarning: soundManager.playWarning,
    playDelete: soundManager.playDelete,
    playBell: soundManager.playBell,
    playPop: soundManager.playPop,
    playWhoosh: soundManager.playWhoosh,
    playThemeToggle: soundManager.playThemeToggle,
    playAction: soundManager.playAction,
  };
}
