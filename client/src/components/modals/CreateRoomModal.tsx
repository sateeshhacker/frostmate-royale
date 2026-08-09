import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.js';
import { MagneticButton } from '../ui/MagneticButton.js';
import { useGameStore } from '../../store/useGameStore.js';
import { emitCreateRoom } from '../../socket/socketClient.js';
import { Sparkles, Clock, Crown, Dices, Users } from 'lucide-react';
import { GameType } from '../../types/index.js';

export const CreateRoomModal: React.FC = () => {
  const isOpen = useGameStore((s) => s.showCreateModal);
  const onClose = () => useGameStore.getState().setShowCreateModal(false);

  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const playerAvatar = useGameStore((s) => s.playerAvatar);
  const setPlayerAvatar = useGameStore((s) => s.setPlayerAvatar);

  const selectedGameType = useGameStore((s) => s.selectedGameType);
  const setSelectedMaxPlayers = useGameStore((s) => s.setSelectedMaxPlayers);

  const rpsTargetPoints = useGameStore((s) => s.rpsTargetPoints);
  const setRpsTargetPoints = useGameStore((s) => s.setRpsTargetPoints);

  const [gameType, setGameType] = useState<GameType>('chess');
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [timeControl, setTimeControl] = useState<number>(600);
  const [incSeconds, setIncSeconds] = useState<number>(0);
  const [preferredColor, setPreferredColor] = useState<'w' | 'b' | 'random'>('w');

  useEffect(() => {
    if (selectedGameType) {
      setGameType(selectedGameType);
      if (selectedGameType === 'ludo') {
        setMaxPlayers(4);
        setSelectedMaxPlayers(4);
      } else {
        setMaxPlayers(2);
        setSelectedMaxPlayers(2);
      }
    }
  }, [selectedGameType, isOpen]);

  const AVATARS = ['⚡', '👑', '🔥', '🐉', '❄️', '🎯', '🦁', '🚀'];

  const handleSelectMaxPlayers = (count: number) => {
    setMaxPlayers(count);
    setSelectedMaxPlayers(count);
  };

  const handleCreate = () => {
    const tc = gameType === 'rps' ? rpsTargetPoints : timeControl;
    emitCreateRoom(tc, incSeconds, preferredColor, gameType, maxPlayers);
  };

  const handleSelectGameType = (type: GameType) => {
    setGameType(type);
    if (type === 'ludo') {
      setMaxPlayers(4);
      setSelectedMaxPlayers(4);
    } else {
      setMaxPlayers(2);
      setSelectedMaxPlayers(2);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Royale Room">
      <div className="space-y-4">
        {/* Game Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Select Game Mode</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectGameType('chess')}
              className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                gameType === 'chess'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Crown size={14} />
              <span>Chess</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectGameType('ludo')}
              className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                gameType === 'ludo'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-glow-gold'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Dices size={14} />
              <span>Ludo</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectGameType('rps')}
              className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                gameType === 'rps'
                  ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-glow-cyan'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <span>✂️</span>
              <span>RPS</span>
            </button>
          </div>
        </div>

        {/* Ludo Player Count Selector */}
        {gameType === 'ludo' && (
          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
              <Users size={14} />
              <span>Select Ludo Players</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectMaxPlayers(2)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  maxPlayers === 2
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-glow-gold'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                👥 2 Players
              </button>

              <button
                type="button"
                onClick={() => handleSelectMaxPlayers(4)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  maxPlayers === 4
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-glow-gold'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                👥👥 4 Players
              </button>
            </div>
          </div>
        )}

        {/* Name & Avatar Customization */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Player Name & Avatar</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 mb-2"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setPlayerAvatar(av)}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm transition-all ${
                  playerAvatar === av
                    ? 'bg-cyan-500/30 border-cyan-400 scale-105 shadow-glow-cyan'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Target Points for RPS OR Time Control for Chess/Ludo */}
        {gameType === 'rps' ? (
          <div>
            <label className="block text-xs font-semibold text-pink-300 mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-pink-400" />
              <span>Target Points (First to Win)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '3 Points', pts: 3 },
                { label: '5 Points', pts: 5 },
                { label: '10 Points', pts: 10 }
              ].map((tp) => (
                <button
                  key={tp.pts}
                  type="button"
                  onClick={() => setRpsTargetPoints(tp.pts)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    rpsTargetPoints === tp.pts
                      ? 'bg-pink-500/25 border-pink-400 text-pink-300 shadow-glow-cyan font-bold'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-cyan-400" />
              <span>Time Control</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '3 Min', sec: 180 },
                { label: '5 Min', sec: 300 },
                { label: '10 Min', sec: 600 }
              ].map((tc) => (
                <button
                  key={tc.sec}
                  type="button"
                  onClick={() => setTimeControl(tc.sec)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    timeControl === tc.sec
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create Action Button */}
        <div className="pt-2">
          <MagneticButton
            onClick={handleCreate}
            variant={gameType === 'ludo' ? 'gold' : 'primary'}
            size="md"
            className="w-full"
          >
            <Sparkles size={16} />
            <span>
              Create {gameType === 'ludo' ? `${maxPlayers}-Player Ludo` : gameType === 'rps' ? 'Rock Paper Scissors' : 'Chess'} Room
            </span>
          </MagneticButton>
        </div>
      </div>
    </Modal>
  );
};
