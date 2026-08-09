import React from 'react';
import { ShieldCheck, Zap, UserCheck } from 'lucide-react';
import { RPSChoice, RPS_CHOICES } from '../engine/RPSGameEngine.js';
import { RPSGamePhase } from '../state/useRPSGameState.js';

interface RPSControlsProps {
  playerChoice: RPSChoice | null;
  phase: RPSGamePhase;
  opponentLocked?: boolean;
  onSelectChoice: (choice: RPSChoice) => void;
}

export const RPSControls: React.FC<RPSControlsProps> = ({
  playerChoice,
  phase,
  opponentLocked = false,
  onSelectChoice
}) => {
  const isLocked = phase === 'PLAYER_LOCKED' || phase === 'BOTH_LOCKED' || phase === 'REVEAL' || phase === 'RESULT' || phase === 'MATCH_COMPLETE';
  const isDisabled = isLocked || phase !== 'CHOOSING';

  const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];

  const handleKeyDown = (e: React.KeyboardEvent, choice: RPSChoice) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectChoice(choice);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Dynamic Status Banner */}
      <div className="text-center min-h-[28px] flex items-center justify-center gap-3">
        {phase === 'PLAYER_LOCKED' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
            <ShieldCheck size={14} />
            <span>YOU: ✓ CHOICE LOCKED (REVEALING AT 0s)</span>
          </span>
        ) : phase === 'CHOOSING' ? (
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <Zap size={13} className="text-[#FF5F6D]" />
            <span>MAKE YOUR MOVE BEFORE TIMER EXPIRES</span>
          </span>
        ) : null}

        {opponentLocked && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-mono font-bold uppercase tracking-wider">
            <UserCheck size={14} />
            <span>OPPONENT: LOCKED IN</span>
          </span>
        )}
      </div>

      {/* 3 Interactive Move Controls */}
      <div
        role="radiogroup"
        aria-label="Rock Paper Scissors Move Selector"
        className="grid grid-cols-3 gap-3 sm:gap-4"
      >
        {choices.map((key) => {
          const cfg = RPS_CHOICES[key];
          const isSelected = playerChoice === key;

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select ${cfg.name}`}
              tabIndex={isDisabled ? -1 : 0}
              disabled={isDisabled}
              onClick={() => onSelectChoice(key)}
              onKeyDown={(e) => handleKeyDown(e, key)}
              className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F6D] ${
                isSelected
                  ? 'bg-[#111A30] border-[#FF5F6D] shadow-glow-cyan scale-105 z-10'
                  : 'bg-[#0B1224] hover:bg-[#111A30] border-white/10 hover:border-[#FF5F6D]/50 hover:scale-102 active:scale-98'
              } ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Icon Visual */}
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {cfg.code === 'rock' ? '🪨' : cfg.code === 'paper' ? '📄' : '✂️'}
              </div>

              {/* Title & Rule Subtext */}
              <div className="text-center">
                <span className="text-xs sm:text-sm font-black font-display tracking-widest text-[#F8FAFC] block uppercase">
                  {cfg.name}
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono hidden sm:block">
                  {isSelected ? 'LOCKED' : `BEATS ${cfg.beats.toUpperCase()}`}
                </span>
              </div>

              {/* Selected Highlight Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF5F6D] shadow-glow-cyan" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
