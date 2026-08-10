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
    <div className="w-full shrink-0 space-y-1.5 sm:space-y-2 select-none z-20">
      {/* Dynamic Status Banner */}
      <div className="text-center min-h-[22px] flex items-center justify-center gap-2">
        {phase === 'PLAYER_LOCKED' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
            <ShieldCheck size={13} />
            <span>YOU: ✓ CHOICE LOCKED (REVEALING AT 0s)</span>
          </span>
        ) : phase === 'CHOOSING' ? (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
            <Zap size={12} className="text-[#FF5F6D]" />
            <span>MAKE YOUR MOVE BEFORE TIMER EXPIRES</span>
          </span>
        ) : null}

        {opponentLocked && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
            <UserCheck size={13} />
            <span>OPPONENT: LOCKED IN</span>
          </span>
        )}
      </div>

      {/* 3 Interactive Move Controls */}
      <div
        role="radiogroup"
        aria-label="Rock Paper Scissors Move Selector"
        className="grid grid-cols-3 gap-2 sm:gap-3"
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
              className={`relative p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 sm:gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F6D] ${
                isSelected
                  ? 'bg-[#111A30] border-[#FF5F6D] shadow-glow-cyan scale-102 z-10'
                  : 'bg-[#0B1224] hover:bg-[#111A30] border-white/10 hover:border-[#FF5F6D]/50 hover:scale-101 active:scale-98'
              } ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Icon Visual */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform">
                {cfg.code === 'rock' ? '🪨' : cfg.code === 'paper' ? '📄' : '✂️'}
              </div>

              {/* Title & Rule Subtext */}
              <div className="text-center">
                <span className="text-xs sm:text-sm font-black font-display tracking-widest text-[#F8FAFC] block uppercase leading-tight">
                  {cfg.name}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#94A3B8] font-mono block leading-tight">
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
