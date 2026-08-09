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

export const GamePage: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!roomState) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950">
        <div className="p-8 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 shadow-2xl max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-2xl mx-auto">
            🎲
          </div>
          <h2 className="text-xl font-bold text-cyan-300">Room Completed or Expired</h2>
          <p className="text-xs text-gray-400">This game session has finished.</p>
          <button
            onClick={resetGame}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-glow-cyan"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    );
  }

  const isLudo = roomState.gameType === 'ludo';
  const isRPS = roomState.gameType === 'rps';

  return (
    <div className="relative h-screen max-h-screen w-screen max-w-full overflow-hidden flex flex-col justify-between p-2 sm:p-4 text-white z-10 select-none">
      <VictoryOverlay />
      <ExportModal />
      <DisconnectBanner />

      {/* Universal Main Board & Sidebar Layout (Clean, Uncluttered, No Top Navbar) */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full overflow-hidden my-auto">
        {/* Left Side: Game Board Container */}
        <div className="flex-1 min-h-0 h-full w-full flex flex-col items-center justify-center overflow-hidden">
          {!isLudo && !isRPS && <TopPlayerBar />}
          {isRPS ? <RPSGame /> : isLudo ? <GlassLudoBoard /> : <GlassChessboard />}
          {!isLudo && !isRPS && <BottomPlayerBar />}
        </div>

        {/* Right Side: Interactive Game Panel */}
        <div className="w-full lg:w-auto h-full max-h-full flex justify-center shrink-0 overflow-hidden">
          <RightSidebar />
        </div>
      </main>

      {/* Production Footer with Developer Name */}
      <footer className="w-full text-center py-1 text-xs font-mono font-bold text-gray-400 shrink-0">
        Developed by <span className="text-cyan-400">Sateesh</span> • FrostMate Royale © 2026
      </footer>
    </div>
  );
};
