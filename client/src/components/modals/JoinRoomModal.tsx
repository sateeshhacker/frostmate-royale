import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.js';
import { MagneticButton } from '../ui/MagneticButton.js';
import { useGameStore } from '../../store/useGameStore.js';
import { emitJoinRoom } from '../../socket/socketClient.js';
import { LogIn, Clipboard, History } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';

export const JoinRoomModal: React.FC = () => {
  const isOpen = useGameStore((s) => s.showJoinModal);
  const onClose = () => useGameStore.getState().setShowJoinModal(false);
  const lastError = useGameStore((s) => s.lastError);
  const setLastError = useGameStore((s) => s.setLastError);

  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const playerAvatar = useGameStore((s) => s.playerAvatar);
  const setPlayerAvatar = useGameStore((s) => s.setPlayerAvatar);

  const [roomCode, setRoomCode] = useState('');
  const [recentRooms, setRecentRooms] = useState<string[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem('fm_recent_rooms');
    if (cached) {
      try {
        setRecentRooms(JSON.parse(cached));
      } catch (e) {}
    }

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room')?.trim().toUpperCase();
    if (roomParam) {
      const cleanCode = roomParam.substring(0, 6);
      setRoomCode(cleanCode);
    }
  }, [isOpen]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Strip trailing URL parameters if full link was pasted
        const clean = text.trim().toUpperCase().replace(/.*ROOM=/, '').substring(0, 6);
        setRoomCode(clean);
        soundEngine.playClick();
      }
    } catch (e) {}
  };

  const handleJoin = (codeToJoin?: string) => {
    const code = (codeToJoin || roomCode).trim().toUpperCase();
    if (!code || code.length < 6) {
      setLastError('Please enter a valid 6-character room code.');
      soundEngine.playCheck();
      return;
    }

    setLastError(null);

    // Save to recent rooms
    const updated = [code, ...recentRooms.filter((c) => c !== code)].slice(0, 4);
    setRecentRooms(updated);
    localStorage.setItem('fm_recent_rooms', JSON.stringify(updated));

    emitJoinRoom(code);
  };

  const AVATARS = ['👑', '⚡', '🔥', '🐉', '❄️', '🎯', '🦁', '🚀'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Room">
      <div className="space-y-5">
        {/* Name & Avatar Customization */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Your Player Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 mb-2"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setPlayerAvatar(av)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg transition-all ${
                  playerAvatar === av
                    ? 'bg-purple-500/30 border-purple-400 scale-105 shadow-glow-purple'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Room Code Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Enter 6-Character Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. 9GK4PL"
              className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 font-mono font-bold text-center text-lg tracking-widest text-cyan-300 uppercase focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <Clipboard size={14} />
              <span>Paste</span>
            </button>
          </div>
        </div>

        {/* Validation Error Banner */}
        {lastError && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-xs text-red-300 animate-bounce">
            {lastError}
          </div>
        )}

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
              <History size={12} />
              <span>Recent Rooms</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {recentRooms.map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setRoomCode(code);
                    handleJoin(code);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 font-mono text-xs font-bold text-gray-300 hover:text-cyan-300 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Join Action */}
        <div className="pt-2">
          <MagneticButton onClick={() => handleJoin()} variant="secondary" size="lg" className="w-full">
            <LogIn size={18} />
            <span>Join Room Now</span>
          </MagneticButton>
        </div>
      </div>
    </Modal>
  );
};
