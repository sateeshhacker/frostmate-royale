import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { animate, createTimer, stagger } from 'animejs';
import { getInstances } from 'animejs/adapters/three';
import { Sparkles, Crown, Gamepad2, Users } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.js';
import { soundEngine } from '../../audio/soundEngine.js';

export const AnimeThreeInstancedMeshIntro: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setShowCreateModal = useGameStore((s) => s.setShowCreateModal);
  const setShowJoinModal = useGameStore((s) => s.setShowJoinModal);
  const setSelectedGameType = useGameStore((s) => s.setSelectedGameType);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
    camera.position.set(0, 0, 1.6);
    scene.add(camera);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(2, 3, 4);
    scene.add(light);

    const gridSize = 6; // 6x6x6 = 216 cubes
    const cellSize = 2 / gridSize;
    const spread = ((gridSize - 1) / 2) * cellSize;
    const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
    const material = new THREE.MeshLambertMaterial();
    const mesh = new THREE.InstancedMesh(geometry, material, gridSize * gridSize * gridSize);
    scene.add(mesh);

    // Animation with Three.js adapter
    const instances = getInstances(mesh);
    const palette = ['#00f2fe', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#a855f7', '#ec4899'];
    const gridAxis = (axis: 'x' | 'y' | 'z', span = spread) =>
      stagger([-span, span], { grid: [gridSize, gridSize, gridSize], axis });

    // Slowly rotate the whole mesh
    const meshAnim = animate(mesh, {
      rotateY: 360,
      rotateX: 360,
      duration: 24000,
      loop: true,
      ease: 'linear'
    });

    // Color, scale and spread each instance, staggered from the center
    const instancesAnim = animate(instances, {
      color: palette,
      x: [gridAxis('x', spread * 0.25), gridAxis('x')],
      y: [gridAxis('y', spread * 0.25), gridAxis('y')],
      z: [gridAxis('z', spread * 0.25), gridAxis('z')],
      scale: [0.1, 0.25, 0.1],
      delay: stagger([0, 3000], { grid: [gridSize, gridSize, gridSize], from: 'center', reversed: true }),
      duration: 2000,
      loopDelay: 500,
      loop: true,
      alternate: true,
      ease: 'inOutQuad'
    });

    const timer = createTimer({
      onUpdate: () => {
        renderer.render(scene, camera);
      }
    });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      meshAnim.pause();
      instancesAnim.pause();
      timer.pause();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

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
    <div className="relative w-full max-w-6xl mx-auto my-4 min-h-[320px] sm:min-h-[360px] p-6 sm:p-10 rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden flex items-center select-none group">
      {/* Three.js WebGL InstancedMesh Canvas Container */}
      <div ref={containerRef} className="full-container absolute inset-0 w-full h-full pointer-events-none opacity-80 z-0" />

      {/* Foreground Hero Content Overlay */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
        <div className="space-y-3.5 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-extrabold tracking-wider uppercase shadow-glow-cyan">
            <Sparkles size={14} className="animate-spin text-cyan-300" style={{ animationDuration: '3s' }} />
            Three.js WebGL Instanced Mesh Live
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-lg">
            FROSTMATE ROYALE
          </h1>

          <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed drop-shadow">
            Experience 3D WebGL instanced particle mesh physics powered by Three.js & Anime.js. Enter real-time multiplayer Chess & Ludo Royale arenas.
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
              <Users size={14} /> Join Room Code
            </button>
          </div>
        </div>

        {/* 3D Instanced Mesh Card Badge */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-500/40 via-purple-500/40 to-pink-500/40 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-white/25 flex flex-col items-center justify-center p-4 text-center shadow-2xl">
            <span className="text-4xl sm:text-5xl mb-1">🧊</span>
            <span className="text-xs font-black text-cyan-300 uppercase tracking-widest">3D INSTANCED</span>
            <span className="text-[10px] text-pink-300 font-mono">Anime.js + Three.js</span>
          </div>
        </div>
      </div>
    </div>
  );
};
