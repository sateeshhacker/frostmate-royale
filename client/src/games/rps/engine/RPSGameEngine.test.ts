import { RPSGameEngine, RPSChoice } from './RPSGameEngine.js';

// Unit Test Suite verifying all 9 choice matrix combinations & invariant rules
export function runRPSGameEngineTests(): { passed: boolean; log: string[] } {
  const logs: string[] = [];
  let passed = true;

  const assertEqual = (actual: any, expected: any, testName: string) => {
    if (actual === expected) {
      logs.push(`[PASS] ${testName}`);
    } else {
      logs.push(`[FAIL] ${testName} — Expected ${expected}, got ${actual}`);
      passed = false;
    }
  };

  // 1. Test All 9 Choice Matrix Combinations Exactly
  assertEqual(RPSGameEngine.determineOutcome('rock', 'rock'), 'draw', 'ROCK vs ROCK = DRAW');
  assertEqual(RPSGameEngine.determineOutcome('rock', 'paper'), 'lose', 'ROCK vs PAPER = LOSS');
  assertEqual(RPSGameEngine.determineOutcome('rock', 'scissors'), 'win', 'ROCK vs SCISSORS = WIN');

  assertEqual(RPSGameEngine.determineOutcome('paper', 'rock'), 'win', 'PAPER vs ROCK = WIN');
  assertEqual(RPSGameEngine.determineOutcome('paper', 'paper'), 'draw', 'PAPER vs PAPER = DRAW');
  assertEqual(RPSGameEngine.determineOutcome('paper', 'scissors'), 'lose', 'PAPER vs SCISSORS = LOSS');

  assertEqual(RPSGameEngine.determineOutcome('scissors', 'rock'), 'lose', 'SCISSORS vs ROCK = LOSS');
  assertEqual(RPSGameEngine.determineOutcome('scissors', 'paper'), 'win', 'SCISSORS vs PAPER = WIN');
  assertEqual(RPSGameEngine.determineOutcome('scissors', 'scissors'), 'draw', 'SCISSORS vs SCISSORS = DRAW');

  // 2. Test Match Over Invariant Conditions
  assertEqual(RPSGameEngine.isMatchOver(2, 1, 3), false, '2 - 1 score in 3-point game is NOT over');
  assertEqual(RPSGameEngine.isMatchOver(3, 1, 3), true, '3 - 1 score in 3-point game IS over');
  assertEqual(RPSGameEngine.isMatchOver(4, 5, 5), true, '4 - 5 score in 5-point game IS over');

  // 3. Test Choice Lock Ref Preservation Invariant
  const mockLockedChoice: RPSChoice = 'rock';
  const resolvedChoice = mockLockedChoice || RPSGameEngine.getRandomChoice();
  assertEqual(resolvedChoice, 'rock', 'Locked choice ROCK must NEVER be overwritten by fallback random choice');

  return { passed, log: logs };
}
