import { RoomState, Player, PieceColor, LudoColor } from '../types/index.js';
import { GameManager } from '../services/GameManager.js';
import { LudoGameManager } from '../services/LudoGameManager.js';
import { RPSGameManager } from '../services/RPSGameManager.js';

export class RoomManager {
  private rooms: Map<
    string,
    { state: RoomState; gameManager: GameManager; ludoManager?: LudoGameManager; rpsManager?: RPSGameManager; disconnectInterval?: NodeJS.Timeout }
  > = new Map();

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(options?: {
    gameType?: 'chess' | 'ludo' | 'rps';
    maxPlayers?: number;
    timeControlSeconds?: number;
    incSeconds?: number;
    creatorName?: string;
    creatorAvatar?: string;
  }): { roomCode: string; roomState: RoomState } {
    const roomCode = this.generateRoomCode();
    const gameType = options?.gameType ?? 'chess';
    const maxPlayers = options?.maxPlayers ?? (gameType === 'ludo' ? 4 : 2);
    const timeControl = options?.timeControlSeconds ?? 600;
    const incSeconds = options?.incSeconds ?? 0;

    const initialRoomState: RoomState = {
      code: roomCode,
      createdAt: Date.now(),
      gameType,
      maxPlayers,
      timeControlSeconds: timeControl,
      incSeconds,
      whitePlayer: null,
      blackPlayer: null,
      ludoPlayers: { red: null, green: null, yellow: null, blue: null },
      spectators: [],
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moveHistory: [],
      capturedWhite: [],
      capturedBlack: [],
      status: 'waiting',
      turn: 'w',
      winner: null,
      isCheck: false,
      chatMessages: [
        {
          id: 'sys-init',
          senderId: 'system',
          senderName: 'System',
          text: `Welcome to FrostMate Royale (${gameType === 'ludo' ? `${maxPlayers}-Player Ludo` : gameType === 'rps' ? 'Rock Paper Scissors' : 'Chess'}) Room ${roomCode}! Share the code to invite opponents.`,
          timestamp: Date.now(),
          isSystem: true
        }
      ],
      countdown: 3
    };

    const gameManager = new GameManager(initialRoomState);
    const ludoManager = gameType === 'ludo' ? new LudoGameManager(initialRoomState, maxPlayers) : undefined;
    const rpsManager = gameType === 'rps' ? new RPSGameManager(initialRoomState, timeControl <= 20 ? timeControl : 5) : undefined;
    this.rooms.set(roomCode, { state: initialRoomState, gameManager, ludoManager, rpsManager });

    return { roomCode, roomState: initialRoomState };
  }

  public getRoom(roomCode: string) {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public addPlayer(
    roomCode: string,
    socketId: string,
    name: string,
    avatar: string,
    preferredColor?: 'w' | 'b' | 'random'
  ): { player: Player; role: 'player' | 'spectator'; roomState: RoomState } | null {
    const entry = this.getRoom(roomCode);
    if (!entry) return null;

    const { state } = entry;

    if (entry.disconnectInterval) {
      clearInterval(entry.disconnectInterval);
      entry.disconnectInterval = undefined;
      state.disconnectCountdown = undefined;
      state.disconnectedPlayerName = undefined;
    }

    if (state.gameType === 'ludo') {
      const activeColors: LudoColor[] = state.maxPlayers === 2 ? ['red', 'yellow'] : ['red', 'green', 'yellow', 'blue'];
      if (!state.ludoPlayers) state.ludoPlayers = { red: null, green: null, yellow: null, blue: null };

      // 1. Check for reconnecting / existing player by socket ID or name
      for (const col of activeColors) {
        const p = state.ludoPlayers[col];
        if (p && (p.id === socketId || (!p.connected && p.name === name))) {
          p.id = socketId;
          p.connected = true;
          return { player: p, role: 'player', roomState: state };
        }
      }

      // 2. Find unassigned color slot among active colors
      const assignedColor = activeColors.find((c) => !state.ludoPlayers![c]);
      if (assignedColor) {
        const player: Player = {
          id: socketId,
          name: name || `${assignedColor.toUpperCase()} Master`,
          avatar: avatar || '🎲',
          ludoColor: assignedColor,
          connected: true,
          timeRemainingMs: state.timeControlSeconds * 1000
        };
        state.ludoPlayers[assignedColor] = player;

        if (!state.whitePlayer) state.whitePlayer = player;
        else if (!state.blackPlayer) state.blackPlayer = player;

        return { player, role: 'player', roomState: state };
      }

      // 3. Fallback to spectator if room is full
      const specPlayer: Player = {
        id: socketId,
        name: name || 'Spectator',
        avatar: avatar || '👁️',
        connected: true,
        timeRemainingMs: 0
      };
      state.spectators = state.spectators.filter((s) => s.id !== socketId);
      state.spectators.push(specPlayer);
      return { player: specPlayer, role: 'spectator', roomState: state };
    }

    // Default Chess Color Assignment
    if (state.whitePlayer && (state.whitePlayer.id === socketId || (!state.whitePlayer.connected && state.whitePlayer.name === name))) {
      state.whitePlayer.id = socketId;
      state.whitePlayer.connected = true;
      return { player: state.whitePlayer, role: 'player', roomState: state };
    }
    if (state.blackPlayer && (state.blackPlayer.id === socketId || (!state.blackPlayer.connected && state.blackPlayer.name === name))) {
      state.blackPlayer.id = socketId;
      state.blackPlayer.connected = true;
      return { player: state.blackPlayer, role: 'player', roomState: state };
    }

    let assignedColor: PieceColor | undefined;
    if (!state.whitePlayer && !state.blackPlayer) {
      assignedColor = preferredColor === 'b' ? 'b' : preferredColor === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : 'w';
    } else if (!state.whitePlayer) {
      assignedColor = 'w';
    } else if (!state.blackPlayer) {
      assignedColor = 'b';
    }

    if (assignedColor) {
      const player: Player = {
        id: socketId,
        name: name || (assignedColor === 'w' ? 'White Master' : 'Black Grandmaster'),
        avatar: avatar || (assignedColor === 'w' ? '⚡' : '👑'),
        color: assignedColor,
        connected: true,
        timeRemainingMs: state.timeControlSeconds * 1000
      };

      if (assignedColor === 'w') state.whitePlayer = player;
      else state.blackPlayer = player;

      return { player, role: 'player', roomState: state };
    } else {
      const spectator = { id: socketId, name: name || 'Spectator' };
      state.spectators.push(spectator);
      return {
        player: { id: socketId, name: spectator.name, avatar: '👁️', connected: true, timeRemainingMs: 0 },
        role: 'spectator',
        roomState: state
      };
    }
  }

  public handleDisconnect(
    socketId: string,
    onTick?: (roomCode: string, roomState: RoomState) => void,
    onAbandon?: (roomCode: string, roomState: RoomState) => void
  ): { roomCode: string; roomState: RoomState } | null {
    for (const [code, entry] of this.rooms.entries()) {
      const { state, gameManager } = entry;
      let disconnectedName = 'Opponent';
      let disconnected = false;

      if (state.whitePlayer?.id === socketId) {
        state.whitePlayer.connected = false;
        disconnectedName = state.whitePlayer.name;
        disconnected = true;
      }
      if (state.blackPlayer?.id === socketId) {
        state.blackPlayer.connected = false;
        disconnectedName = state.blackPlayer.name;
        disconnected = true;
      }

      if (state.gameType === 'ludo' && state.ludoPlayers) {
        (Object.keys(state.ludoPlayers) as LudoColor[]).forEach((col) => {
          const p = state.ludoPlayers[col];
          if (p && p.id === socketId && p.connected) {
            p.connected = false;
            disconnectedName = p.name;
            disconnected = true;

            // Invalidate ALL tokens of the left candidate
            if (state.ludoState && state.ludoState.tokens[col]) {
              state.ludoState.tokens[col].forEach((tk) => {
                tk.step = -1;
              });
            }
            state.moveHistory.push({
              actionText: `🚪 ${disconnectedName} (${col.toUpperCase()}) left. Tokens invalidated.`,
              timestamp: Date.now()
            });
          }
        });
      }

      state.spectators = state.spectators.filter((s) => s.id !== socketId);

      if (disconnected) {
        if (state.status === 'waiting' || state.status === 'countdown') {
          if (state.gameType === 'ludo' && state.ludoPlayers) {
            (Object.keys(state.ludoPlayers) as LudoColor[]).forEach((col) => {
              if (state.ludoPlayers[col]?.id === socketId) {
                state.ludoPlayers[col] = null;
              }
            });
          }
          state.status = 'abandoned';
          state.winReason = `${disconnectedName} Left Room`;
          gameManager.stopTimer();
          if (entry.ludoManager) entry.ludoManager.stopTurnTimer();
          if (onAbandon) onAbandon(code, state);
          return { roomCode: code, roomState: state };
        }

        if (state.status === 'playing') {
          if (state.gameType === 'ludo') {
            const activeColors = state.ludoState?.activeColors || (state.maxPlayers === 2 ? ['red', 'yellow'] : ['red', 'green', 'yellow', 'blue']);
            const connectedColors = activeColors.filter((c) => state.ludoPlayers[c] && state.ludoPlayers[c]!.connected);

            if (connectedColors.length <= 1) {
              const winnerColor = connectedColors[0] || activeColors[0];
              state.status = 'abandoned';
              state.winner = winnerColor;
              if (state.ludoState) state.ludoState.winner = winnerColor;
              state.winReason = `${disconnectedName} Left Match`;
              if (entry.ludoManager) entry.ludoManager.stopTurnTimer();
              gameManager.stopTimer();
              if (onAbandon) onAbandon(code, state);
              return { roomCode: code, roomState: state };
            } else {
              // Skip turn if the active player disconnected
              if (state.ludoState && state.ludoState.currentTurn && !state.ludoPlayers[state.ludoState.currentTurn]?.connected) {
                if (entry.ludoManager) entry.ludoManager.nextTurn();
              }
              if (onTick) onTick(code, state);
              return { roomCode: code, roomState: state };
            }
          } else {
            const winnerColor = state.whitePlayer?.connected ? 'w' : 'b';
            state.status = 'abandoned';
            state.winner = winnerColor;
            state.winReason = `${disconnectedName} Left Match`;
            gameManager.stopTimer();
            if (onAbandon) onAbandon(code, state);
            return { roomCode: code, roomState: state };
          }
        }
      }
    }
    return null;
  }

  public removeRoom(roomCode: string) {
    const entry = this.getRoom(roomCode);
    if (entry) {
      if (entry.disconnectInterval) clearInterval(entry.disconnectInterval);
      entry.gameManager.stopTimer();
      this.rooms.delete(roomCode.toUpperCase());
    }
  }
}
