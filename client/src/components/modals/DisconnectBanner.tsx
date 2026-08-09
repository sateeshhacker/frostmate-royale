import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore.js';
import { WifiOff, Clock } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';

export const DisconnectBanner: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);

  const countdown = roomState?.disconnectCountdown;
  const disconnectedName = roomState?.disconnectedPlayerName || 'Opponent';

  useEffect(() => {
    if (countdown !== undefined && countdown > 0) {
      soundEngine.playTick();
    }
  }, [countdown]);

  if (countdown === undefined || roomState?.status !== 'playing') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg p-4"
      >
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-red-500/50 shadow-2xl shadow-red-500/20 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400 animate-pulse">
              <WifiOff size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-display text-red-400 uppercase tracking-wide">
                Opponent Disconnected!
              </h4>
              <p className="text-xs text-gray-300">
                Waiting for <span className="font-semibold text-white">{disconnectedName}</span> to reconnect...
              </p>
            </div>
          </div>

          {/* Live Countdown Timer Badge */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/20 border border-red-400/50 font-mono font-black text-lg text-red-300 shadow-glow-danger animate-pulse">
            <Clock size={16} />
            <span>{countdown}s</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
