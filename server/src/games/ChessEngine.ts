import { Chess } from 'chess.js';
import { RoomState, MoveRecord, PieceColor } from '../types/index.js';
import { IGameEngine, ActionResult } from './IGameEngine.js';

export class ChessEngine implements IGameEngine {
  private chess: Chess;
  private timerInterval: NodeJS.Timeout | null = null;

  constructor(private room: RoomState) {
    this.chess = new Chess(room.fen || undefined);
  }

  public makeMove(payload: { from: string; to: string; promotion?: string }): ActionResult {
    try {
      const moveResult = this.chess.move({
        from: payload.from,
        to: payload.to,
        promotion: payload.promotion || 'q'
      });

      if (!moveResult) {
        return { success: false, error: 'Illegal move' };
      }

      if (moveResult.captured) {
        if (moveResult.color === 'w') this.room.capturedWhite.push(moveResult.captured);
        else this.room.capturedBlack.push(moveResult.captured);
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
        fen: this.chess.fen(),
        timestamp: Date.now()
      };

      this.room.fen = this.chess.fen();
      this.room.turn = this.chess.turn() as PieceColor;
      this.room.lastMove = { from: moveResult.from, to: moveResult.to };
      this.room.moveHistory.push(record);
      this.room.isCheck = this.chess.inCheck();
      this.room.checkSquare = this.room.isCheck ? this.getKingSquare(this.room.turn) : undefined;

      let soundType: 'move' | 'capture' | 'check' | 'checkmate' = 'move';
      let win = false;

      if (this.chess.isCheckmate()) {
        this.room.status = 'checkmate';
        this.room.winner = moveResult.color as PieceColor;
        this.room.winReason = 'Checkmate';
        soundType = 'checkmate';
        win = true;
        this.stopTimer();
      } else if (this.chess.isDraw() || this.chess.isStalemate()) {
        this.room.status = 'draw';
        this.room.winner = 'draw';
        this.room.winReason = this.chess.isStalemate() ? 'Stalemate' : 'Draw';
        this.stopTimer();
      } else if (this.room.isCheck) {
        soundType = 'check';
      } else if (moveResult.captured) {
        soundType = 'capture';
      }

      return { success: true, soundType, win };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid move' };
    }
  }

  public handleAction(actionType: string, payload: any): ActionResult {
    if (actionType === 'undo') {
      const undone = this.chess.undo();
      if (!undone) return { success: false, error: 'Cannot undo move' };
      this.room.moveHistory.pop();
      this.room.fen = this.chess.fen();
      this.room.turn = this.chess.turn() as PieceColor;
      this.room.isCheck = this.chess.inCheck();
      return { success: true, soundType: 'move' };
    }
    return { success: false, error: 'Unknown action' };
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

  public startTimer(onTick: (roomState: RoomState) => void, onGameOver: (roomState: RoomState) => void) {
    this.stopTimer();
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
        onGameOver(this.room);
        return;
      }
      onTick(this.room);
    }, intervalMs);
  }

  public stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public reset() {
    this.chess = new Chess();
    this.stopTimer();
  }
}
