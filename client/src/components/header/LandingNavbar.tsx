import React, { useState } from 'react';
import { Menu, X, ArrowRight, Globe } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';

interface LandingNavbarProps {
  onPlayNow: () => void;
  onOpenJoin: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onPlayNow, onOpenJoin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'EN' | 'ES' | 'FR'>('EN');

  const handleNavClick = (sectionId: string) => {
    soundEngine.playClick();
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* 72px Sticky Dark Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] px-4 sm:px-8 bg-[#050816]/80 backdrop-blur-xl border-b border-white/10 flex items-center transition-all">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between">
          
          {/* Left: Brand Logo & Nav */}
          <div className="flex items-center gap-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-black text-sm group-hover:scale-105 transition-transform shadow-glow-cyan">
                ⚡
              </div>
              <span className="font-display font-black text-lg tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                GAMEPLAY
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-[13px] font-extrabold tracking-widest text-[#9AA7BD]">
              <button
                onClick={() => handleNavClick('selector-section')}
                className="hover:text-white transition-colors py-1 relative group"
              >
                <span>PLAYGROUND</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
              </button>

              <button
                onClick={() => handleNavClick('chess-section')}
                className="hover:text-white transition-colors py-1 relative group"
              >
                <span>ABOUT</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
              </button>

              <button
                onClick={() => handleNavClick('feature-strip')}
                className="hover:text-white transition-colors py-1 relative group"
              >
                <span>COMMUNITY</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all group-hover:w-full" />
              </button>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenJoin}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D1428] hover:bg-[#111A32] border border-white/10 text-xs font-bold text-cyan-300 transition-all active:scale-95"
            >
              ROOM CODE
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#9AA7BD] px-3 py-1.5 rounded-xl bg-[#0D1428] border border-white/10">
              <Globe size={13} className="text-[#9AA7BD]" />
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setLang((prev) => (prev === 'EN' ? 'ES' : prev === 'ES' ? 'FR' : 'EN'));
                }}
                className="hover:text-white uppercase transition-colors"
              >
                {lang}
              </button>
            </div>

            {/* Primary CTA Button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onPlayNow();
              }}
              className="group relative px-5 py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-[#050816] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow-cyan transition-all hover:scale-105 active:scale-95 overflow-hidden"
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
          <div className="md:hidden absolute top-[72px] left-0 right-0 p-6 bg-[#080D1F] border-b border-white/10 flex flex-col gap-4 text-sm font-bold text-[#9AA7BD]">
            <button onClick={() => handleNavClick('selector-section')} className="text-left py-1 hover:text-white">
              PLAYGROUND
            </button>
            <button onClick={() => handleNavClick('chess-section')} className="text-left py-1 hover:text-white">
              ABOUT
            </button>
            <button onClick={() => handleNavClick('feature-strip')} className="text-left py-1 hover:text-white">
              COMMUNITY
            </button>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenJoin();
                }}
                className="w-full py-2.5 rounded-xl bg-[#0D1428] text-cyan-300 border border-white/10 font-bold"
              >
                JOIN ROOM CODE
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky 64px Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-[64px] px-4 bg-[#050816]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between pb-safe">
        <span className="text-xs font-mono font-bold text-cyan-300 uppercase">FROSTMATE ROYALE</span>
        <button
          onClick={() => {
            soundEngine.playClick();
            onPlayNow();
          }}
          className="px-6 py-2.5 rounded-full bg-cyan-400 text-[#050816] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow-cyan active:scale-95"
        >
          <span>PLAY NOW</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
};
