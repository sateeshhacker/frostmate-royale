import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import {
  emitSendChat,
  emitRequestDraw,
  emitRequestUndo,
  emitResign,
  emitRespondDraw,
  emitRespondUndo,
  socket
} from '../../socket/socketClient.js';
import { MessageSquare, ScrollText, Settings, Flag, RefreshCw, Volume2, VolumeX, Music, Download, Send, UserCheck, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton.js';
import { soundEngine } from '../../audio/soundEngine.js';

export const RightSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'actions' | 'settings'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const roomState = useGameStore((s) => s.roomState);
  const userRole = useGameStore((s) => s.userRole);
  const audioSettings = useGameStore((s) => s.audioSettings);
  const updateAudioSettings = useGameStore((s) => s.updateAudioSettings);
  const setShowExportModal = useGameStore((s) => s.setShowExportModal);

  const isLudo = roomState?.gameType === 'ludo';
  const isRPS = roomState?.gameType === 'rps';

  const isOpponentDrawOffer = roomState?.pendingDrawOfferFrom && roomState.pendingDrawOfferFrom !== socket.id;
  const isOpponentUndoRequest = roomState?.pendingUndoOfferFrom && roomState.pendingUndoOfferFrom !== socket.id;
  const isPendingAction = isOpponentDrawOffer || isOpponentUndoRequest;

  // Auto-switch to Actions tab & Auto-Expand when opponent offers a draw or requests an undo!
  useEffect(() => {
    if (isPendingAction) {
      setActiveTab('actions');
      setIsMinimized(false);
      soundEngine.playTick();
    }
  }, [isPendingAction]);

  useEffect(() => {
    if ((isLudo || isRPS) && (activeTab === 'history' || activeTab === 'actions')) {
      setActiveTab('chat');
    }
  }, [isLudo, isRPS, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomState?.chatMessages.length]);

  const handleOfferDraw = () => {
    soundEngine.playClick();
    if (!roomState || roomState.moveHistory.length === 0) {
      setLocalNotice('⚠️ Cannot offer draw: No moves have been played yet!');
      setTimeout(() => setLocalNotice(null), 3500);
      return;
    }
    emitRequestDraw();
  };

  const handleRequestUndo = () => {
    soundEngine.playClick();
    if (!roomState || roomState.moveHistory.length === 0) {
      setLocalNotice('⚠️ Cannot request undo: No moves have been played yet!');
      setTimeout(() => setLocalNotice(null), 3500);
      return;
    }
    emitRequestUndo();
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    emitSendChat(chatInput);
    setChatInput('');
  };

  const handleTabChange = (tab: 'chat' | 'history' | 'actions' | 'settings') => {
    soundEngine.playClick();
    setActiveTab(tab);
  };

  const QUICK_EMOJIS = ['👍', '🔥', '👑', '😮', '👏', '🎯', '⚡'];

  const tabs = (isLudo || isRPS)
    ? [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'settings', label: 'Audio', icon: Settings }
      ]
    : [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'history', label: 'Moves', icon: ScrollText },
        { id: 'actions', label: 'Actions', icon: UserCheck },
        { id: 'settings', label: 'Audio', icon: Settings }
      ];

  // Minimized Pill Bar with Live Action Alerts
  if (isMinimized) {
    return (
      <div
        className={`w-full lg:w-80 xl:w-96 p-2 px-4 rounded-full backdrop-blur-2xl border shadow-xl flex items-center justify-between gap-3 shrink-0 self-start transition-all ${
          isPendingAction
            ? 'bg-amber-500/25 border-amber-400 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]'
            : 'bg-[#0B1225]/90 border-cyan-400/30'
        }`}
      >
        <div className="flex items-center gap-2 text-cyan-300 overflow-hidden">
          <MessageSquare size={14} className="shrink-0" />
          {isPendingAction ? (
            <span className="text-xs font-mono font-bold text-amber-300 truncate animate-pulse">
              {isOpponentDrawOffer ? '🤝 DRAW OFFERED!' : '↩️ UNDO REQUESTED!'}
            </span>
          ) : (
            <>
              <span className="text-xs font-mono font-bold text-white tracking-wider truncate">
                {roomState?.lastActionNotice || 'LIVE CHAT'}
              </span>
              {roomState && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30 font-mono font-bold shrink-0">
                  {roomState.chatMessages.filter((m) => !m.isSystem).length} msgs
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={() => {
            setIsMinimized(false);
            if (isPendingAction) setActiveTab('actions');
            soundEngine.playClick();
          }}
          className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-sm ${
            isPendingAction
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold shadow-glow-gold'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
          }`}
        >
          <Maximize2 size={12} />
          <span>{isPendingAction ? 'VIEW REQUEST' : 'EXPAND PANEL'}</span>
        </button>
      </div>
    );
  }

  // Expanded Panel with Dynamic Viewport Height (Auto-Scales on Ctrl+ / Ctrl-)
  return (
    <div className="w-full lg:w-80 xl:w-96 flex flex-col h-[clamp(300px,76dvh,580px)] rounded-2xl sm:rounded-3xl bg-[#0B1225]/90 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden shrink-0 transition-all">
      {/* Sidebar Navigation Tabs & Minimize Button */}
      <div className="flex items-center justify-between border-b border-white/10 p-1.5 bg-black/20 shrink-0">
        <div className="flex flex-1 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-cyan-300 border border-cyan-400/30 shadow-glass-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Minimize Button */}
        <button
          onClick={() => { setIsMinimized(true); soundEngine.playClick(); }}
          title="Minimize Sidebar"
          className="ml-1 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <Minimize2 size={13} />
        </button>
      </div>

      {/* Tab Contents Container with Scroll Boundaries */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar flex flex-col">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full justify-between gap-2 min-h-0">
            {/* Scrollable Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {roomState?.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isSystem ? 'items-center my-1.5' : 'items-start'}`}
                >
                  {msg.isSystem ? (
                    <span className="text-[10px] text-cyan-400/80 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-500/20 italic">
                      {msg.text}
                    </span>
                  ) : (
                    <div className="max-w-[85%] rounded-2xl bg-white/5 border border-white/10 p-2 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-cyan-300">{msg.senderName}</span>
                        <span className="text-[9px] text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 leading-normal">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Emojis & Chat Input Bar */}
            <div className="pt-2 border-t border-white/10 space-y-1.5 shrink-0">
              <div className="flex gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      emitSendChat(emoji);
                      soundEngine.playClick();
                    }}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs transition-transform hover:scale-110 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-transform active:scale-95 cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Move History Tab */}
        {activeTab === 'history' && (
          <div className="flex flex-col h-full min-h-0 justify-between gap-3">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 shrink-0">Move Log</h4>
            {roomState?.moveHistory.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-6 flex-1">No moves made yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {Array.from({ length: Math.ceil((roomState?.moveHistory.length || 0) / 2) }).map((_, i) => {
                  const whiteMove = roomState?.moveHistory[i * 2];
                  const blackMove = roomState?.moveHistory[i * 2 + 1];
                  return (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-cyan-400/60 font-bold text-[10px]">{i + 1}.</span>
                        <span className="text-white font-semibold">{whiteMove?.san}</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-gray-300 font-semibold">{blackMove?.san || ''}</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="pt-2 border-t border-white/10 shrink-0">
              <MagneticButton
                onClick={() => setShowExportModal(true)}
                variant="glass"
                size="sm"
                className="w-full"
              >
                <Download size={13} />
                <span>Export PGN / FEN</span>
              </MagneticButton>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-3 text-xs overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {/* Validation Notice Card */}
            {(localNotice || roomState?.lastActionNotice) && (
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-cyan-400" />
                <span>{localNotice || roomState?.lastActionNotice}</span>
              </div>
            )}

            {/* Draw Offer Card */}
            {roomState?.pendingDrawOfferFrom && (
              roomState.pendingDrawOfferFrom === socket.id ? (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-semibold font-mono text-center text-xs">
                  🤝 Draw Offered — Waiting for opponent response...
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 space-y-1.5">
                  <p className="font-semibold text-amber-300 font-mono">🤝 Draw Offered by opponent!</p>
                  <div className="flex gap-2">
                    <MagneticButton onClick={() => emitRespondDraw(true)} variant="gold" size="sm" className="flex-1">
                      Accept
                    </MagneticButton>
                    <MagneticButton onClick={() => emitRespondDraw(false)} variant="glass" size="sm" className="flex-1">
                      Decline
                    </MagneticButton>
                  </div>
                </div>
              )
            )}

            {/* Undo Request Card */}
            {roomState?.pendingUndoOfferFrom && (
              roomState.pendingUndoOfferFrom === socket.id ? (
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 font-semibold font-mono text-center text-xs">
                  ↩️ Undo Requested — Waiting for opponent response...
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/40 space-y-1.5">
                  <p className="font-semibold text-purple-300 font-mono">↩️ Undo Move Requested!</p>
                  <div className="flex gap-2">
                    <MagneticButton onClick={() => emitRespondUndo(true)} variant="secondary" size="sm" className="flex-1">
                      Allow
                    </MagneticButton>
                    <MagneticButton onClick={() => emitRespondUndo(false)} variant="glass" size="sm" className="flex-1">
                      Refuse
                    </MagneticButton>
                  </div>
                </div>
              )
            )}

            {userRole === 'player' && (roomState?.status === 'playing' || roomState?.status === 'waiting') && (
              <div className="space-y-2">
                <MagneticButton onClick={handleOfferDraw} variant="glass" size="sm" className="w-full justify-start">
                  <RefreshCw size={13} />
                  <span>Offer Draw</span>
                </MagneticButton>

                <MagneticButton onClick={handleRequestUndo} variant="glass" size="sm" className="w-full justify-start">
                  <ScrollText size={13} />
                  <span>Request Undo</span>
                </MagneticButton>

                <MagneticButton onClick={() => emitResign()} variant="danger" size="sm" className="w-full justify-start mt-2">
                  <Flag size={13} />
                  <span>Resign Match</span>
                </MagneticButton>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 space-y-1.5">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase">Spectators ({roomState?.spectators.length || 0})</h5>
              {roomState?.spectators.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic">No spectators currently.</p>
              ) : (
                <div className="space-y-1">
                  {roomState?.spectators.map((spec) => (
                    <div key={spec.id} className="text-xs text-gray-300 flex items-center gap-1.5 p-1 rounded-lg bg-white/5">
                      <span>👁️</span>
                      <span>{spec.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs text-gray-300 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                {audioSettings.isMuted ? <VolumeX className="text-red-400" size={15} /> : <Volume2 className="text-cyan-400" size={15} />}
                <span className="font-semibold text-white">Master Audio</span>
              </div>
              <button
                onClick={() => updateAudioSettings({ isMuted: !audioSettings.isMuted })}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                  audioSettings.isMuted ? 'bg-red-500/30 text-red-300 border border-red-400/40' : 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                }`}
              >
                {audioSettings.isMuted ? 'Muted' : 'Active'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Music className="text-purple-400" size={15} />
                <span className="font-semibold text-white">Aurora Ambient Music</span>
              </div>
              <button
                onClick={() => updateAudioSettings({ ambientMusicEnabled: !audioSettings.ambientMusicEnabled })}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                  audioSettings.ambientMusicEnabled ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {audioSettings.ambientMusicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>SFX Volume</span>
                  <span>{Math.round(audioSettings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.sfxVolume}
                  onChange={(e) => updateAudioSettings({ sfxVolume: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Music Volume</span>
                  <span>{Math.round(audioSettings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.musicVolume}
                  onChange={(e) => updateAudioSettings({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full accent-purple-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
