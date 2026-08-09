import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';

interface LandingNavbarProps {
  onPlayNow: () => void;
  onOpenJoin: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onPlayNow, onOpenJoin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 72px Sticky Dark Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] px-4 sm:px-8 bg-[#050816]/85 backdrop-blur-xl border-b border-white/10 flex items-center transition-all select-none">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between">
          
          {/* Left: Clean Brand Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group"
          >
            <span className="font-display font-black text-xl tracking-wider text-white group-hover:text-cyan-300 transition-colors">
              FROSTMATE ROYALE
            </span>
          </a>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenJoin}
              className="px-4 py-2 rounded-xl bg-[#0D1428] hover:bg-[#111A32] border border-white/15 text-xs font-mono font-bold text-cyan-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              JOIN ROOM
            </button>

            {/* Primary CTA Button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onPlayNow();
              }}
              className="group relative px-5 py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-[#050816] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow-cyan transition-all hover:scale-105 active:scale-95 overflow-hidden cursor-pointer"
            >
              <span>PLAY NOW</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden p-2 rounded-xl bg-[#0D1428] border border-white/10 text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 right-0 p-6 bg-[#080D1F] border-b border-white/10 flex flex-col gap-3 text-sm font-bold text-[#9AA7BD]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenJoin();
              }}
              className="w-full py-3 rounded-xl bg-[#0D1428] text-cyan-300 border border-white/10 font-mono font-bold"
            >
              JOIN ROOM
            </button>
          </div>
        )}
      </header>

      {/* Mobile Sticky 64px Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[64px] px-4 bg-[#050816]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between pb-safe select-none">
        <span className="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider">FROSTMATE ROYALE</span>
        <button
          onClick={() => {
            soundEngine.playClick();
            onPlayNow();
          }}
          className="px-6 py-2.5 rounded-full bg-cyan-400 text-[#050816] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow-cyan active:scale-95 cursor-pointer"
        >
          <span>PLAY NOW</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
};
