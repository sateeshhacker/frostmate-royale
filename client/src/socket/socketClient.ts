import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore.js';
import { soundEngine } from '../audio/soundEngine.js';
import { RoomState, MoveRecord, LudoColor } from '../types/index.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:4000`;

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export function initSocketListeners() {

  socket.on('connect', () => {
    console.log('[SocketClient] Connected with ID:', socket.id);
    useGameStore.getState().setSocketConnected(true);
  });

  socket.on('disconnect', () => {
    console.log('[SocketClient] Disconnected');
    useGameStore.getState().setSocketConnected(false);
  });

  socket.on('error_message', (msg: string) => {
    useGameStore.getState().setLastError(msg);
  });

  socket.on('room_created', (data: { roomCode: string; playerColor: 'w' | 'b'; roomState: RoomState }) => {
    const s = useGameStore.getState();
    s.setRoomState(data.roomState);
    s.setPlayerColor(data.playerColor);
    s.setUserRole('player');
    s.setShowCreateModal(false);
    s.setViewMode('waiting');
    soundEngine.playClick();
  });

  socket.on('room_joined', (data: { roomCode: string; playerColor?: 'w' | 'b'; role: 'player' | 'spectator'; roomState: RoomState }) => {
    const s = useGameStore.getState();
    s.setRoomState(data.roomState);
    if (data.playerColor) s.setPlayerColor(data.playerColor);
    s.setUserRole(data.role);
    s.setShowJoinModal(false);

    if (data.roomState.status === 'playing') {
      s.setViewMode('game');
    } else {
      s.setViewMode('waiting');
    }
    soundEngine.playClick();
  });

  socket.on('room_state_updated', (updatedState: RoomState) => {
    const s = useGameStore.getState();
    s.setRoomState(updatedState);

    if (updatedState.status === 'playing' && s.viewMode === 'waiting') {
      s.setViewMode('game');
    }
  });

  socket.on('countdown_tick', (count: number) => {
    soundEngine.playTick();
  });

  socket.on('game_started', () => {
    const s = useGameStore.getState();
    s.setViewMode('game');
    soundEngine.playCastle();
  });

  socket.on('move_made', (data: { move: MoveRecord; roomState: RoomState; soundType: 'move' | 'capture' | 'check' | 'checkmate' }) => {
    useGameStore.getState().setRoomState(data.roomState);

    if (data.soundType === 'checkmate') soundEngine.playCheckmate();
    else if (data.soundType === 'check') soundEngine.playCheck();
    else if (data.soundType === 'capture') soundEngine.playCapture();
    else soundEngine.playMove();
  });

  socket.on('ludo_dice_rolled', (data: { diceValue: number; canMoveTokens: number[]; roomState: RoomState }) => {
    useGameStore.getState().setRoomState(data.roomState);
    soundEngine.playMove();
  });

  socket.on('ludo_token_moved', (data: { color: LudoColor; tokenId: number; captured?: boolean; roomState: RoomState }) => {
    useGameStore.getState().setRoomState(data.roomState);
    if (data.captured) soundEngine.playCapture();
    else soundEngine.playMove();
  });

  socket.on('clock_tick', (data: { whiteTimeMs: number; blackTimeMs: number }) => {
    const state = useGameStore.getState().roomState;
    if (state) {
      if (state.whitePlayer) state.whitePlayer.timeRemainingMs = data.whiteTimeMs;
      if (state.blackPlayer) state.blackPlayer.timeRemainingMs = data.blackTimeMs;
      useGameStore.getState().setRoomState({ ...state });
    }
  });

  socket.on('game_over', (data: { winner: string | null; winReason: string; roomState: RoomState }) => {
    useGameStore.getState().setRoomState(data.roomState);
    if (data.winner === 'draw') {
      soundEngine.playMove();
    } else {
      soundEngine.playCheckmate();
    }
  });

  socket.on('chat_received', (msg: any) => {
    const state = useGameStore.getState().roomState;
    if (state) {
      state.chatMessages.push(msg);
      useGameStore.getState().setRoomState({ ...state });
    }
  });
}

// Emitters
export function emitCreateRoom(
  timeControlSeconds: number,
  incSeconds: number,
  preferredColor: 'w' | 'b' | 'random',
  gameType: 'chess' | 'ludo' | 'rps' = 'chess',
  maxPlayers: number = 2
) {
  const store = useGameStore.getState();
  socket.emit('create_room', {
    gameType,
    maxPlayers,
    timeControlSeconds,
    incSeconds,
    playerName: store.playerName,
    playerAvatar: store.playerAvatar,
    preferredColor
  });
}

export function emitJoinRoom(roomCode: string) {
  const store = useGameStore.getState();
  socket.emit('join_room', {
    roomCode,
    playerName: store.playerName,
    playerAvatar: store.playerAvatar
  });
}

export function emitMakeMove(from: string, to: string, promotion?: string) {
  const roomState = useGameStore.getState().roomState;
  if (roomState) {
    socket.emit('make_move', {
      roomCode: roomState.code,
      from,
      to,
      promotion
    });
  }
}

export function emitRollDice() {
  const roomState = useGameStore.getState().roomState;
  if (roomState) {
    socket.emit('roll_dice', { roomCode: roomState.code });
  }
}

export function emitMoveLudoToken(color: LudoColor, tokenId: number) {
  const roomState = useGameStore.getState().roomState;
  if (roomState) {
    socket.emit('move_ludo_token', {
      roomCode: roomState.code,
      color,
      tokenId
    });
  }
}

export function emitSendChat(text: string) {
  const roomState = useGameStore.getState().roomState;
  if (roomState && text.trim()) {
    socket.emit('send_chat', {
      roomCode: roomState.code,
      text
    });
  }
}

export function emitRequestDraw() {
  const roomState = useGameStore.getState().roomState;
  if (roomState) socket.emit('request_draw', { roomCode: roomState.code });
}

export function emitRespondDraw(accept: boolean) {
  const roomState = useGameStore.getState().roomState;
  if (roomState) socket.emit('respond_draw', { roomCode: roomState.code, accept });
}

export function emitRequestUndo() {
  const roomState = useGameStore.getState().roomState;
  if (roomState) socket.emit('request_undo', { roomCode: roomState.code });
}

export function emitRespondUndo(accept: boolean) {
  const roomState = useGameStore.getState().roomState;
  if (roomState) socket.emit('respond_undo', { roomCode: roomState.code, accept });
}

export function emitResign() {
  const roomState = useGameStore.getState().roomState;
  if (roomState) socket.emit('resign_game', { roomCode: roomState.code });
}

export function emitLeaveRoom() {
  const roomState = useGameStore.getState().roomState;
  if (roomState) socket.emit('leave_room', { roomCode: roomState.code });
}

export function emitRestartGame() {
  const roomState = useGameStore.getState().roomState;
  if (roomState) socket.emit('restart_game', { roomCode: roomState.code });
}

export function emitSubmitRPSMove(roundId: number, choice: 'rock' | 'paper' | 'scissors') {
  const roomState = useGameStore.getState().roomState;
  if (roomState) {
    socket.emit('submit_rps_move', {
      roomCode: roomState.code,
      roundId,
      choice
    });
  }
}

export function emitRequestRPSRematch() {
  const roomState = useGameStore.getState().roomState;
  if (roomState) {
    socket.emit('request_rps_rematch', {
      roomCode: roomState.code
    });
  }
}
