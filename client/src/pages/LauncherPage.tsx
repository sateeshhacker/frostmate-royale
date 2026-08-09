import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import { useHeroState, GameId } from '../hooks/useHeroState.js';
import { LandingNavbar } from '../components/header/LandingNavbar.js';
import { Hero3DCanvas } from '../components/intro/Hero3DCanvas.js';
import { GameSelectorCards } from '../components/intro/GameSelectorCards.js';
import { CreateRoomModal } from '../components/modals/CreateRoomModal.js';
import { JoinRoomModal } from '../components/modals/JoinRoomModal.js';
import { ArrowRight, Cpu, Radio, Layers, Code2 } from 'lucide-react';
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

      {/* 1. Header */}
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
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[120px]" />
          </div>
        )}

        {/* Ambient Gradient Masks */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#030611] via-[#030611]/60 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030611] via-[#030611]/80 to-transparent pointer-events-none z-10" />

        {/* Top Hero Text */}
        <div className="relative z-20 max-w-2xl space-y-3 pt-4">
          <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-[#F8FAFC] uppercase leading-none">
            PLAY FREE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-white to-[#8B5CF6]">
              REAL-TIME ARENAS.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#8D9AB2] max-w-lg font-medium">
            Experience high-performance multiplayer gaming built with Three.js 3D WebGL visuals, sub-20ms Socket.io synchronization, and cinematic battle animations.
          </p>
        </div>

        {/* Bottom Hero Game Selector Controls */}
        <div className="relative z-20 grid grid-cols-3 gap-3 max-w-xl pb-2">
          {/* Game 1: CHESS */}
          <button
            type="button"
            onMouseEnter={() => handleHoverGame('chess')}
            onClick={() => handleLaunchGameModal('chess')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 ${
              activeGame === 'chess'
                ? 'bg-[#22D3EE]/20 border-[#22D3EE] shadow-glow-cyan'
                : 'bg-[#0B1225]/80 hover:bg-[#0B1225] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-[#22D3EE]">01</span>
              <span className="text-xs font-bold font-mono text-[#22D3EE]">CHESS</span>
            </div>
            <div className="mt-1">
              <span className="text-xs font-black font-display uppercase block text-[#F8FAFC]">STRATEGY & TACTICS</span>
              <span className="text-[10px] text-[#8D9AB2] hidden sm:block">Timed Clocks • FEN Validated</span>
            </div>
          </button>

          {/* Game 2: LUDO */}
          <button
            type="button"
            onMouseEnter={() => handleHoverGame('ludo')}
            onClick={() => handleLaunchGameModal('ludo')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 ${
              activeGame === 'ludo'
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                : 'bg-[#0B1225]/80 hover:bg-[#0B1225] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-[#8B5CF6]">02</span>
              <span className="text-xs font-bold font-mono text-[#8B5CF6]">LUDO</span>
            </div>
            <div className="mt-1">
              <span className="text-xs font-black font-display uppercase block text-[#F8FAFC]">DICE & BOARD</span>
              <span className="text-[10px] text-[#8D9AB2] hidden sm:block">Token Racing • Physics Dice</span>
            </div>
          </button>

          {/* Game 3: RPS */}
          <button
            type="button"
            onMouseEnter={() => handleHoverGame('rps')}
            onClick={() => handleLaunchGameModal('rps')}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 ${
              activeGame === 'rps'
                ? 'bg-[#FF6672]/20 border-[#FF6672] shadow-[0_0_20px_rgba(255,102,114,0.18)]'
                : 'bg-[#0B1225]/80 hover:bg-[#0B1225] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-[#FF6672]">03</span>
              <span className="text-xs font-bold font-mono text-[#FF6672]">RPS</span>
            </div>
            <div className="mt-1">
              <span className="text-xs font-black font-display uppercase block text-[#F8FAFC]">3D BATTLE ARENA</span>
              <span className="text-[10px] text-[#8D9AB2] hidden sm:block">Cinematic Slow-Motion Trailer</span>
            </div>
          </button>
        </div>
      </section>

      {/* =========================================================
          3. GAME SELECTOR CARDS
          ========================================================= */}
      <GameSelectorCards
        activeGame={activeGame}
        onHoverGame={(id) => handleHoverGame(id)}
        onSelectGame={(id) => handleLaunchGameModal(id)}
      />

      {/* =========================================================
          4. HOW IT WAS CREATED & REAL-TIME MULTIPLAYER ARCHITECTURE
          ========================================================= */}
      <section className="w-full py-16 px-4 sm:px-8 max-w-[1440px] mx-auto z-10 relative">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest">
            <Cpu size={14} />
            <span>ARCHITECTURE & TECH STACK</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display uppercase text-[#F8FAFC] tracking-tight">
            HOW FROSTMATE ROYALE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400">
              WAS CREATED & CONNECTED
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-[#8D9AB2] max-w-2xl mx-auto">
            Built from the ground up to combine 3D WebGL graphics with a low-latency WebSocket network engine.
          </p>
        </div>

        {/* Tech Stack Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Card 1: Tech Stack */}
          <div className="p-6 rounded-3xl bg-[#0B1225]/90 border border-white/10 space-y-4 hover:border-cyan-400/50 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Code2 size={24} />
            </div>
            <h3 className="text-lg font-black font-display text-white uppercase tracking-wider">
              1. TECHNOLOGY STACK
            </h3>
            <ul className="text-xs text-[#8D9AB2] space-y-2 font-mono">
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Frontend UI</span>
                <strong className="text-white">React 18 + Vite + TS</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>3D WebGL Graphics</span>
                <strong className="text-cyan-300">Three.js Engine</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>3D Animations</span>
                <strong className="text-purple-300">Anime.js Choreography</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>State & Styling</span>
                <strong className="text-white">Zustand + TailwindCSS</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Chess Engine</span>
                <strong className="text-amber-300">chess.js FEN Rules</strong>
              </li>
            </ul>
          </div>

          {/* Card 2: Real-Time WebSockets */}
          <div className="p-6 rounded-3xl bg-[#0B1225]/90 border border-white/10 space-y-4 hover:border-purple-400/50 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Radio size={24} />
            </div>
            <h3 className="text-lg font-black font-display text-white uppercase tracking-wider">
              2. REAL-TIME SOCKETS
            </h3>
            <ul className="text-xs text-[#8D9AB2] space-y-2 font-mono">
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Backend Host</span>
                <strong className="text-white">Node.js + Express</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Protocol</span>
                <strong className="text-purple-300">Socket.io WebSockets</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Latency</span>
                <strong className="text-emerald-400">&lt; 20ms Global Sync</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Room System</span>
                <strong className="text-white">6-Character Unique Codes</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Security</span>
                <strong className="text-rose-400">Authoritative Server Guard</strong>
              </li>
            </ul>
          </div>

          {/* Card 3: 3D Battle Arena */}
          <div className="p-6 rounded-3xl bg-[#0B1225]/90 border border-white/10 space-y-4 hover:border-rose-400/50 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-black font-display text-white uppercase tracking-wider">
              3. CINEMATIC 3D ARENA
            </h3>
            <ul className="text-xs text-[#8D9AB2] space-y-2 font-mono">
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>3D Models</span>
                <strong className="text-white">Custom 3D Mesh Assets</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Lighting System</span>
                <strong className="text-rose-300">Dynamic Atmospheric Rims</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Cinematic Sequences</span>
                <strong className="text-white">9-Phase Trailer Motion</strong>
              </li>
              <li className="flex items-center justify-between border-b border-white/5 pb-1">
                <span>Zero-Gravity Physics</span>
                <strong className="text-[#38bdf8]">Fragment Particles</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Performance</span>
                <strong className="text-emerald-400">60 FPS Shader Pre-Compile</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* 3-Step Real-Time Connection Workflow */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0B1225] via-[#070B18] to-[#0B1225] border border-cyan-400/30 shadow-2xl">
          <h3 className="text-center text-xl sm:text-2xl font-black font-display text-white uppercase tracking-wider mb-8">
            HOW PLAYERS CONNECT IN REAL TIME (3-STEP WORKFLOW)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-cyan-400/20 border border-cyan-400 text-cyan-300 font-mono font-black text-sm flex items-center justify-center mx-auto shadow-glow-cyan">
                01
              </div>
              <h4 className="text-sm font-black font-display text-white uppercase tracking-wider">
                1. INSTANT ROOM HANDSHAKE
              </h4>
              <p className="text-xs text-[#8D9AB2] leading-relaxed">
                Player 1 creates a room (e.g. <code className="text-cyan-300">C5I-SHA</code>). The Node.js server binds a dedicated WebSocket channel for the two players.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-purple-400/20 border border-purple-400 text-purple-300 font-mono font-black text-sm flex items-center justify-center mx-auto">
                02
              </div>
              <h4 className="text-sm font-black font-display text-white uppercase tracking-wider">
                2. AUTHORITATIVE SERVER VALIDATION
              </h4>
              <p className="text-xs text-[#8D9AB2] leading-relaxed">
                Every move or card selection is sent over TCP WebSockets to the server. Rules are validated server-side to eliminate cheating and desync.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-400/20 border border-emerald-400 text-emerald-300 font-mono font-black text-sm flex items-center justify-center mx-auto">
                03
              </div>
              <h4 className="text-sm font-black font-display text-white uppercase tracking-wider">
                3. SUB-20MS STATE BROADCASTING
              </h4>
              <p className="text-xs text-[#8D9AB2] leading-relaxed">
                The updated game state (FEN board, turn clock, 3D battle results) is broadcast back to both players in &lt;20ms for instant synchronization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          5. QUICK FEATURE STRIP
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
          6. FINAL CTA
          ========================================================= */}
      <section className="relative py-16 px-4 sm:px-8 max-w-[1440px] mx-auto text-center z-10">
        <div className="relative rounded-2xl p-8 sm:p-12 bg-[#0B1225] border border-[#22D3EE]/30 shadow-2xl max-w-3xl mx-auto space-y-4 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#22D3EE]/15 blur-[100px] pointer-events-none" />

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
              className="group px-8 py-4 rounded-full bg-[#22D3EE] hover:bg-cyan-300 text-[#030611] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-glow-cyan hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
