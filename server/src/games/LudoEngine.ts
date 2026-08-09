import { RoomState, LudoState, LudoColor } from '../types/index.js';
import { IGameEngine, ActionResult } from './IGameEngine.js';

const START_OFFSETS: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

const SAFE_STEPS = [0, 8, 13, 21, 26, 34, 39, 47];

export class LudoEngine implements IGameEngine {
  private state: LudoState;

  constructor(private room: RoomState) {
    if (!room.ludoState) {
      room.ludoState = {
        tokens: {
          red: [0, 1, 2, 3].map((id) => ({ id, color: 'red', step: -1 })),
          green: [0, 1, 2, 3].map((id) => ({ id, color: 'green', step: -1 })),
          yellow: [0, 1, 2, 3].map((id) => ({ id, color: 'yellow', step: -1 })),
          blue: [0, 1, 2, 3].map((id) => ({ id, color: 'blue', step: -1 }))
        },
        currentTurn: 'red',
        diceValue: null,
        hasRolled: false,
        canMoveTokens: [],
        winner: null,
        activeColors: ['red', 'green', 'yellow', 'blue'],
        consecutiveSixes: 0,
        turnTimerSeconds: 30
      };
    }
    this.state = room.ludoState;
  }

  public getGlobalPosition(color: LudoColor, step: number): number | null {
    if (step < 0 || step > 51) return null;
    return (step + START_OFFSETS[color]) % 52;
  }

  public makeMove(payload: { color: LudoColor; tokenId: number }): ActionResult {
    if (this.state.currentTurn !== payload.color || !this.state.hasRolled || !this.state.canMoveTokens.includes(payload.tokenId)) {
      return { success: false, error: 'Invalid token move' };
    }

    const token = this.state.tokens[payload.color][payload.tokenId];
    let captured = false;

    if (token.step === -1 && this.state.diceValue === 6) {
      token.step = 0;
    } else if (token.step >= 0) {
      token.step += this.state.diceValue || 0;
    }

    // Capture logic
    if (token.step >= 0 && token.step <= 51) {
      const globalPos = this.getGlobalPosition(payload.color, token.step);
      if (globalPos !== null && !SAFE_STEPS.includes(globalPos)) {
        (Object.keys(this.state.tokens) as LudoColor[]).forEach((otherColor) => {
          if (otherColor !== payload.color) {
            this.state.tokens[otherColor].forEach((otherToken) => {
              if (otherToken.step >= 0 && otherToken.step <= 51) {
                if (this.getGlobalPosition(otherColor, otherToken.step) === globalPos) {
                  otherToken.step = -1;
                  captured = true;
                }
              }
            });
          }
        });
      }
    }

    // Check winner condition
    const allFinished = this.state.tokens[payload.color].every((t) => t.step === 57);
    if (allFinished) {
      this.state.winner = payload.color;
      this.room.status = 'checkmate';
      this.room.winner = payload.color;
      this.room.winReason = `Ludo Royale Victory by ${payload.color.toUpperCase()}!`;
      return { success: true, soundType: 'checkmate', win: true };
    }

    const extraTurn = this.state.diceValue === 6 || captured;
    this.state.hasRolled = false;
    this.state.diceValue = null;
    this.state.canMoveTokens = [];

    if (!extraTurn) {
      this.nextTurn();
    }

    return { success: true, soundType: captured ? 'capture' : 'move' };
  }

  public handleAction(actionType: string, payload: any): ActionResult {
    if (actionType === 'roll_dice') {
      if (this.state.hasRolled) return { success: false, error: 'Already rolled dice' };

      const diceValue = Math.floor(Math.random() * 6) + 1;
      this.state.diceValue = diceValue;
      this.state.hasRolled = true;

      const currentTokens = this.state.tokens[this.state.currentTurn];
      const canMoveTokens: number[] = [];

      currentTokens.forEach((token) => {
        if (token.step === -1 && diceValue === 6) canMoveTokens.push(token.id);
        else if (token.step >= 0 && token.step + diceValue <= 57) canMoveTokens.push(token.id);
      });

      this.state.canMoveTokens = canMoveTokens;

      if (canMoveTokens.length === 0 && diceValue !== 6) {
        setTimeout(() => this.nextTurn(), 1200);
      }

      return { success: true, soundType: 'dice' };
    }
    return { success: false, error: 'Unknown action' };
  }

  public nextTurn() {
    const idx = this.state.activeColors.indexOf(this.state.currentTurn);
    this.state.currentTurn = this.state.activeColors[(idx + 1) % this.state.activeColors.length];
    this.state.hasRolled = false;
    this.state.diceValue = null;
    this.state.canMoveTokens = [];
  }

  public reset() {
    this.state.tokens = {
      red: [0, 1, 2, 3].map((id) => ({ id, color: 'red', step: -1 })),
      green: [0, 1, 2, 3].map((id) => ({ id, color: 'green', step: -1 })),
      yellow: [0, 1, 2, 3].map((id) => ({ id, color: 'yellow', step: -1 })),
      blue: [0, 1, 2, 3].map((id) => ({ id, color: 'blue', step: -1 }))
    };
    this.state.currentTurn = 'red';
    this.state.hasRolled = false;
    this.state.diceValue = null;
    this.state.winner = null;
  }
}
