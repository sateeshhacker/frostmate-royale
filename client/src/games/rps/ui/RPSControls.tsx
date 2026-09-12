import React from 'react';
import { ShieldCheck, Zap, UserCheck, CheckCircle } from 'lucide-react';
import { RPSChoice, RPS_CHOICES } from '../engine/RPSGameEngine.js';
import { RPSGamePhase } from '../state/useRPSGameState.js';

interface RPSControlsProps {
  playerChoice: RPSChoice | null;
  phase: RPSGamePhase;
  opponentLocked?: boolean;
  onSelectChoice: (choice: RPSChoice) => void;
}

// ─── Custom Themed Vector SVG Emblems (Clean & Consistent on All Devices) ───
const RockEmblem: React.FC<{ active?: boolean; className?: string }> = ({ active, className = "w-7 h-7 sm:w-8 sm:h-8" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 8L28 6L36 18L30 34L10 32L4 18L12 8Z"
      fill={active ? "url(#rockGradActive)" : "url(#rockGrad)"}
      stroke={active ? "#38bdf8" : "#64748b"}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 8L20 20L36 18" stroke={active ? "#7dd3fc" : "#94a3b8"} strokeWidth="1.5" />
    <path d="M20 20L30 34" stroke={active ? "#7dd3fc" : "#94a3b8"} strokeWidth="1.5" />
    <path d="M20 20L10 32" stroke={active ? "#7dd3fc" : "#94a3b8"} strokeWidth="1.5" />
    <path d="M20 20L4 18" stroke={active ? "#7dd3fc" : "#94a3b8"} strokeWidth="1.5" />
    <path d="M20 20L28 6" stroke={active ? "#7dd3fc" : "#94a3b8"} strokeWidth="1.5" />
    <defs>
      <linearGradient id="rockGrad" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#334155" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="rockGradActive" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0284c7" />
        <stop offset="1" stopColor="#0369a1" />
      </linearGradient>
    </defs>
  </svg>
);

const PaperEmblem: React.FC<{ active?: boolean; className?: string }> = ({ active, className = "w-7 h-7 sm:w-8 sm:h-8" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 6C10 4.89543 10.8954 4 12 4H24L32 12V34C32 35.1046 31.1046 36 30 36H12C10.8954 36 10 35.1046 10 34V6Z"
      fill={active ? "url(#paperGradActive)" : "url(#paperGrad)"}
      stroke={active ? "#f59e0b" : "#94a3b8"}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M24 4V12H32" fill={active ? "#d97706" : "#475569"} stroke={active ? "#f59e0b" : "#94a3b8"} strokeWidth="2" strokeLinejoin="round" />
    <path d="M15 18H27M15 23H27M15 28H23" stroke={active ? "#fef3c7" : "#cbd5e1"} strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="paperGrad" x1="10" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#475569" />
        <stop offset="1" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="paperGradActive" x1="10" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#b45309" />
        <stop offset="1" stopColor="#78350f" />
      </linearGradient>
    </defs>
  </svg>
);

const ScissorsEmblem: React.FC<{ active?: boolean; className?: string }> = ({ active, className = "w-7 h-7 sm:w-8 sm:h-8" }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="12" cy="30" rx="5" ry="4" transform="rotate(-30 12 30)" stroke={active ? "#ff5f6d" : "#94a3b8"} strokeWidth="2.5" fill={active ? "rgba(255,95,109,0.25)" : "transparent"} />
    <ellipse cx="28" cy="30" rx="5" ry="4" transform="rotate(30 28 30)" stroke={active ? "#ff5f6d" : "#94a3b8"} strokeWidth="2.5" fill={active ? "rgba(255,95,109,0.25)" : "transparent"} />
    <path d="M14 27L28 8" stroke={active ? "#fecdd3" : "#cbd5e1"} strokeWidth="3" strokeLinecap="round" />
    <path d="M26 27L12 8" stroke={active ? "#fecdd3" : "#cbd5e1"} strokeWidth="3" strokeLinecap="round" />
    <circle cx="20" cy="18" r="2.5" fill={active ? "#ff5f6d" : "#64748b"} stroke="#ffffff" strokeWidth="1" />
  </svg>
);

const THEME_STYLES: Record<RPSChoice, {
  borderSelected: string;
  bgSelected: string;
  shadowSelected: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  shortRule: string;
}> = {
  rock: {
    borderSelected: 'border-[#38bdf8] ring-2 ring-[#38bdf8]/60',
    bgSelected: 'bg-gradient-to-b from-[#38bdf8]/25 via-[#0B1224] to-[#030611]',
    shadowSelected: 'shadow-[0_0_24px_rgba(56,189,248,0.45)]',
    badgeBg: 'bg-[#38bdf8]/20 border-[#38bdf8]/60',
    badgeText: 'text-[#38bdf8]',
    accentColor: '#38bdf8',
    shortRule: 'Crushes ✂️'
  },
  paper: {
    borderSelected: 'border-amber-400 ring-2 ring-amber-400/60',
    bgSelected: 'bg-gradient-to-b from-amber-400/25 via-[#0B1224] to-[#030611]',
    shadowSelected: 'shadow-[0_0_24px_rgba(251,191,36,0.45)]',
    badgeBg: 'bg-amber-400/20 border-amber-400/60',
    badgeText: 'text-amber-300',
    accentColor: '#f59e0b',
    shortRule: 'Covers 🪨'
  },
  scissors: {
    borderSelected: 'border-[#ff5f6d] ring-2 ring-[#ff5f6d]/60',
    bgSelected: 'bg-gradient-to-b from-[#ff5f6d]/25 via-[#0B1224] to-[#030611]',
    shadowSelected: 'shadow-[0_0_24px_rgba(255,95,109,0.45)]',
    badgeBg: 'bg-[#ff5f6d]/20 border-[#ff5f6d]/60',
    badgeText: 'text-[#ff5f6d]',
    accentColor: '#ff5f6d',
    shortRule: 'Cuts 📄'
  }
};

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
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider shadow-glow-cyan animate-pulse">
            <ShieldCheck size={13} />
            <span>✓ MOVE LOCKED IN • REVEALING AT 0s</span>
          </span>
        ) : phase === 'CHOOSING' ? (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Zap size={13} className="text-[#FF5F6D] animate-bounce" />
            <span>TAP A MOVE TO LOCK IN</span>
          </span>
        ) : null}

        {opponentLocked && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">
            <UserCheck size={12} />
            <span>OPPONENT: LOCKED</span>
          </span>
        )}
      </div>

      {/* 3 Interactive Move Controls */}
      <div
        role="radiogroup"
        aria-label="Rock Paper Scissors Move Selector"
        className="grid grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3 w-full"
      >
        {choices.map((key) => {
          const cfg = RPS_CHOICES[key];
          const theme = THEME_STYLES[key];
          const isSelected = playerChoice === key;
          const isOtherSelected = Boolean(playerChoice && playerChoice !== key);

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
              className={`relative px-1.5 py-2 sm:px-3 sm:py-3 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 sm:gap-1.5 group outline-none min-h-[58px] sm:min-h-[72px] md:min-h-[82px] touch-manipulation cursor-pointer ${
                isSelected
                  ? `${theme.borderSelected} ${theme.bgSelected} ${theme.shadowSelected} scale-[1.02] sm:scale-105 z-10`
                  : isOtherSelected
                  ? 'bg-[#0B1224]/60 border-white/5 opacity-40 grayscale-[20%] cursor-not-allowed scale-98'
                  : 'bg-[#0B1224]/85 hover:bg-[#111A30] border-white/10 hover:border-white/25 active:scale-95'
              }`}
            >
              {/* Selected Top Badge */}
              {isSelected && (
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full border text-[8px] sm:text-[9px] font-black font-mono tracking-widest flex items-center gap-1 uppercase ${theme.badgeBg} ${theme.badgeText} shadow-md`}>
                  <CheckCircle size={10} />
                  <span>LOCKED</span>
                </div>
              )}

              {/* Icon Visual */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform ${
                isSelected ? 'scale-110' : 'group-hover:scale-105'
              }`}>
                {key === 'rock' && <RockEmblem active={isSelected} />}
                {key === 'paper' && <PaperEmblem active={isSelected} />}
                {key === 'scissors' && <ScissorsEmblem active={isSelected} />}
              </div>

              {/* Title & Rule Subtext */}
              <div className="text-center w-full px-1">
                <span className={`text-[11px] sm:text-xs md:text-sm font-black font-display tracking-wider block uppercase leading-tight ${
                  isSelected ? 'text-white' : 'text-[#F8FAFC]'
                }`}>
                  {cfg.name}
                </span>
                <span className="text-[8px] sm:text-[9px] md:text-[10px] text-[#94A3B8] font-mono block leading-tight mt-0.5 truncate">
                  {isSelected ? (
                    <span className="text-emerald-400 font-bold">READY TO PLAY</span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">BEATS {cfg.beats.toUpperCase()}</span>
                      <span className="sm:hidden">{theme.shortRule}</span>
                    </>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
