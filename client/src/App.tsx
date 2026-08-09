import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore.js';
import { initSocketListeners } from './socket/socketClient.js';
import { AuroraBackground } from './components/background/AuroraBackground.js';
import { LauncherPage } from './pages/LauncherPage.js';
import { GamePage } from './pages/GamePage.js';
import { WaitingModal } from './components/modals/WaitingModal.js';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[React Error Boundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.href = window.location.origin;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center text-white bg-slate-950">
          <div className="p-8 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-red-500/30 shadow-2xl max-w-md space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-red-300">Application Error Guarded</h2>
            <p className="text-xs text-gray-400">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-glow-cyan"
            >
              Reload App & Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const viewMode = useGameStore((s) => s.viewMode);
  const setShowJoinModal = useGameStore((s) => s.setShowJoinModal);

  useEffect(() => {
    initSocketListeners();

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setShowJoinModal(true);
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-slate-950 font-sans selection:bg-cyan-500 selection:text-black">
        {/* WebGL Canvas Aurora Background */}
        <AuroraBackground />

        {/* Main Screen Views */}
        {viewMode === 'landing' && <LauncherPage />}
        {viewMode === 'waiting' && (
          <>
            <LauncherPage />
            <WaitingModal />
          </>
        )}
        {viewMode === 'game' && <GamePage />}
      </div>
    </ErrorBoundary>
  );
};

export default App;
