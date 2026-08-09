import React from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { Player, PieceColor } from '../../types/index.js';
import { Clock } from 'lucide-react';

interface PlayerCardProps {
  player: Player | null;
  color: PieceColor;
  isTurn: boolean;
  captured: string[];
  materialDiff: number;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9
};

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛'
};

const formatTime = (ms: number): string => {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0 && sec < 10) {
    const tenths = Math.floor((ms % 1000) / 100);
    return `${sec}.${tenths}s`;
  }
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player, color, isTurn, captured, materialDiff }) => {
  const isLowTime = (player?.timeRemainingMs ?? 600000) < 30000;

  return (
    <div
      className={`relative flex items-center justify-between gap-3 p-2 px-4 rounded-xl backdrop-blur-xl border transition-all duration-300 ${
        isTurn
          ? 'bg-white/15 border-cyan-400/60 shadow-glow-cyan animate-glow-active'
          : 'bg-slate-900/60 border-white/10 opacity-75'
      }`}
    >
      {/* Active Turn Pulsing Side Bar */}
      {isTurn && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-cyan-400 shadow-glow-cyan animate-pulse" />
      )}

      {/* Avatar & Info */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 flex items-center justify-center text-base shadow-inner">
            {player?.avatar || (color === 'w' ? '⚡' : '👑')}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
              player?.connected ? 'bg-emerald-500' : 'bg-red-500 animate-ping'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold font-display text-xs text-white">
              {player?.name || (color === 'w' ? 'White Player' : 'Black Player')}
            </span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/10 text-cyan-300">
              {color === 'w' ? 'White' : 'Black'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-400 h-3.5">
            {captured.map((p, idx) => (
              <span key={idx} className="text-gray-300">{PIECE_SYMBOLS[p] || p}</span>
            ))}
            {materialDiff > 0 && (
              <span className="text-emerald-400 font-bold text-[10px] ml-1">+{materialDiff}</span>
            )}
          </div>
        </div>
      </div>

      {/* Clock Display */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono font-bold text-xs transition-colors ${
          isLowTime
            ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
            : isTurn
            ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
            : 'bg-black/40 border-white/10 text-gray-400'
        }`}
      >
        <Clock size={12} className={isTurn ? 'animate-spin' : ''} />
        <span>{formatTime(player?.timeRemainingMs ?? 600000)}</span>
      </div>
    </div>
  );
};

export const TopPlayerBar: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const playerColor = useGameStore((s) => s.playerColor);

  if (!roomState) return null;

  const isBlackPerspective = playerColor === 'b';
  const topColor: PieceColor = isBlackPerspective ? 'w' : 'b';
  const topPlayer = topColor === 'w' ? roomState.whitePlayer : roomState.blackPlayer;

  const whiteValue = roomState.capturedWhite.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
  const blackValue = roomState.capturedBlack.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);

  const topMaterialDiff = topColor === 'w' ? whiteValue - blackValue : blackValue - whiteValue;

  return (
    <div className="w-full max-w-[490px] mx-auto mb-1.5">
      <PlayerCard
        player={topPlayer}
        color={topColor}
        isTurn={roomState.turn === topColor && roomState.status === 'playing'}
        captured={topColor === 'w' ? roomState.capturedWhite : roomState.capturedBlack}
        materialDiff={topMaterialDiff}
      />
    </div>
  );
};

export const BottomPlayerBar: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const playerColor = useGameStore((s) => s.playerColor);

  if (!roomState) return null;

  const isBlackPerspective = playerColor === 'b';
  const bottomColor: PieceColor = isBlackPerspective ? 'b' : 'w';
  const bottomPlayer = bottomColor === 'w' ? roomState.whitePlayer : roomState.blackPlayer;

  const whiteValue = roomState.capturedWhite.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);
  const blackValue = roomState.capturedBlack.reduce((sum, p) => sum + (PIECE_VALUES[p] || 0), 0);

  const bottomMaterialDiff = bottomColor === 'w' ? whiteValue - blackValue : blackValue - whiteValue;

  return (
    <div className="w-full max-w-[490px] mx-auto mt-1.5">
      <PlayerCard
        player={bottomPlayer}
        color={bottomColor}
        isTurn={roomState.turn === bottomColor && roomState.status === 'playing'}
        captured={bottomColor === 'w' ? roomState.capturedWhite : roomState.capturedBlack}
        materialDiff={bottomMaterialDiff}
      />
    </div>
  );
};
