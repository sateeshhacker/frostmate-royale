import React from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { GlassChessboard } from '../components/board/GlassChessboard.js';
import { GlassLudoBoard } from '../components/board/GlassLudoBoard.js';
import { RPSGame } from '../games/rps/RPSGame.js';
import { TopPlayerBar, BottomPlayerBar } from '../components/header/TopPlayerBar.js';
import { RightSidebar } from '../components/sidebar/RightSidebar.js';
import { VictoryOverlay } from '../components/modals/VictoryOverlay.js';
import { ExportModal } from '../components/modals/ExportModal.js';
import { DisconnectBanner } from '../components/modals/DisconnectBanner.js';
import { LogOut, Copy, Check, Eye } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine.js';

export const GamePage: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const userRole = useGameStore((s) => s.userRole);
  const resetGame = useGameStore((s) => s.resetGame);

  const [copied, setCopied] = React.useState(false);

  if (!roomState) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950">
        <div className="p-8 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl mx-auto">
            🎲
          </div>
          <h2 className="text-xl font-bold text-cyan-300">Room Not Found or Expired</h2>
          <p className="text-xs text-gray-400">This game room is no longer active or the server has restarted.</p>
          <button
            onClick={resetGame}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-glow-cyan"
          >
            Return to Home Launcher
          </button>
        </div>
      </div>
    );
  }

  const isLudo = roomState.gameType === 'ludo';
  const isRPS = roomState.gameType === 'rps';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative h-screen max-h-screen w-screen max-w-full overflow-hidden flex flex-col justify-between p-2 sm:p-4 text-white z-10 select-none">
      <VictoryOverlay />
      <ExportModal />
      <DisconnectBanner />

      {/* Universal Top Navbar */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto py-1 px-3 sm:px-4 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-white/15 shadow-lg mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center font-bold text-xs shadow-glow-cyan">
            {isRPS ? '✂️' : isLudo ? '🎲' : '👑'}
          </div>
          <span className="font-display font-black text-xs tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 hidden sm:inline">
            FROSTMATE ROYALE — {isRPS ? 'ROCK PAPER SCISSORS ROYALE' : isLudo ? 'LUDO ROYALE' : 'CHESS ROYALE'}
          </span>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-[11px] font-mono font-bold text-cyan-300 transition-colors"
          >
            <span>ROOM: {roomState.code}</span>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>

          {userRole === 'spectator' && (
            <span className="flex items-center gap-1 text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Eye size={10} />
              <span>Spectating</span>
            </span>
          )}
        </div>

        {/* Leave Game */}
        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/30 text-gray-400 hover:text-red-300 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </header>

      {/* Universal Main Board & Sidebar Layout (Zero Vertical Overflow) */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Left Side: Game Board Container */}
        <div className="flex-1 min-h-0 h-full w-full flex flex-col items-center justify-center overflow-hidden">
          {!isLudo && !isRPS && <TopPlayerBar />}
          {isRPS ? <RPSGame /> : isLudo ? <GlassLudoBoard /> : <GlassChessboard />}
          {!isLudo && !isRPS && <BottomPlayerBar />}
        </div>

        {/* Right Side: Interactive Sidebar */}
        <div className="w-full lg:w-auto h-full max-h-full flex justify-center shrink-0 overflow-hidden">
          <RightSidebar />
        </div>
      </main>
    </div>
  );
};
