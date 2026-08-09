import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, Clock, LogOut, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.js';
import { useRPSGameState } from './state/useRPSGameState.js';
import { RPSArenaCanvas } from './arena/RPSArenaCanvas.js';
import { RPSScoreboard } from './ui/RPSScoreboard.js';
import { RPSControls } from './ui/RPSControls.js';

export const RPSGame: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const storeTargetPoints = useGameStore((s) => s.rpsTargetPoints);

  // Target points from room state or store
  const targetPoints = (roomState?.timeControlSeconds && roomState.timeControlSeconds <= 20)
    ? roomState.timeControlSeconds
    : (storeTargetPoints || 5);

  const { state, actions } = useRPSGameState(targetPoints);
  const {
    phase,
    playerScore,
    opponentScore,
    roundCount,
    timerSeconds,
    playerChoice,
    opponentChoice,
    roundOutcome,
    outcomePhrase,
    countdownSequenceText,
    myRematchAgreed,
    opponentRematchAgreed,
    opponentHasLeft
  } = state;

  // Reduced Motion Detection
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleMediaChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const isGameOver = phase === 'MATCH_COMPLETE';

  return (
    <div className="relative w-full h-full max-h-full flex flex-col justify-between p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#0B1224]/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden select-none">
      
      {/* Background Soft Atmospheric Lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111A30]/40 via-transparent to-[#030611]/80 pointer-events-none" />

      {/* 1. Header: High-Visibility Scoreboard & Match Goal */}
      <RPSScoreboard
        playerScore={playerScore}
        opponentScore={opponentScore}
        targetPoints={targetPoints}
        roundCount={roundCount}
        timerSeconds={timerSeconds}
        phase={phase}
      />

      {/* 2. Center: Universal Responsive 3D RPS Arena Stage */}
      <div className="relative z-10 w-full flex-1 min-h-[160px] sm:min-h-[220px] max-h-[340px] my-2 rounded-2xl bg-[#070B18] border border-white/10 flex flex-col items-center justify-center overflow-hidden shadow-inner">
        <RPSArenaCanvas
          playerChoice={playerChoice}
          opponentChoice={opponentChoice}
          phase={phase}
          reducedMotion={reducedMotion}
        />

        {/* Countdown Sequence Overlay ("ROCK!", "PAPER!", "SCISSORS!", "SHOOT!") */}
        <AnimatePresence mode="wait">
          {countdownSequenceText && (
            <motion.div
              key={countdownSequenceText}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.35, type: 'spring' }}
              className="absolute z-30 text-3xl sm:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-white to-[#FF5F6D] drop-shadow-2xl uppercase"
            >
              {countdownSequenceText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outcome Toast Banner Floating Over 3D Arena */}
        {!countdownSequenceText && (phase === 'REVEAL' || phase === 'RESULT') && roundOutcome && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              className={`px-5 py-2 rounded-full text-xs font-black tracking-wider uppercase border shadow-2xl backdrop-blur-xl ${
                roundOutcome === 'win'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-glow-cyan'
                  : roundOutcome === 'lose'
                  ? 'bg-red-500/20 text-red-300 border-red-400/50'
                  : 'bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/50'
              }`}
            >
              {outcomePhrase}
            </motion.div>
          </div>
        )}
      </div>

      {/* 3. Bottom: Move Controls */}
      <RPSControls
        playerChoice={playerChoice}
        phase={phase}
        opponentLocked={state.opponentLocked}
        onSelectChoice={actions.handleSelectChoice}
      />

      {/* 4. Match Complete Victory Overlay or Opponent Left Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-[#030611]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-4">
          {opponentHasLeft ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-3xl shadow-glow-cyan">
                🚪
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-display text-[#F8FAFC] uppercase tracking-wider">
                OPPONENT HAS LEFT THE ARENA
              </h3>

              <p className="text-xs text-[#94A3B8] max-w-sm">
                The other player has exited the room. Returning to Home Page Launcher...
              </p>

              <button
                onClick={actions.handleExitToHome}
                className="mt-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 bg-gradient-to-r from-amber-500 to-red-600 hover:scale-105 active:scale-95 text-white shadow-glow-cyan cursor-pointer"
              >
                <LogOut size={14} />
                <span>RETURN TO HOME LAUNCHER</span>
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-[#FF5F6D]/20 border border-[#FF5F6D]/50 flex items-center justify-center text-3xl shadow-glow-cyan">
                {playerScore >= targetPoints ? '🏆' : '💀'}
              </div>

              <h3 className="text-2xl sm:text-3xl font-black font-display text-[#F8FAFC] uppercase tracking-wider">
                {playerScore >= targetPoints ? `VICTORY! REACHED ${targetPoints} POINTS` : 'GAME OVER! OPPONENT WINS MATCH'}
              </h3>

              <p className="text-xs text-[#94A3B8]">
                Final Score: {playerScore} - {opponentScore} (Target: {targetPoints} Pts)
              </p>

              {/* Dual Rematch Status */}
              <div className="flex items-center justify-center gap-3 py-1">
                <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${
                  myRematchAgreed ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
                }`}>
                  {myRematchAgreed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  <span>YOU: {myRematchAgreed ? 'ACCEPTED' : 'WAITING'}</span>
                </div>

                <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${
                  opponentRematchAgreed ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
                }`}>
                  {opponentRematchAgreed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  <span>OPPONENT: {opponentRematchAgreed ? 'ACCEPTED' : 'WAITING'}</span>
                </div>
              </div>

              {/* Action Buttons: START NEW MATCH vs EXIT TO HOME PAGE */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  disabled={myRematchAgreed}
                  onClick={actions.handleRequestRematch}
                  className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                    myRematchAgreed
                      ? 'bg-emerald-500/20 text-gray-400 border border-white/10 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#FF5F6D] to-purple-600 hover:scale-105 active:scale-95 text-white shadow-glow-cyan'
                  }`}
                >
                  <RefreshCw size={14} className={myRematchAgreed ? 'animate-spin' : ''} />
                  <span>
                    {myRematchAgreed ? 'WAITING FOR OPPONENT...' : 'START NEW MATCH'}
                  </span>
                </button>

                <button
                  onClick={actions.handleExitToHome}
                  className="px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-400/40 text-gray-200 hover:text-red-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>EXIT TO HOME PAGE</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
