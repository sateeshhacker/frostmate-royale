import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useGameStore } from '../../store/useGameStore.js';
import { MagneticButton } from '../ui/MagneticButton.js';
import { Copy, Check, Share2, QrCode, Loader2, X } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';
import { motion, AnimatePresence } from 'framer-motion';
import { LudoColor } from '../../types/index.js';
import { RenderAvatar } from '../ui/AvatarPack.js';

export const WaitingModal: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const viewMode = useGameStore((s) => s.viewMode);
  const resetGame = useGameStore((s) => s.resetGame);

  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const roomCode = roomState?.code || '';
  const inviteUrl = `${window.location.origin}?room=${roomCode}`;

  useEffect(() => {
    if (roomCode) {
      QRCode.toDataURL(inviteUrl, { margin: 1, width: 180, color: { dark: '#00f2fe', light: '#030712' } })
        .then((url) => setQrUrl(url))
        .catch(() => {});
    }
  }, [roomCode, inviteUrl]);

  if (viewMode !== 'waiting' || !roomState) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const isLudo = roomState.gameType === 'ludo';
  const maxPlayers = roomState.maxPlayers || (isLudo ? 4 : 2);
  const activeLudoColors: LudoColor[] = maxPlayers === 2 ? ['red', 'yellow'] : ['red', 'green', 'yellow', 'blue'];
  const joinedCount = isLudo
    ? Object.values(roomState.ludoPlayers || {}).filter(Boolean).length
    : (roomState.blackPlayer ? 2 : 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      {/* Match Countdown Overlay */}
      <AnimatePresence>
        {roomState.status === 'countdown' && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl text-center"
          >
            <motion.h2 className="text-2xl font-bold font-display text-cyan-300 mb-4">OPPONENTS CONNECTED!</motion.h2>
            <motion.div
              key={roomState.countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-white to-purple-400 drop-shadow-glow-cyan"
            >
              {roomState.countdown}
            </motion.div>
            <p className="text-gray-400 text-sm mt-4 font-semibold">Match starting in seconds...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl bg-slate-900/90 p-6 md:p-8 backdrop-blur-2xl border border-white/20 shadow-2xl text-white space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Waiting Room ({joinedCount}/{maxPlayers})</span>
          </div>
          <h2 className="text-2xl font-bold font-display tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300">
            Waiting for Players... ({joinedCount}/{maxPlayers})
          </h2>
        </div>

        {/* Player Status Cards */}
        {isLudo ? (
          <div className="grid grid-cols-2 gap-3">
            {activeLudoColors.map((color) => {
              const player = roomState.ludoPlayers?.[color];
              return (
                <div key={color} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center space-y-2">
                  {player ? (
                    <>
                      <RenderAvatar avatarId={player.avatar || 'av_alex'} className="w-11 h-11 rounded-2xl" size={20} />
                      <span className="font-bold text-xs text-white truncate max-w-[120px]">{player.name}</span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                        {color} Joined
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 animate-pulse">
                        <Loader2 className="animate-spin" size={18} />
                      </div>
                      <span className="font-bold text-xs text-gray-400 uppercase">{color} Slot</span>
                      <span className="text-[9px] font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                        Waiting...
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Player 1 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center space-y-2">
              <RenderAvatar avatarId={roomState.whitePlayer?.avatar || 'av_alex'} className="w-12 h-12 rounded-2xl" size={22} />
              <span className="font-bold text-sm text-white">{roomState.whitePlayer?.name || 'Player 1'}</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Ready
              </span>
            </div>

            {/* Player 2 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center space-y-2">
              {roomState.blackPlayer ? (
                <>
                  <RenderAvatar avatarId={roomState.blackPlayer.avatar || 'av_zoe'} className="w-12 h-12 rounded-2xl" size={22} />
                  <span className="font-bold text-sm text-white">{roomState.blackPlayer.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Joined
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 animate-pulse">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                  <span className="font-bold text-sm text-gray-400">Player Two</span>
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                    Waiting...
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Room Code Display Box */}
        <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 flex flex-col items-center space-y-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Share Room Code</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-extrabold tracking-widest text-cyan-300">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* QR Code Section with explicit Close (X) button */}
        {showQr && qrUrl && (
          <div className="relative flex flex-col items-center p-3.5 rounded-2xl bg-black/70 border border-cyan-400/30 space-y-2 shadow-inner">
            <button
              onClick={() => { setShowQr(false); soundEngine.playClick(); }}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
              title="Close QR Code"
            >
              <X size={14} />
            </button>
            <span className="text-xs font-bold text-cyan-300">Scan QR Code to Join</span>
            <img src={qrUrl} alt="Room QR Code" className="w-32 h-32 rounded-xl border border-cyan-400/40 shadow-md" />
            <span className="text-[11px] text-gray-400">Point phone camera to join match</span>
          </div>
        )}

        {/* Share Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <MagneticButton onClick={handleCopyLink} variant="glass" size="md">
            <Share2 size={16} />
            <span>Copy Link</span>
          </MagneticButton>

          <MagneticButton onClick={() => setShowQr(!showQr)} variant="glass" size="md">
            <QrCode size={16} />
            <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
          </MagneticButton>
        </div>

        {/* Cancel Button */}
        <div className="pt-2 text-center">
          <button
            onClick={resetGame}
            className="text-xs font-semibold text-gray-400 hover:text-red-400 transition-colors"
          >
            Leave Waiting Room
          </button>
        </div>
      </div>
    </div>
  );
};
