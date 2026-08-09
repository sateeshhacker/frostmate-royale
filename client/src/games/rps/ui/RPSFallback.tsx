import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { RPSChoice, RPS_CHOICES } from '../engine/RPSGameEngine.js';

interface RPSFallbackProps {
  playerChoice: RPSChoice | null;
  opponentChoice: RPSChoice | null;
}

export const RPSFallback: React.FC<RPSFallbackProps> = ({ playerChoice, opponentChoice }) => {
  return (
    <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center p-6 bg-[#070B18] rounded-2xl border border-[#FF5F6D]/20 text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF5F6D]/10 to-transparent pointer-events-none" />

      {playerChoice && opponentChoice ? (
        <div className="relative z-10 flex items-center justify-center gap-10">
          <div className="p-4 rounded-2xl bg-[#0B1224] border border-[#38bdf8]/40 text-center">
            <span className="text-5xl block">{RPS_CHOICES[playerChoice].code === 'rock' ? '🪨' : RPS_CHOICES[playerChoice].code === 'paper' ? '📄' : '✂️'}</span>
            <span className="text-xs font-mono font-bold text-[#38bdf8] mt-2 block">YOU</span>
          </div>

          <span className="text-xl font-black text-gray-500">VS</span>

          <div className="p-4 rounded-2xl bg-[#0B1224] border border-[#FF5F6D]/40 text-center">
            <span className="text-5xl block">{RPS_CHOICES[opponentChoice].code === 'rock' ? '🪨' : RPS_CHOICES[opponentChoice].code === 'paper' ? '📄' : '✂️'}</span>
            <span className="text-xs font-mono font-bold text-[#FF5F6D] mt-2 block">OPPONENT</span>
          </div>
        </div>
      ) : (
        <div className="relative z-10 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FF5F6D]/20 border border-[#FF5F6D]/30 flex items-center justify-center text-[#FF5F6D] mx-auto">
            <AlertTriangle size={20} />
          </div>
          <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
            WebGL 3D Arena Operating in 2D Performance Mode
          </h4>
          <p className="text-[11px] text-[#94A3B8] max-w-xs mx-auto">
            Your device is playing using optimized 2D controls.
          </p>
        </div>
      )}
    </div>
  );
};
