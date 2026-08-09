import React from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { Player, PieceColor } from '../../types/index.js';
import { Clock, Loader2, Trophy } from 'lucide-react';
import { RenderAvatar } from '../ui/AvatarPack.js';

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

  if (!player) {
    return (
      <div className="relative flex items-center justify-between gap-3 p-2.5 px-4 rounded-2xl bg-[#0B1225]/80 border border-white/10 opacity-70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300 animate-pulse">
            <Loader2 className="animate-spin" size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold font-display text-xs text-[#8D9AB2]">WAITING FOR OPPONENT...</span>
              <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-cyan-300">
                {color === 'w' ? 'WHITE' : 'BLACK'}
              </span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono font-semibold">Share room code to invite player</span>
          </div>
        </div>
        <div className="px-3 py-1 rounded-xl border bg-black/40 border-white/10 font-mono font-bold text-xs text-[#8D9AB2] flex items-center gap-1.5">
          <Clock size={13} />
          <span>10:00</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-between gap-3 p-2.5 px-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
        isTurn
          ? 'bg-[#0B1225] border-cyan-400/80 shadow-glow-cyan ring-1 ring-cyan-400/40'
          : 'bg-[#0B1225]/80 border-white/10 opacity-85'
      }`}
    >
      {/* Active Turn Pulsing Side Bar Indicator */}
      {isTurn && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-full bg-cyan-400 shadow-glow-cyan animate-pulse" />
      )}

      {/* Avatar & Info Pod */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <RenderAvatar avatarId={player.avatar || (color === 'w' ? 'av_alex' : 'av_zoe')} className="w-9 h-9 rounded-xl" size={16} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B1225] ${
              player.connected ? 'bg-emerald-500' : 'bg-red-500 animate-ping'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold font-display text-xs text-[#F8FAFC] tracking-wide">{player.name}</span>
            <span className={`text-[9px] uppercase font-mono font-black px-1.5 py-0.2 rounded border ${
              color === 'w' ? 'bg-white/10 text-white border-white/20' : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
            }`}>
              {color === 'w' ? 'WHITE' : 'BLACK'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#8D9AB2] h-4">
            {captured.map((p, idx) => (
              <span key={idx} className="text-gray-300 font-mono text-[11px]">{PIECE_SYMBOLS[p] || p}</span>
            ))}
            {materialDiff > 0 && (
              <span className="text-emerald-400 font-mono font-black text-[10px] ml-1">+{materialDiff}</span>
            )}
          </div>
        </div>
      </div>

      {/* Digital Clock Display Pod */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs transition-all ${
          isLowTime
            ? 'bg-red-500/25 border-red-400/80 text-red-300 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
            : isTurn
            ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-glow-cyan'
            : 'bg-black/50 border-white/10 text-[#8D9AB2]'
        }`}
      >
        <Clock size={13} className={isTurn ? 'animate-spin text-cyan-300' : ''} />
        <span>{formatTime(player.timeRemainingMs ?? 600000)}</span>
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
    <div className="w-full max-w-[410px] mx-auto mb-1.5 shrink-0">
      <PlayerCard
        player={topPlayer}
        color={topColor}
        isTurn={roomState.turn === topColor && (roomState.status === 'playing' || roomState.status === 'waiting')}
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
    <div className="w-full max-w-[410px] mx-auto mt-1.5 shrink-0">
      <PlayerCard
        player={bottomPlayer}
        color={bottomColor}
        isTurn={roomState.turn === bottomColor && (roomState.status === 'playing' || roomState.status === 'waiting')}
        captured={bottomColor === 'w' ? roomState.capturedWhite : roomState.capturedBlack}
        materialDiff={bottomMaterialDiff}
      />
    </div>
  );
};
