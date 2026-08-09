import { useState, useEffect, useCallback } from 'react';

export type HeroFocusState = 'IDLE' | 'INTRO' | 'CHESS_FOCUS' | 'LUDO_FOCUS' | 'RPS_FOCUS' | 'TRANSITIONING';
export type GameId = 'chess' | 'ludo' | 'rps';

export interface PointerState {
  x: number; // normalized -1 to 1
  y: number; // normalized -1 to 1
}

export function useHeroState() {
  const [focusState, setFocusState] = useState<HeroFocusState>('CHESS_FOCUS');
  const [activeGame, setActiveGame] = useState<GameId>('chess');
  const [pointer, setPointer] = useState<PointerState>({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  // Check reduced motion & WebGL availability on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleMediaChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLAvailable(!!gl);
    } catch (e) {
      setWebGLAvailable(false);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  // Pointer position tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setPointer({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Set Hover / Focus state
  const handleHoverGame = useCallback((gameId: GameId | null) => {
    if (!gameId) {
      setFocusState('IDLE');
    } else {
      setActiveGame(gameId);
      if (gameId === 'chess') setFocusState('CHESS_FOCUS');
      if (gameId === 'ludo') setFocusState('LUDO_FOCUS');
      if (gameId === 'rps') setFocusState('RPS_FOCUS');
    }
  }, []);

  // Instant Select Game (Zero lag, no hanging timeouts!)
  const handleSelectGame = useCallback((gameId: GameId, onComplete: () => void) => {
    setActiveGame(gameId);
    onComplete(); // Instant response
  }, []);

  return {
    focusState,
    activeGame,
    pointer,
    reducedMotion,
    webGLAvailable,
    handleHoverGame,
    handleSelectGame
  };
}
