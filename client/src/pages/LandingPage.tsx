import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import { MagneticButton } from '../components/ui/MagneticButton.jsx';
import { GlassCard } from '../components/ui/GlassCard.js';
import { CreateRoomModal } from '../components/modals/CreateRoomModal.js';
import { JoinRoomModal } from '../components/modals/JoinRoomModal.js';
import { Sparkles, Users, Zap, Crown, Globe, Volume2 } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine.js';

export const LandingPage: React.FC = () => {
  const setShowCreateModal = useGameStore((s) => s.setShowCreateModal);
  const setShowJoinModal = useGameStore((s) => s.setShowJoinModal);

  const handleOpenCreate = () => {
    soundEngine.playClick();
    setShowCreateModal(true);
  };

  const handleOpenJoin = () => {
    soundEngine.playClick();
    setShowJoinModal(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 md:p-8 overflow-y-auto text-white z-10 custom-scrollbar">
      <CreateRoomModal />
      <JoinRoomModal />

      {/* Top Header Navigation */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-purple-600 flex items-center justify-center shadow-glow-cyan text-lg">
            👑
          </div>
          <span className="font-display font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-400">
            FROSTMATE ROYALE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => soundEngine.playMove()}
            className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300 transition-all flex items-center gap-2"
          >
            <Volume2 size={13} className="text-cyan-400" />
            <span>Audio Active</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto py-6 sm:py-10 space-y-6 md:space-y-8 my-auto">
        
        {/* AAA Title Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-glow-cyan"
        >
          <Sparkles size={13} />
          <span>VisionOS AAA Real-Time Chess Engine</span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="space-y-3"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-2xl">
            FrostMate Royale
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-light leading-relaxed">
            Experience real-time multiplayer chess inside a floating VisionOS glass arena.
            Dynamic WebGL Aurora background lights, physical micro-interactions, and instant match pairing.
          </p>
        </motion.div>

        {/* CTA Hero Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2"
        >
          <MagneticButton onClick={handleOpenCreate} variant="primary" size="md" className="w-full sm:w-auto min-w-[200px]">
            <Crown size={18} />
            <span>Create Royale Room</span>
          </MagneticButton>

          <MagneticButton onClick={handleOpenJoin} variant="secondary" size="md" className="w-full sm:w-auto min-w-[200px]">
            <Users size={18} />
            <span>Join Room Code</span>
          </MagneticButton>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 w-full pt-4 text-left"
        >
          <GlassCard className="p-4 sm:p-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-3 shadow-glow-cyan">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-1">Real-Time Sync</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Socket.IO powered zero-latency move updates with automatic reconnect grace timers and live clocks.
            </p>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 mb-3 shadow-glow-purple">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-1">VisionOS Glass Arena</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Floating 3D perspective glass chessboard with procedural Web Audio sound synthesis and responsive dynamic lighting.
            </p>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 shadow-glow-gold">
              <Globe size={20} />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-1">Instant Room Sharing</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Generate 6-character room codes, direct invite links, or instant QR codes without mandatory sign-up.
            </p>
          </GlassCard>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto py-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2 shrink-0">
        <span>FrostMate Royale © 2026. Built with React 19, Socket.IO & WebGL Canvas Aurora.</span>
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold">VisionOS Dark Glass Edition</span>
        </div>
      </footer>
    </div>
  );
};
