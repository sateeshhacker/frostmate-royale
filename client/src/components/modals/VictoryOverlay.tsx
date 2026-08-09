import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore.js';
import { MagneticButton } from '../ui/MagneticButton.js';
import { emitRestartGame } from '../../socket/socketClient.js';
import { RefreshCw, Home, Loader2, LogOut } from 'lucide-react';
import { socket } from '../../socket/socketClient.js';

export const VictoryOverlay: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const playerColor = useGameStore((s) => s.playerColor);
  const resetGame = useGameStore((s) => s.resetGame);

  const [showOverlay, setShowOverlay] = useState(false);

  const isGameOver =
    roomState &&
    ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout', 'abandoned'].includes(roomState.status);

  const isLudo = roomState?.gameType === 'ludo';
  const myLudoColor = isLudo && roomState?.ludoPlayers
    ? Object.values(roomState.ludoPlayers).find((p) => p && p.id === socket.id)?.ludoColor
    : null;

  const isWinner = isLudo
    ? (roomState?.winner === myLudoColor || roomState?.ludoState?.winner === myLudoColor)
    : (roomState?.winner === playerColor);

  const isDraw = roomState?.winner === 'draw';
  const isOpponentLeft = roomState?.opponentLeft || roomState?.status === 'abandoned';
  const hasMyRematchRequest = roomState?.rematchRequestedBy?.includes(socket.id);

  useEffect(() => {
    if (isGameOver) {
      const timer = setTimeout(() => {
        setShowOverlay(true);

        if (isWinner || isDraw) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#00f2fe', '#ffd700', '#7f00ff', '#ffffff']
          });
        }
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
    }
  }, [isGameOver, isWinner, isDraw]);

  if (!isGameOver || !roomState || !showOverlay) return null;

  const winnerName = isLudo
    ? (roomState.winner ? `${String(roomState.winner).toUpperCase()} PLAYER` : 'Mutual Draw')
    : (roomState.winner === 'w' ? 'White Master' : roomState.winner === 'b' ? 'Black Grandmaster' : 'Mutual Draw');

  const handleRematchClick = () => {
    emitRestartGame();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative w-full max-w-md rounded-3xl bg-[#0B1225]/95 p-8 backdrop-blur-2xl border border-amber-400/50 shadow-glow-gold text-center space-y-6"
        >
          {/* Visual Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative inline-flex items-center justify-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-5xl shadow-glow-gold">
              {isOpponentLeft ? '🚪' : isDraw ? '🤝' : isWinner ? '👑' : '🛡️'}
            </div>
          </motion.div>

          {/* Title & Reason */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-1"
          >
            <h2 className="text-3xl font-black font-display tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-amber-500 drop-shadow-lg uppercase">
              {isOpponentLeft ? 'OPPONENT LEFT MATCH' : isDraw ? 'DRAW MATCH!' : isWinner ? 'ROYALE VICTORY!' : 'DEFEAT'}
            </h2>
            <p className="text-xs font-bold text-cyan-300 uppercase tracking-widest font-mono">
              {roomState.winReason || (isOpponentLeft ? 'Opponent left the room or disconnected' : 'Game Finished')}
            </p>
          </motion.div>

          {/* Match Info / Disconnect Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 text-left font-mono"
          >
            {isOpponentLeft ? (
              <div className="text-amber-300 font-semibold text-center space-y-1">
                <p>Opponent has left the game room.</p>
                <p className="text-gray-400 text-[11px]">Returning to home page is recommended.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-gray-400">
                  <span>Total Moves:</span>
                  <span className="font-bold text-white">{roomState.moveHistory.length}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Winner:</span>
                  <span className="font-bold text-amber-300">{winnerName}</span>
                </div>
              </>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-3 pt-2"
          >
            {!isOpponentLeft ? (
              <MagneticButton
                onClick={handleRematchClick}
                variant="gold"
                size="md"
                className={hasMyRematchRequest ? 'opacity-90' : ''}
              >
                {hasMyRematchRequest ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-amber-950" />
                    <span className="text-xs font-bold font-mono uppercase">Waiting...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    <span className="text-xs font-bold font-mono uppercase">Rematch</span>
                  </>
                )}
              </MagneticButton>
            ) : null}

            <MagneticButton
              onClick={resetGame}
              variant="primary"
              size="md"
              className={isOpponentLeft ? 'col-span-2' : ''}
            >
              <Home size={15} />
              <span className="text-xs font-bold font-mono uppercase">Return Home</span>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
