import { create } from 'zustand';
import { RoomState, PieceColor, ViewMode, AudioSettings, GameType } from '../types/index.js';
import { soundEngine } from '../games/shared/audio/soundEngine.js';
import { emitLeaveRoom } from '../socket/socketClient.js';

interface GameStoreState {
  roomState: RoomState | null;
  playerColor: PieceColor | null;
  userRole: 'player' | 'spectator' | null;
  viewMode: ViewMode;
  playerName: string;
  playerAvatar: string;
  socketConnected: boolean;
  selectedGameType: GameType;
  selectedMaxPlayers: number;
  rpsTargetPoints: number;
  
  // Modals
  showCreateModal: boolean;
  showJoinModal: boolean;
  showExportModal: boolean;
  lastError: string | null;

  // Audio Settings
  audioSettings: AudioSettings;

  // Actions
  setRoomState: (state: RoomState | null) => void;
  setPlayerColor: (color: PieceColor | null) => void;
  setUserRole: (role: 'player' | 'spectator' | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setPlayerName: (name: string) => void;
  setPlayerAvatar: (avatar: string) => void;
  setSocketConnected: (connected: boolean) => void;
  setSelectedGameType: (gameType: GameType) => void;
  setSelectedMaxPlayers: (count: number) => void;
  setRpsTargetPoints: (pts: number) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowJoinModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setLastError: (error: string | null) => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  resetGame: () => void;
}

const DEFAULT_AUDIO: AudioSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  isMuted: false,
  ambientMusicEnabled: true
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  roomState: null,
  playerColor: null,
  userRole: null,
  viewMode: 'landing',
  playerName: localStorage.getItem('fm_player_name') || 'Grandmaster',
  playerAvatar: localStorage.getItem('fm_player_avatar') || '⚡',
  socketConnected: false,
  selectedGameType: 'chess',
  selectedMaxPlayers: 2,
  rpsTargetPoints: 3,
  showCreateModal: false,
  showJoinModal: false,
  showExportModal: false,
  lastError: null,

  audioSettings: DEFAULT_AUDIO,

  setRoomState: (roomState) => set({ roomState }),
  setPlayerColor: (playerColor) => set({ playerColor }),
  setUserRole: (userRole) => set({ userRole }),
  setViewMode: (viewMode) => set({ viewMode }),
  setPlayerName: (playerName) => {
    localStorage.setItem('fm_player_name', playerName);
    set({ playerName });
  },
  setPlayerAvatar: (playerAvatar) => {
    localStorage.setItem('fm_player_avatar', playerAvatar);
    set({ playerAvatar });
  },
  setSocketConnected: (socketConnected) => set({ socketConnected }),
  setSelectedGameType: (selectedGameType) => set({ selectedGameType }),
  setSelectedMaxPlayers: (selectedMaxPlayers) => set({ selectedMaxPlayers }),
  setRpsTargetPoints: (rpsTargetPoints) => set({ rpsTargetPoints }),
  setShowCreateModal: (showCreateModal) => set({ showCreateModal }),
  setShowJoinModal: (showJoinModal) => set({ showJoinModal }),
  setShowExportModal: (showExportModal) => set({ showExportModal }),
  setLastError: (lastError) => set({ lastError }),

  updateAudioSettings: (newSettings) => {
    const updated = { ...get().audioSettings, ...newSettings };
    soundEngine.updateSettings(updated);
    set({ audioSettings: updated });
  },

  resetGame: () => {
    emitLeaveRoom();
    set({
      roomState: null,
      playerColor: null,
      userRole: null,
      viewMode: 'landing',
      showCreateModal: false,
      showJoinModal: false,
      showExportModal: false,
      lastError: null
    });
  }
}));
