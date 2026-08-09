export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSOutcome = 'win' | 'lose' | 'draw';

export interface RPSChoiceConfig {
  name: string;
  code: RPSChoice;
  beats: RPSChoice;
  losesTo: RPSChoice;
  phrase: string;
  color: string;
}

export const RPS_CHOICES: Record<RPSChoice, RPSChoiceConfig> = {
  rock: {
    name: 'ROCK',
    code: 'rock',
    beats: 'scissors',
    losesTo: 'paper',
    phrase: 'Rock crushes Scissors!',
    color: '#38bdf8'
  },
  paper: {
    name: 'PAPER',
    code: 'paper',
    beats: 'rock',
    losesTo: 'scissors',
    phrase: 'Paper covers Rock!',
    color: '#f8fafc'
  },
  scissors: {
    name: 'SCISSORS',
    code: 'scissors',
    beats: 'paper',
    losesTo: 'rock',
    phrase: 'Scissors cuts Paper!',
    color: '#ff5f6d'
  }
};

/**
 * Pure Game Logic Engine for Rock Paper Scissors.
 * Evaluates choices independently of React, Three.js, or DOM rendering.
 */
export class RPSGameEngine {
  /**
   * Determine the outcome for Player choice against Opponent choice.
   */
  static determineOutcome(player: RPSChoice, opponent: RPSChoice): RPSOutcome {
    if (player === opponent) return 'draw';
    if (RPS_CHOICES[player].beats === opponent) return 'win';
    return 'lose';
  }

  /**
   * Returns descriptive phrase explaining the round result.
   */
  static getOutcomePhrase(player: RPSChoice, opponent: RPSChoice): string {
    if (player === opponent) {
      return `Both selected ${RPS_CHOICES[player].name}! It's a Draw!`;
    }
    const outcome = this.determineOutcome(player, opponent);
    if (outcome === 'win') {
      return RPS_CHOICES[player].phrase;
    }
    return RPS_CHOICES[opponent].phrase;
  }

  /**
   * Generate a random AI choice.
   */
  static getRandomChoice(): RPSChoice {
    const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
  }

  /**
   * Check if a player has reached the match target score.
   */
  static isMatchOver(playerScore: number, opponentScore: number, targetPoints: number): boolean {
    return playerScore >= targetPoints || opponentScore >= targetPoints;
  }
}
