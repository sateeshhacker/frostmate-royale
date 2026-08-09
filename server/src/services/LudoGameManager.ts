import crypto from 'crypto';
import { LudoState, LudoColor, RoomState } from '../types/index.js';

const START_OFFSETS: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

const SAFE_STEPS = [0, 8, 13, 21, 26, 34, 39, 47];

export class LudoGameManager {
  private state: LudoState;
  private totalRolls: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private onStateUpdate?: (roomState: RoomState) => void;
  private consecutiveTimeouts: Record<LudoColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };

  constructor(private room: RoomState, maxPlayers: number = 4) {
    const activeColors: LudoColor[] = maxPlayers === 2 ? ['red', 'yellow'] : ['red', 'green', 'yellow', 'blue'];

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
        activeColors,
        consecutiveSixes: 0,
        turnTimerSeconds: 30,
        activePlayerSocketId: undefined
      };
    }
    this.state = room.ludoState;
    this.syncActivePlayerSocket();
  }

  private syncActivePlayerSocket() {
    const activePlayer = this.room.ludoPlayers[this.state.currentTurn];
    this.state.activePlayerSocketId = activePlayer?.id;
  }

  public setUpdateCallback(cb: (roomState: RoomState) => void) {
    this.onStateUpdate = cb;
  }

  public startTurnTimer() {
    this.stopTurnTimer();
    this.state.turnTimerSeconds = 30;
    this.syncActivePlayerSocket();

    console.log(`[LudoTimer] Started 30s timer for ${this.state.currentTurn.toUpperCase()} (Socket: ${this.state.activePlayerSocketId || 'local'})`);

    this.timerInterval = setInterval(() => {
      if (this.room.status !== 'playing') {
        this.stopTurnTimer();
        return;
      }

      this.state.turnTimerSeconds--;

      if (this.state.turnTimerSeconds <= 0) {
        const turnColor = this.state.currentTurn;
        this.consecutiveTimeouts[turnColor] = (this.consecutiveTimeouts[turnColor] || 0) + 1;
        const strikes = this.consecutiveTimeouts[turnColor];
        const playerName = this.room.ludoPlayers[turnColor]?.name || turnColor.toUpperCase();

        console.log(`[LudoTimer] ⏱️ 30s Timer EXPIRED for ${turnColor.toUpperCase()}! Strike ${strikes}/3.`);

        if (strikes >= 3) {
          // 3 Missed Turns: Eliminate player
          if (this.room.maxPlayers === 2) {
            const winnerColor = this.state.activeColors.find((c) => c !== turnColor) || 'red';
            this.room.status = 'abandoned';
            this.room.winner = winnerColor;
            if (this.room.ludoState) this.room.ludoState.winner = winnerColor;
            this.room.winReason = `⚠️ ${playerName} eliminated (3 missed turns). ${winnerColor.toUpperCase()} wins!`;
            this.stopTurnTimer();
            if (this.onStateUpdate) this.onStateUpdate(this.room);
            return;
          } else {
            // 4-Player mode: invalidate candidate tokens & eliminate
            if (this.room.ludoPlayers[turnColor]) {
              this.room.ludoPlayers[turnColor]!.connected = false;
            }
            if (this.state.tokens[turnColor]) {
              this.state.tokens[turnColor].forEach((tk) => (tk.step = -1));
            }
            this.room.moveHistory.push({
              actionText: `❌ ${playerName} (${turnColor.toUpperCase()}) eliminated (3 missed turns). Tokens invalidated.`,
              timestamp: Date.now()
            });

            // Check remaining connected active players
            const connectedColors = this.state.activeColors.filter(
              (c) => this.room.ludoPlayers[c] && this.room.ludoPlayers[c]!.connected
            );

            if (connectedColors.length <= 1) {
              const winnerColor = connectedColors[0] || 'red';
              this.room.status = 'abandoned';
              this.room.winner = winnerColor;
              if (this.room.ludoState) this.room.ludoState.winner = winnerColor;
              this.room.winReason = `All opponents eliminated. ${winnerColor.toUpperCase()} wins!`;
              this.stopTurnTimer();
              if (this.onStateUpdate) this.onStateUpdate(this.room);
              return;
            }
          }
        } else {
          this.room.moveHistory.push({
            actionText: `⏱️ 30s Timer expired for ${turnColor.toUpperCase()}! (Strike ${strikes}/3)`,
            timestamp: Date.now()
          });
        }

        this.nextTurn();
        if (this.onStateUpdate) this.onStateUpdate(this.room);
        return;
      }

      if (this.onStateUpdate) this.onStateUpdate(this.room);
    }, 1000);
  }

  public stopTurnTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getGlobalPosition(color: LudoColor, step: number): number | null {
    if (step < 0 || step > 51) return null;
    return (step + START_OFFSETS[color]) % 52;
  }

  public rollDice(requestSocketId?: string): { success: boolean; diceValue?: number; canMoveTokens?: number[]; autoPassed?: boolean; error?: string } {
    const activePlayer = this.room.ludoPlayers[this.state.currentTurn];

    // Anti-Cheat: Validate that the socket making the request belongs to the active turn player!
    if (requestSocketId && activePlayer && activePlayer.id && requestSocketId !== activePlayer.id) {
      console.warn(`[AntiCheat] Blocked out-of-turn dice roll from socket ${requestSocketId}. Current active player socket is ${activePlayer.id}`);
      return { success: false, error: 'Not your turn' };
    }

    if (this.state.hasRolled) {
      return { success: false, error: 'Already rolled dice this turn' };
    }

    this.totalRolls++;
    this.consecutiveTimeouts[this.state.currentTurn] = 0;

    // Unbiased, cryptographically secure random number generation (1..6)
    const diceValue = crypto.randomInt(1, 7);
    this.state.diceValue = diceValue;
    this.state.hasRolled = true;

    if (diceValue === 6) {
      this.state.consecutiveSixes++;
    } else {
      this.state.consecutiveSixes = 0;
    }

    console.log(`[LudoEngine] Roll #${this.totalRolls} | Player: ${this.state.currentTurn} | Socket: ${requestSocketId} | Dice: ${diceValue}`);
    this.room.moveHistory.push({
      actionText: `${this.state.currentTurn.toUpperCase()} rolled a ${diceValue}`,
      timestamp: Date.now()
    });

    // Penalty for 3 consecutive sixes
    if (this.state.consecutiveSixes >= 3) {
      this.state.consecutiveSixes = 0;
      this.room.moveHistory.push({
        actionText: `⚠️ 3 Consecutive Sixes! ${this.state.currentTurn.toUpperCase()}'s turn forfeited.`,
        timestamp: Date.now()
      });
      this.nextTurn();
      return { success: true, diceValue, canMoveTokens: [], autoPassed: true };
    }

    const currentTokens = this.state.tokens[this.state.currentTurn];
    const canMoveTokens: number[] = [];

    currentTokens.forEach((token) => {
      if (token.step === -1 && diceValue === 6) {
        canMoveTokens.push(token.id);
      } else if (token.step >= 0 && token.step + diceValue <= 57) {
        canMoveTokens.push(token.id);
      }
    });

    this.state.canMoveTokens = canMoveTokens;

    let autoPassed = false;
    if (canMoveTokens.length === 0 && diceValue !== 6) {
      autoPassed = true;
      this.room.moveHistory.push({
        actionText: `No valid moves for ${this.state.currentTurn.toUpperCase()}. Skipping turn.`,
        timestamp: Date.now()
      });
      setTimeout(() => this.nextTurn(), 800);
    }

    return { success: true, diceValue, canMoveTokens, autoPassed };
  }

  public moveToken(requestSocketId: string | undefined, color: LudoColor, tokenId: number): { success: boolean; captured?: boolean; win?: boolean; error?: string } {
    const activePlayer = this.room.ludoPlayers[this.state.currentTurn];

    // Anti-Cheat: Validate that the socket making the move request belongs to the active turn player!
    if (requestSocketId && activePlayer && activePlayer.id && requestSocketId !== activePlayer.id) {
      console.warn(`[AntiCheat] Blocked out-of-turn token move from socket ${requestSocketId}. Active player is ${activePlayer.id}`);
      return { success: false, error: 'Not your turn' };
    }

    if (this.state.currentTurn !== color || !this.state.hasRolled || !this.state.canMoveTokens.includes(tokenId)) {
      return { success: false, error: 'Invalid token move request' };
    }

    const token = this.state.tokens[color][tokenId];
    let captured = false;

    if (token.step === -1 && this.state.diceValue === 6) {
      token.step = 0;
      this.room.moveHistory.push({
        actionText: `${color.toUpperCase()} released Token #${tokenId + 1} onto start!`,
        timestamp: Date.now()
      });
    } else if (token.step >= 0) {
      const targetStep = token.step + (this.state.diceValue || 0);
      if (targetStep <= 57) {
        token.step = targetStep;
        this.room.moveHistory.push({
          actionText: `${color.toUpperCase()} moved Token #${tokenId + 1} to ${token.step === 57 ? 'HOME 🎉' : `step ${token.step}`}`,
          timestamp: Date.now()
        });
      }
    }

    // Capture logic
    if (token.step >= 0 && token.step <= 51) {
      const globalPos = this.getGlobalPosition(color, token.step);
      if (globalPos !== null && !SAFE_STEPS.includes(globalPos)) {
        this.state.activeColors.forEach((otherColor) => {
          if (otherColor !== color) {
            this.state.tokens[otherColor].forEach((otherToken) => {
              if (otherToken.step >= 0 && otherToken.step <= 51) {
                if (this.getGlobalPosition(otherColor, otherToken.step) === globalPos) {
                  otherToken.step = -1;
                  captured = true;
                  this.room.moveHistory.push({
                    actionText: `⚔️ ${color.toUpperCase()} captured ${otherColor.toUpperCase()}'s Token #${otherToken.id + 1}!`,
                    timestamp: Date.now()
                  });
                }
              }
            });
          }
        });
      }
    }

    // Winner check
    const allFinished = this.state.tokens[color].every((t) => t.step === 57);
    if (allFinished) {
      this.state.winner = color;
      this.room.status = 'checkmate';
      this.room.winner = color;
      this.room.winReason = `👑 Ludo Royale Champion: ${color.toUpperCase()}!`;
      this.stopTurnTimer();
      return { success: true, captured, win: true };
    }

    const extraTurn = this.state.diceValue === 6 || captured;
    this.state.hasRolled = false;
    this.state.diceValue = null;
    this.state.canMoveTokens = [];

    if (!extraTurn) {
      this.state.consecutiveSixes = 0;
      this.nextTurn();
    } else {
      this.room.moveHistory.push({
        actionText: `✨ ${color.toUpperCase()} gets a BONUS TURN!`,
        timestamp: Date.now()
      });
      this.startTurnTimer();
    }

    return { success: true, captured };
  }

  public nextTurn() {
    let nextIdx = this.state.activeColors.indexOf(this.state.currentTurn);
    let attempts = 0;
    do {
      nextIdx = (nextIdx + 1) % this.state.activeColors.length;
      attempts++;
      const nextColor = this.state.activeColors[nextIdx];
      const player = this.room.ludoPlayers[nextColor];
      if (!player || player.connected) {
        this.state.currentTurn = nextColor;
        break;
      }
    } while (attempts < this.state.activeColors.length);

    this.state.hasRolled = false;
    this.state.diceValue = null;
    this.state.canMoveTokens = [];
    this.startTurnTimer();
  }
}
