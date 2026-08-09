import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { Sparkles, Crown, Gamepad2 } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.js';
import { soundEngine } from '../../audio/soundEngine.js';

export const AnimeMeshIntro: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const setShowCreateModal = useGameStore((s) => s.setShowCreateModal);
  const setShowJoinModal = useGameStore((s) => s.setShowJoinModal);
  const setSelectedGameType = useGameStore((s) => s.setSelectedGameType);

  useEffect(() => {
    if (!gridRef.current) return;

    // Create 12x8 3D instanced mesh particles array
    const nodes = gridRef.current.querySelectorAll('.anime-mesh-node');
    if (!nodes.length) return;

    // Anime.js v4 3D Instanced Mesh Stagger Animation
    const anim = animate(nodes, {
      scale: [
        { value: 0.4, ease: 'outSine', duration: 500 },
        { value: 1.25, ease: 'inOutQuad', duration: 1200 },
        { value: 0.6, ease: 'inOutSine', duration: 1000 }
      ],
      translateY: [
        { value: -18, duration: 800, ease: 'inOutSine' },
        { value: 18, duration: 1200, ease: 'inOutSine' }
      ],
      rotateZ: [
        { value: -45, duration: 600 },
        { value: 45, duration: 1400 }
      ],
      opacity: [
        { value: 0.25, duration: 400 },
        { value: 0.9, duration: 1000 },
        { value: 0.3, duration: 800 }
      ],
      delay: stagger(25, { grid: [12, 8], from: 'center' }),
      loop: true,
      alternate: true,
      ease: 'inOutQuad'
    });

    return () => {
      anim.pause();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodes = gridRef.current.querySelectorAll('.anime-mesh-node');
    nodes.forEach((node) => {
      const el = node as HTMLElement;
      const nx = parseFloat(el.dataset.x || '0');
      const ny = parseFloat(el.dataset.y || '0');
      const dist = Math.hypot(x - nx, y - ny);
      if (dist < 120) {
        animate(el, {
          scale: 1.8,
          duration: 300,
          ease: 'outExpo'
        });
      }
    });
  };

  const handleQuickPlayLudo = () => {
    soundEngine.playClick();
    setSelectedGameType('ludo');
    setShowCreateModal(true);
  };

  const handleQuickPlayChess = () => {
    soundEngine.playClick();
    setSelectedGameType('chess');
    setShowCreateModal(true);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full max-w-6xl mx-auto my-4 p-6 sm:p-10 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden group select-none"
    >
      {/* 3D Instanced Mesh Background Grid Container */}
      <div
        ref={gridRef}
        className="absolute inset-0 grid grid-cols-12 grid-rows-8 gap-3 p-4 pointer-events-none opacity-60"
        style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
      >
        {Array.from({ length: 96 }).map((_, idx) => {
          const row = Math.floor(idx / 12);
          const col = idx % 12;
          const colors = [
            'bg-cyan-500 shadow-glow-cyan',
            'bg-amber-400 shadow-glow-gold',
            'bg-red-500 shadow-red-500/50',
            'bg-emerald-400 shadow-emerald-400/50'
          ];
          const colorClass = colors[(row + col) % colors.length];

          return (
            <div
              key={idx}
              data-x={col * 80}
              data-y={row * 50}
              className="flex items-center justify-center self-center justify-self-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className={`anime-mesh-node w-3 h-3 sm:w-4 sm:h-4 rounded-md border border-white/40 shadow-lg ${colorClass}`}
                style={{ transform: 'rotateX(45deg) rotateY(45deg)' }}
              />
            </div>
          );
        })}
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold tracking-wider uppercase shadow-glow-cyan">
            <Sparkles size={14} className="animate-spin text-cyan-300" style={{ animationDuration: '4s' }} />
            Anime.js 3D Mesh Engine Live
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow-md">
            FROSTMATE ROYALE
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
            Experience next-generation real-time 3D multiplayer board gaming powered by WebGL, Anime.js particle matrix physics, and Spider-Man Royale arenas.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              onClick={handleQuickPlayLudo}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-glow-gold transition-all active:scale-95"
            >
              <Gamepad2 size={16} /> Play Ludo Royale 🎲
            </button>
            <button
              onClick={handleQuickPlayChess}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-glow-cyan transition-all active:scale-95"
            >
              <Crown size={16} /> Play Chess Royale ♟️
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowJoinModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-lg transition-all active:scale-95"
            >
              Join Room Code
            </button>
          </div>
        </div>

        {/* Floating 3D Badge Graphic */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-500/30 via-purple-500/30 to-amber-500/30 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-slate-900/90 border border-white/20 flex flex-col items-center justify-center p-4 text-center shadow-2xl">
            <span className="text-4xl sm:text-5xl mb-1">🎲</span>
            <span className="text-xs font-black text-cyan-300 uppercase tracking-widest">3D INSTANCED</span>
            <span className="text-[10px] text-gray-400 font-mono">Anime.js Matrix</span>
          </div>
        </div>
      </div>
    </div>
  );
};
