import { Chess } from 'chess.js';
import { RoomState, MoveRecord, PieceColor } from '../types/index.js';

export class GameManager {
  private chess: Chess;
  private timerInterval: NodeJS.Timeout | null = null;
  private onTickCallback?: (roomState: RoomState) => void;
  private onGameOverCallback?: (roomState: RoomState) => void;

  constructor(private room: RoomState) {
    this.chess = new Chess(room.fen || undefined);
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public isCheck(): boolean {
    return this.chess.inCheck();
  }

  public getKingSquare(color: PieceColor): string | undefined {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type === 'k' && sq.color === color) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
          return `${files[c]}${ranks[r]}`;
        }
      }
    }
    return undefined;
  }

  public makeMove(from: string, to: string, promotion?: string): { success: boolean; move?: MoveRecord; error?: string } {
    try {
      const moveResult = this.chess.move({
        from,
        to,
        promotion: promotion || 'q'
      });

      if (!moveResult) {
        return { success: false, error: 'Illegal move' };
      }

      if (moveResult.captured) {
        if (moveResult.color === 'w') {
          this.room.capturedWhite.push(moveResult.captured);
        } else {
          this.room.capturedBlack.push(moveResult.captured);
        }
      }

      const movedPlayer = moveResult.color === 'w' ? this.room.whitePlayer : this.room.blackPlayer;
      if (movedPlayer && this.room.incSeconds > 0) {
        movedPlayer.timeRemainingMs += this.room.incSeconds * 1000;
      }

      const record: MoveRecord = {
        san: moveResult.san,
        from: moveResult.from,
        to: moveResult.to,
        piece: moveResult.piece,
        captured: moveResult.captured,
        promotion: moveResult.promotion,
        fen: this.chess.fen(),
        timestamp: Date.now()
      };

      this.room.fen = this.chess.fen();
      this.room.turn = this.chess.turn() as PieceColor;
      this.room.lastMove = { from: moveResult.from, to: moveResult.to };
      this.room.moveHistory.push(record);
      this.room.isCheck = this.chess.inCheck();
      this.room.checkSquare = this.room.isCheck ? this.getKingSquare(this.room.turn) : undefined;

      if (this.chess.isCheckmate()) {
        this.room.status = 'checkmate';
        this.room.winner = moveResult.color as PieceColor;
        this.room.winReason = 'Checkmate';
        this.stopTimer();
      } else if (this.chess.isDraw() || this.chess.isStalemate() || this.chess.isThreefoldRepetition() || this.chess.isInsufficientMaterial()) {
        this.room.status = 'draw';
        this.room.winner = 'draw';
        if (this.chess.isStalemate()) this.room.winReason = 'Stalemate';
        else if (this.chess.isThreefoldRepetition()) this.room.winReason = 'Threefold Repetition';
        else if (this.chess.isInsufficientMaterial()) this.room.winReason = 'Insufficient Material';
        else this.room.winReason = '50-Move Rule Draw';
        this.stopTimer();
      }

      return { success: true, move: record };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid move' };
    }
  }

  public undoMove(): boolean {
    const undone = this.chess.undo();
    if (!undone) return false;

    this.room.moveHistory.pop();
    this.room.fen = this.chess.fen();
    this.room.turn = this.chess.turn() as PieceColor;
    this.room.isCheck = this.chess.inCheck();
    this.room.checkSquare = this.room.isCheck ? this.getKingSquare(this.room.turn) : undefined;

    const prevMove = this.room.moveHistory[this.room.moveHistory.length - 1];
    this.room.lastMove = (prevMove && prevMove.from && prevMove.to) ? { from: prevMove.from, to: prevMove.to } : undefined;
    return true;
  }

  public startTimer(onTick: (roomState: RoomState) => void, onGameOver: (roomState: RoomState) => void) {
    this.stopTimer();
    this.onTickCallback = onTick;
    this.onGameOverCallback = onGameOver;

    const intervalMs = 100;
    this.timerInterval = setInterval(() => {
      if (this.room.status !== 'playing') {
        this.stopTimer();
        return;
      }

      const activePlayer = this.room.turn === 'w' ? this.room.whitePlayer : this.room.blackPlayer;
      if (!activePlayer) return;

      activePlayer.timeRemainingMs -= intervalMs;

      if (activePlayer.timeRemainingMs <= 0) {
        activePlayer.timeRemainingMs = 0;
        this.room.status = 'timeout';
        this.room.winner = this.room.turn === 'w' ? 'b' : 'w';
        this.room.winReason = 'Time Expired';
        this.stopTimer();
        if (this.onGameOverCallback) this.onGameOverCallback(this.room);
        return;
      }

      if (this.onTickCallback) {
        this.onTickCallback(this.room);
      }
    }, intervalMs);
  }

  public stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
