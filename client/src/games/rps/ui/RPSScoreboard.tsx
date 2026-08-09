import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
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
    <div className="w-full space-y-3 select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-[#FF5F6D] uppercase tracking-widest">
              ROUND {roundCount} • FIRST TO {targetPoints} POINTS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display text-[#F8FAFC]">
            ROCK PAPER SCISSORS ROYALE
          </h2>
        </div>

        {/* Score Tally Panel */}
        <div className="flex items-center gap-6 bg-[#0B1224] px-5 py-2.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="text-center">
            <span className="text-[10px] font-mono uppercase text-[#38bdf8] font-bold block">YOU</span>
            <span className="text-2xl font-black text-[#F8FAFC]">{playerScore}</span>
          </div>
          <div className="text-center px-1">
            <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">GOAL</span>
            <span className="text-xs font-bold text-[#FF5F6D]">{targetPoints} PTS</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-mono uppercase text-[#FF5F6D] font-bold block">OPPONENT</span>
            <span className="text-2xl font-black text-[#F8FAFC]">{opponentScore}</span>
          </div>
        </div>
      </div>

      {/* 10-Second Per-Round Turn Timer Progress Bar */}
      {isTurnTimerActive && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1.5 text-[#FF5F6D] font-bold uppercase">
              {phase === 'PLAYER_LOCKED' ? (
                <>
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span className="text-emerald-400">MOVE LOCKED (CONCLUDES AT 0s)</span>
                </>
              ) : (
                <>
                  <Clock size={13} />
                  <span>SELECT MOVE TIMER</span>
                </>
              )}
            </span>
            <span className={`font-bold font-mono ${timerSeconds <= 3 ? 'text-red-400 animate-pulse' : 'text-[#38bdf8]'}`}>
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
