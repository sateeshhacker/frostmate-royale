import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import { useHeroState, GameId } from '../hooks/useHeroState.js';
import { LandingNavbar } from '../components/header/LandingNavbar.js';
import { Hero3DCanvas } from '../components/intro/Hero3DCanvas.js';
import { GameSelectorCards } from '../components/intro/GameSelectorCards.js';
import { CreateRoomModal } from '../components/modals/CreateRoomModal.js';
import { JoinRoomModal } from '../components/modals/JoinRoomModal.js';
import { ArrowRight, Sparkles, Play, AlertTriangle } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine.js';

export const LauncherPage: React.FC = () => {
  const setShowCreateModal = useGameStore((s) => s.setShowCreateModal);
  const setShowJoinModal = useGameStore((s) => s.setShowJoinModal);
  const setSelectedGameType = useGameStore((s) => s.setSelectedGameType);

  // Central State Machine Controller Hook
  const {
    focusState,
    activeGame,
    pointer,
    reducedMotion,
    webGLAvailable,
    handleHoverGame,
    handleSelectGame
  } = useHeroState();

  const handleLaunchGameModal = (game: GameId) => {
    handleSelectGame(game, () => {
      setSelectedGameType(game);
      setShowCreateModal(true);
    });
  };

  const handleOpenJoin = () => {
    soundEngine.playClick();
    setShowJoinModal(true);
  };

  return (
    <div className="relative min-h-screen bg-[#030611] text-[#F8FAFC] selection:bg-[#22D3EE] selection:text-black overflow-x-hidden font-sans custom-scrollbar">
      <CreateRoomModal />
      <JoinRoomModal />

      {/* 1. Header (72px Sticky Dark Glass Surface) */}
      <LandingNavbar
        onPlayNow={() => handleLaunchGameModal(activeGame)}
        onOpenJoin={handleOpenJoin}
      />

      {/* =========================================================
          2. HERO + VIEWPORT GAME SELECTOR (100SVH FIRST SCREEN)
          ========================================================= */}
      <section className="relative h-[calc(100svh-72px)] min-h-[640px] flex flex-col justify-between pt-20 pb-4 px-4 sm:px-8 max-w-[1440px] mx-auto z-10 overflow-hidden">
        
        {/* WebGL 3D Studio Canvas or WebGL Fallback */}
        {webGLAvailable ? (
          <Hero3DCanvas
            activeGame={activeGame}
            focusState={focusState}
            pointer={pointer}
            reducedMotion={reducedMotion}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#050816] text-center z-0">
            <div className="p-6 rounded-2xl bg-[#0B1225] border border-amber-500/30 max-w-sm space-y-3">
              <AlertTriangle className="mx-auto text-amber-400" size={32} />
              <h3 className="text-sm font-bold text-white uppercase">WebGL Accelerated Graphics Paused</h3>
              <p className="text-xs text-[#8D9AB2]">Showing simplified 2D interactive gaming interface.</p>
            </div>
          </div>
        )}

        {/* Hero Top Content Grid */}
        <div className="relative z-10 my-auto py-2 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline & Immediate Play-First CTAs */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 200ms: Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1225] border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-mono font-bold tracking-widest uppercase shadow-glow-cyan"
            >
              <Sparkles size={13} className="text-[#22D3EE] animate-pulse" />
              <span>THE UNIFIED GAMING UNIVERSE</span>
            </motion.div>

            {/* 350-650ms: Staggered Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-5xl sm:text-7xl xl:text-8xl font-black font-display tracking-tighter uppercase leading-[0.9] text-[#F8FAFC]"
            >
              PLAY YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#F8FAFC] to-[#8B5CF6]">
                MOVE.
              </span>
            </motion.h1>

            {/* 800ms: Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xs sm:text-base text-[#8D9AB2] font-medium max-w-lg leading-relaxed"
            >
              Three games. Three ways to play. Challenge your strategy, test your luck, and prove your instinct — all in one arena.
            </motion.p>

            {/* 950ms: Primary CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <button
                onClick={() => handleLaunchGameModal(activeGame)}
                className="group px-7 py-3 rounded-full bg-[#22D3EE] hover:bg-cyan-300 text-[#030611] font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-glow-cyan hover:scale-105 active:scale-95 transition-all"
              >
                <span>PLAY NOW</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  document.getElementById('selector-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-full bg-[#0B1225] hover:bg-[#111A31] border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span>EXPLORE GAMES →</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Space reserved for 3D Studio Canvas */}
          <div className="lg:col-span-5 hidden lg:block h-[340px]" />
        </div>

        {/* =========================================================
            FIRST VIEWPORT INTEGRATED GAME SELECTOR TABS
            ========================================================= */}
        <div className="relative z-10 pt-3 border-t border-white/10 grid grid-cols-3 gap-3 shrink-0">
          
          {/* Tab 01 — CHESS (Violet Accent) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              handleHoverGame('chess');
            }}
            className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between border outline-none ${
              activeGame === 'chess'
                ? 'bg-[#111A31] border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.22)]'
                : 'bg-[#0B1225]/80 hover:bg-[#0B1225] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-[#8B5CF6]">01 CHESS</span>
              <span className="text-base">♟️</span>
            </div>
            <div className="mt-1">
              <span className="text-xs font-black font-display uppercase block text-[#F8FAFC]">THINK AHEAD</span>
              <span className="text-[10px] text-[#8D9AB2] hidden sm:block">Strategy • Patience • Precision</span>
            </div>
          </button>

          {/* Tab 02 — LUDO (Lime Accent) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              handleHoverGame('ludo');
            }}
            className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between border outline-none ${
              activeGame === 'ludo'
                ? 'bg-[#111A31] border-[#D9F84A] shadow-[0_0_20px_rgba(217,248,74,0.18)]'
                : 'bg-[#0B1225]/80 hover:bg-[#0B1225] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-[#D9F84A]">02 LUDO</span>
              <span className="text-base">🎲</span>
            </div>
            <div className="mt-1">
              <span className="text-xs font-black font-display uppercase block text-[#F8FAFC]">ROLL THE DICE</span>
              <span className="text-[10px] text-[#8D9AB2] hidden sm:block">Luck • Chaos • Competition</span>
            </div>
          </button>

          {/* Tab 03 — RPS (Coral Accent) */}
          <button
            onClick={() => {
              soundEngine.playClick();
              handleHoverGame('rps');
            }}
            className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between border outline-none ${
              activeGame === 'rps'
                ? 'bg-[#111A31] border-[#FF6672] shadow-[0_0_20px_rgba(255,102,114,0.18)]'
                : 'bg-[#0B1225]/80 hover:bg-[#0B1225] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-[#FF6672]">03 RPS</span>
              <span className="text-base">✂️</span>
            </div>
            <div className="mt-1">
              <span className="text-xs font-black font-display uppercase block text-[#F8FAFC]">TRUST YOUR INSTINCT</span>
              <span className="text-[10px] text-[#8D9AB2] hidden sm:block">Fast • Simple • Unpredictable</span>
            </div>
          </button>
        </div>
      </section>

      {/* =========================================================
          3. COMPACT GAME SELECTOR CARDS
          ========================================================= */}
      <GameSelectorCards
        activeGame={activeGame}
        onHoverGame={(id) => handleHoverGame(id)}
        onSelectGame={(id) => handleLaunchGameModal(id)}
      />

      {/* =========================================================
          4. QUICK FEATURE STRIP (100-140PX HEIGHT)
          ========================================================= */}
      <section id="feature-strip" className="w-full bg-[#080D1F] border-y border-white/10 py-8 px-4 z-10 relative">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-around gap-6 text-xs font-mono font-bold tracking-widest text-[#8D9AB2] uppercase">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
            <span>REAL-TIME MULTIPLAYER</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span>ROOM CODES</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9F84A]" />
            <span>INSTANT MATCHES</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6672]" />
            <span>CROSS-DEVICE PLAY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
            <span>PLAY WITH FRIENDS</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          5. COMPACT FINAL CTA (350-450PX HEIGHT)
          ========================================================= */}
      <section className="relative py-16 px-4 sm:px-8 max-w-[1440px] mx-auto text-center z-10">
        <div className="relative rounded-2xl p-8 sm:p-12 bg-[#0B1225] border border-[#22D3EE]/30 shadow-2xl max-w-3xl mx-auto space-y-4 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#22D3EE]/15 blur-[100px] pointer-events-none" />

          <span className="text-[11px] font-mono uppercase tracking-widest text-[#22D3EE] font-bold">
            // ARE YOU READY?
          </span>

          <h2 className="text-3xl sm:text-5xl font-black font-display uppercase tracking-tight text-[#F8FAFC]">
            WHAT'S YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#F8FAFC] to-[#8B5CF6]">
              MOVE?
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-[#8D9AB2] font-medium max-w-md mx-auto">
            Pick a game. Make your move. Play again. Join players in real-time multiplayer arenas.
          </p>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => handleLaunchGameModal(activeGame)}
              className="group px-8 py-4 rounded-full bg-[#22D3EE] hover:bg-cyan-300 text-[#030611] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow-cyan hover:scale-105 active:scale-95 transition-all"
            >
              <span>PLAY NOW →</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-[1440px] mx-auto py-5 px-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8D9AB2] gap-4 z-10">
        <span>Developed by <strong className="text-cyan-400 font-extrabold">Sateesh</strong> • FrostMate Royale © 2026.</span>
        <div className="flex items-center gap-4 text-[#8D9AB2] font-bold uppercase tracking-wider text-[11px]">
          <span>Chess</span>
          <span>•</span>
          <span>Ludo</span>
          <span>•</span>
          <span>Rock Paper Scissors</span>
        </div>
      </footer>
    </div>
  );
};
