import { RoomState, RPSState, RPSChoice } from '../types/index.js';

export class RPSGameManager {
  private state: RoomState;

  constructor(roomState: RoomState, targetPoints: number = 5) {
    this.state = roomState;
    if (!this.state.rpsState) {
      this.state.rpsState = {
        roundId: 1,
        targetPoints,
        scores: {},
        choices: {},
        winnerId: null,
        matchStatus: 'CHOOSING',
        rematchAgreed: {}
      };
    }
  }

  public getRPSState(): RPSState {
    return this.state.rpsState!;
  }

  public submitMove(
    socketId: string,
    roundId: number,
    choice: RPSChoice
  ): {
    success: boolean;
    error?: string;
    isRoundComplete?: boolean;
    result?: RPSState['lastRoundResult'];
    matchStatus?: RPSState['matchStatus'];
    lockedPlayerIds?: string[];
  } {
    const rps = this.state.rpsState;
    if (!rps) return { success: false, error: 'RPS state not initialized' };

    // 1. Verify player is registered in room
    const isWhite = this.state.whitePlayer?.id === socketId;
    const isBlack = this.state.blackPlayer?.id === socketId;
    if (!isWhite && !isBlack) {
      return { success: false, error: 'Player not authorized in room' };
    }

    // 2. Reject if match is complete
    if (rps.matchStatus === 'COMPLETE') {
      return { success: false, error: 'Match is already complete' };
    }

    // 3. Reject stale or future round IDs
    if (roundId !== rps.roundId) {
      return { success: false, error: `Invalid round ID. Current round is ${rps.roundId}` };
    }

    // 4. Reject duplicate submissions for the same round
    if (rps.choices[socketId] && rps.choices[socketId].roundId === roundId) {
      return { success: false, error: 'Move already submitted for this round' };
    }

    // Store move bound to socket ID and roundId
    rps.choices[socketId] = { choice, roundId };

    const pAId = this.state.whitePlayer!.id;
    const pBId = this.state.blackPlayer ? this.state.blackPlayer.id : null;

    const lockedPlayerIds = Object.keys(rps.choices).filter(
      (id) => rps.choices[id] && rps.choices[id].roundId === rps.roundId
    );

    // If playing against bot/solo or both players locked in
    const isSoloVsBot = !pBId;
    const bothLocked = isSoloVsBot
      ? rps.choices[pAId]?.roundId === rps.roundId
      : rps.choices[pAId]?.roundId === rps.roundId && rps.choices[pBId]?.roundId === rps.roundId;

    if (!bothLocked) {
      return { success: true, isRoundComplete: false, lockedPlayerIds };
    }

    // Both players locked -> Calculate authoritative winner
    const choiceA = rps.choices[pAId].choice;
    const choiceB = isSoloVsBot ? this.getRandomChoice() : rps.choices[pBId!].choice;
    const pBKey = pBId || 'bot';

    // Pure Matrix calculation
    let roundWinnerId: string | 'draw' = 'draw';
    if (choiceA !== choiceB) {
      if (
        (choiceA === 'rock' && choiceB === 'scissors') ||
        (choiceA === 'scissors' && choiceB === 'paper') ||
        (choiceA === 'paper' && choiceB === 'rock')
      ) {
        roundWinnerId = pAId;
      } else {
        roundWinnerId = pBKey;
      }
    }

    // Initialize scores if needed
    rps.scores[pAId] = rps.scores[pAId] || 0;
    rps.scores[pBKey] = rps.scores[pBKey] || 0;

    if (roundWinnerId !== 'draw') {
      rps.scores[roundWinnerId] = (rps.scores[roundWinnerId] || 0) + 1;
    }

    // Check target points match goal
    const target = rps.targetPoints;
    let matchWinnerId: string | null = null;
    if (rps.scores[pAId] >= target) {
      matchWinnerId = pAId;
    } else if (rps.scores[pBKey] >= target) {
      matchWinnerId = pBKey;
    }

    if (matchWinnerId) {
      rps.matchStatus = 'COMPLETE';
      rps.winnerId = matchWinnerId;
      this.state.status = 'playing';
      this.state.winner = matchWinnerId;
    } else {
      rps.matchStatus = 'RESULT';
    }

    const lastRoundResult = {
      roundId: rps.roundId,
      playerChoices: {
        [pAId]: choiceA,
        [pBKey]: choiceB
      },
      winnerId: roundWinnerId,
      scores: { ...rps.scores }
    };

    rps.lastRoundResult = lastRoundResult;

    // Increment roundId for next round
    rps.roundId += 1;

    return {
      success: true,
      isRoundComplete: true,
      result: lastRoundResult,
      matchStatus: rps.matchStatus,
      lockedPlayerIds
    };
  }

  public requestRematch(socketId: string): { success: boolean; isMatchReset?: boolean } {
    const rps = this.state.rpsState;
    if (!rps) return { success: false };

    rps.rematchAgreed[socketId] = true;

    const pAId = this.state.whitePlayer?.id;
    const pBId = this.state.blackPlayer?.id;

    const bothAgreed = !pBId
      ? rps.rematchAgreed[pAId!]
      : rps.rematchAgreed[pAId!] && rps.rematchAgreed[pBId!];

    if (bothAgreed) {
      // RESET ALL AUTHORITATIVE MATCH STATE
      rps.roundId = 1;
      rps.scores = {};
      rps.choices = {};
      rps.lastRoundResult = undefined;
      rps.winnerId = null;
      rps.matchStatus = 'CHOOSING';
      rps.rematchAgreed = {};
      this.state.status = 'playing';
      this.state.winner = null;

      return { success: true, isMatchReset: true };
    }

    return { success: true, isMatchReset: false };
  }

  private getRandomChoice(): RPSChoice {
    const c: RPSChoice[] = ['rock', 'paper', 'scissors'];
    return c[Math.floor(Math.random() * c.length)];
  }
}
