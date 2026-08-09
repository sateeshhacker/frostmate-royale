export type PieceColor = 'w' | 'b';
export type LudoColor = 'red' | 'green' | 'yellow' | 'blue';
export type RPSChoice = 'rock' | 'paper' | 'scissors';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color?: PieceColor;
  ludoColor?: LudoColor;
  connected: boolean;
  timeRemainingMs: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  promotion?: string;
  fen: string;
  timestamp: number;
}

export type GameStatus = 
  | 'waiting'
  | 'countdown'
  | 'playing'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'timeout'
  | 'abandoned';

export interface LudoToken {
  id: number;
  color: LudoColor;
  step: number;
}

export interface LudoState {
  tokens: Record<LudoColor, LudoToken[]>;
  currentTurn: LudoColor;
  diceValue: number | null;
  hasRolled: boolean;
  canMoveTokens: number[];
  winner: LudoColor | null;
}

export interface RPSState {
  roundId: number;
  targetPoints: number;
  scores: Record<string, number>;
  choices: Record<string, { choice: RPSChoice; roundId: number }>;
  lastRoundResult?: {
    roundId: number;
    playerChoices: Record<string, RPSChoice>;
    winnerId: string | 'draw';
    scores: Record<string, number>;
  };
  winnerId: string | null;
  matchStatus: 'CHOOSING' | 'RESULT' | 'COMPLETE';
  rematchAgreed: Record<string, boolean>;
}

export type GameType = 'chess' | 'ludo' | 'rps';

export interface RoomState {
  code: string;
  createdAt: number;
  gameType: GameType;
  maxPlayers: number;
  timeControlSeconds: number;
  incSeconds: number;
  whitePlayer: Player | null;
  blackPlayer: Player | null;
  ludoPlayers?: Record<LudoColor, Player | null>;
  spectators: Array<{ id: string; name: string }>;
  fen: string;
  ludoState?: LudoState;
  rpsState?: RPSState;
  moveHistory: MoveRecord[];
  capturedWhite: string[];
  capturedBlack: string[];
  status: GameStatus;
  turn: PieceColor;
  winner: PieceColor | LudoColor | 'draw' | string | null;
  winReason?: string;
  isCheck: boolean;
  checkSquare?: string;
  lastMove?: { from: string; to: string };
  chatMessages: ChatMessage[];
  pendingDrawOfferFrom?: string;
  pendingUndoOfferFrom?: string;
  rematchRequestedBy?: string[];
  opponentLeft?: boolean;
  lastActionNotice?: string;
  countdown: number;
  disconnectCountdown?: number;
  disconnectedPlayerName?: string;
}

export type ViewMode = 'landing' | 'waiting' | 'game';

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  ambientMusicEnabled: boolean;
}
