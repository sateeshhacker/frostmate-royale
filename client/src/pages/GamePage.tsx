import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { GlassChessboard } from '../components/board/GlassChessboard.js';
import { GlassLudoBoard } from '../components/board/GlassLudoBoard.js';
import { RPSGame } from '../games/rps/RPSGame.js';
import { TopPlayerBar, BottomPlayerBar } from '../components/header/TopPlayerBar.js';
import { RightSidebar } from '../components/sidebar/RightSidebar.js';
import { VictoryOverlay } from '../components/modals/VictoryOverlay.js';
import { ExportModal } from '../components/modals/ExportModal.js';
import { DisconnectBanner } from '../components/modals/DisconnectBanner.js';
import { Home, Copy, Check, ShieldAlert, Play, Users } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine.js';

export const GamePage: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const resetGame = useGameStore((s) => s.resetGame);
  const playerColor = useGameStore((s) => s.playerColor);
  const [codeCopied, setCodeCopied] = useState(false);

  if (!roomState) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center text-white bg-[#030611]">
        <div className="p-8 rounded-3xl bg-[#0B1225]/90 backdrop-blur-2xl border border-cyan-400/30 shadow-2xl max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl mx-auto text-cyan-300">
            ♟️
          </div>
          <h2 className="text-xl font-black font-display text-cyan-300 uppercase">Room Session Ended</h2>
          <p className="text-xs text-[#8D9AB2]">This game room has completed or expired.</p>
          <button
            onClick={resetGame}
            className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#030611] font-black text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-glow-cyan cursor-pointer"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    );
  }

  const isLudo = roomState.gameType === 'ludo';
  const isRPS = roomState.gameType === 'rps';

  const handleExitGame = () => {
    soundEngine.playClick();
    if (window.confirm('Exit match and return to the Home Page?')) {
      resetGame();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCodeCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Status Banner Badge Message
  const getStatusText = () => {
    if (roomState.status === 'checkmate') return `CHECKMATE! ${roomState.winner?.toUpperCase()} WINS!`;
    if (roomState.status === 'draw') return `MATCH DRAW (${roomState.winReason || 'Draw'})`;
    if (roomState.status === 'timeout') return `TIME EXPIRED! ${roomState.winner?.toUpperCase()} WINS!`;
    if (roomState.isCheck) return '⚠️ CHECK!';
    if (roomState.status === 'waiting') return 'WAITING FOR OPPONENT...';
    return `${roomState.turn === 'w' ? 'WHITE' : 'BLACK'} TO MOVE`;
  };

  return (
    <div className="relative h-screen max-h-screen w-screen max-w-full overflow-hidden flex flex-col justify-between p-2 sm:p-4 text-white z-10 select-none bg-[#030611]">
      <VictoryOverlay />
      <ExportModal />
      <DisconnectBanner />

      {/* 1. Header Control Bar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between px-3 py-2 rounded-2xl bg-[#0B1225]/85 border border-white/10 backdrop-blur-xl z-20 shrink-0 shadow-lg">
        {/* Left: Logo & Room Code Copy Badge */}
        <div className="flex items-center gap-3">
          <span className="font-display font-black text-sm sm:text-base tracking-wider text-white">
            FROSTMATE ROYALE
          </span>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Click to copy Room Code"
          >
            <span>ROOM: {roomState.code}</span>
            {codeCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Center: Live Match Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/15 text-xs font-mono font-bold">
          <span className={`w-2 h-2 rounded-full ${roomState.isCheck ? 'bg-red-500 animate-ping' : 'bg-cyan-400'}`} />
          <span className={roomState.isCheck ? 'text-red-400 font-black' : 'text-cyan-300'}>
            {getStatusText()}
          </span>
        </div>

        {/* Right: Exit to Home Action */}
        <button
          onClick={handleExitGame}
          className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-300 hover:text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Exit match and return to Home Page"
        >
          <Home size={14} />
          <span>EXIT TO HOME</span>
        </button>
      </header>

      {/* 2. Main Arena Stage & Sidebar Layout */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-center gap-4 max-w-7xl mx-auto w-full overflow-hidden my-auto py-2">
        {/* Left Side: Esports Game Board Arena */}
        <div className="flex-1 min-h-0 h-full w-full flex flex-col items-center justify-between overflow-hidden">
          {!isLudo && !isRPS && <TopPlayerBar />}
          {isRPS ? <RPSGame /> : isLudo ? <GlassLudoBoard /> : <GlassChessboard />}
          {!isLudo && !isRPS && <BottomPlayerBar />}
        </div>

        {/* Right Side: Interactive Match Console */}
        <div className="w-full lg:w-auto flex justify-center shrink-0">
          <RightSidebar />
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full text-center py-1 text-xs font-mono font-bold text-[#8D9AB2] shrink-0 border-t border-white/5">
        Developed by <span className="text-cyan-400 font-extrabold">Sateesh</span> • FrostMate Royale © 2026
      </footer>
    </div>
  );
};
