import React from 'react';
import { Clock, ShieldCheck, Trophy, Zap } from 'lucide-react';
import { RPSGamePhase } from '../state/useRPSGameState.js';

interface RPSScoreboardProps {
  playerScore: number;
  opponentScore: number;
  targetPoints: number;
  roundCount: number;
  timerSeconds: number;
  phase: RPSGamePhase;
}

export const RPSScoreboard: React.FC<RPSScoreboardProps> = ({
  playerScore,
  opponentScore,
  targetPoints,
  roundCount,
  timerSeconds,
  phase
}) => {
  const isTurnTimerActive = phase === 'CHOOSING' || phase === 'PLAYER_LOCKED';

  return (
    <div className="w-full shrink-0 space-y-2 select-none">
      {/* Universal Responsive Header & Scoreboard Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/15">
        {/* Left Title & Round Match Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FF5F6D]/20 border border-[#FF5F6D]/40 text-[10px] font-mono font-extrabold text-[#FF5F6D] uppercase tracking-wider">
              ROUND {roundCount}
            </span>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">
              • GOAL: {targetPoints} PTS
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-black font-display text-[#F8FAFC] tracking-wide mt-0.5">
            ROCK PAPER SCISSORS ROYALE
          </h2>
        </div>

        {/* Right High-Visibility Crystal Clear Score Tally Box */}
        <div className="flex items-center gap-4 bg-[#070B18]/90 px-4 py-1.5 rounded-2xl border border-cyan-400/30 shadow-glow-cyan">
          {/* YOU SCORE */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-mono uppercase text-[#38bdf8] font-black tracking-widest leading-none">YOU</span>
              <span className="text-xs text-gray-400 font-mono font-bold">PLAYER 1</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-display text-white drop-shadow-md">{playerScore}</span>
          </div>

          {/* VS / TARGET BADGE */}
          <div className="flex flex-col items-center px-1 border-x border-white/10">
            <span className="text-[9px] font-mono uppercase text-amber-400 font-bold tracking-wider">GOAL</span>
            <span className="text-[11px] font-mono font-black text-[#FF5F6D]">{targetPoints} PTS</span>
          </div>

          {/* OPPONENT SCORE */}
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black font-display text-white drop-shadow-md">{opponentScore}</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono uppercase text-[#FF5F6D] font-black tracking-widest leading-none">OPPONENT</span>
              <span className="text-xs text-gray-400 font-mono font-bold">PLAYER 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10-Second Per-Round Turn Timer Progress Bar */}
      {isTurnTimerActive && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span className="flex items-center gap-1.5 text-[#FF5F6D] font-bold uppercase">
              {phase === 'PLAYER_LOCKED' ? (
                <>
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">MOVE LOCKED (CONCLUDES AT 0s)</span>
                </>
              ) : (
                <>
                  <Clock size={12} />
                  <span>SELECT MOVE TIMER</span>
                </>
              )}
            </span>
            <span className={`font-black font-mono text-xs ${timerSeconds <= 3 ? 'text-red-400 animate-pulse' : 'text-[#38bdf8]'}`}>
              {timerSeconds}s
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                phase === 'PLAYER_LOCKED'
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                  : 'bg-gradient-to-r from-[#FF5F6D] via-purple-500 to-[#38bdf8]'
              }`}
              style={{ width: `${(timerSeconds / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
