import { useState, useEffect, useCallback, useRef } from 'react';
import { RPSChoice, RPSOutcome, RPSGameEngine } from '../engine/RPSGameEngine.js';
import { useGameStore } from '../../../store/useGameStore.js';
import { socket, emitSubmitRPSMove, emitRequestRPSRematch, emitLeaveRoom } from '../../../socket/socketClient.js';
import { soundEngine } from '../../../audio/soundEngine.js';
import confetti from 'canvas-confetti';

export type RPSGamePhase =
  | 'IDLE'
  | 'READY'
  | 'CHOOSING'
  | 'PLAYER_LOCKED'
  | 'BOTH_LOCKED'
  | 'REVEAL'
  | 'RESULT'
  | 'MATCH_COMPLETE';

export interface RPSGameState {
  phase: RPSGamePhase;
  targetPoints: number;
  playerScore: number;
  opponentScore: number;
  roundCount: number;
  timerSeconds: number;
  playerChoice: RPSChoice | null;
  opponentChoice: RPSChoice | null;
  roundOutcome: RPSOutcome | null;
  outcomePhrase: string;
  countdownSequenceText: string | null;
  myRematchAgreed: boolean;
  opponentRematchAgreed: boolean;
  opponentLocked: boolean;
  opponentHasLeft: boolean;
}

export function useRPSGameState(initialTargetPoints: number = 5) {
  const roomState = useGameStore((s) => s.roomState);
  const socketConnected = useGameStore((s) => s.socketConnected);
  const mySocketId = socket.id;

  const [phase, setPhase] = useState<RPSGamePhase>('CHOOSING');
  const [targetPoints] = useState<number>(initialTargetPoints);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [roundCount, setRoundCount] = useState<number>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(10);

  const [playerChoice, setPlayerChoice] = useState<RPSChoice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<RPSChoice | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<RPSOutcome | null>(null);
  const [outcomePhrase, setOutcomePhrase] = useState<string>('');
  const [countdownSequenceText, setCountdownSequenceText] = useState<string | null>(null);

  const [myRematchAgreed, setMyRematchAgreed] = useState<boolean>(false);
  const [opponentRematchAgreed, setOpponentRematchAgreed] = useState<boolean>(false);
  const [opponentLocked, setOpponentLocked] = useState<boolean>(false);

  // Authoritative synchronous Refs for player selection and match completion status
  const selectedChoiceRef = useRef<RPSChoice | null>(null);
  const roundCountRef = useRef<number>(roundCount);
  roundCountRef.current = roundCount;
  const isMatchCompleteRef = useRef<boolean>(false);

  // Identify Opponent Socket ID & Connection Status in Room State
  const opponentPlayer = roomState
    ? (roomState.whitePlayer?.id === mySocketId ? roomState.blackPlayer : roomState.whitePlayer)
    : null;
  const opponentSocketId = opponentPlayer?.id;
  const opponentHasLeft = roomState
    ? (roomState.status === 'abandoned' || (opponentPlayer !== null && !opponentPlayer?.connected))
    : false;

  // Auto-transition to MATCH_COMPLETE modal when opponent leaves so neutral departure screen is shown
  useEffect(() => {
    if (opponentHasLeft) {
      setPhase('MATCH_COMPLETE');
    }
  }, [opponentHasLeft]);

  // Socket Listener Setup for Server-Authoritative RPS Events
  useEffect(() => {
    if (!socketConnected) return;

    // 1. Player Locked Notification
    const handlePlayerLocked = (data: { lockedPlayerIds: string[]; roomState: any }) => {
      if (data.lockedPlayerIds && opponentSocketId && data.lockedPlayerIds.includes(opponentSocketId)) {
        setOpponentLocked(true);
      }
    };

    // 2. Authoritative Round Result Broadcast from Server
    const handleRoundResult = (data: {
      result: {
        roundId: number;
        playerChoices: Record<string, RPSChoice>;
        winnerId: string | 'draw';
        scores: Record<string, number>;
      };
      matchStatus: string;
      roomState: any;
    }) => {
      const { result, matchStatus } = data;

      if (matchStatus === 'COMPLETE') {
        isMatchCompleteRef.current = true;
      }

      // Extract choices strictly bound to player socket IDs
      const myChoice = (mySocketId && result.playerChoices[mySocketId]) || selectedChoiceRef.current || 'rock';
      const oppChoice = (opponentSocketId && result.playerChoices[opponentSocketId]) ||
        Object.entries(result.playerChoices).find(([id]) => id !== mySocketId)?.[1] || 'rock';

      // Lock phase to BOTH_LOCKED during countdown sequence. Keep opponentChoice null until REVEAL!
      setPhase('BOTH_LOCKED');

      // Extract Authoritative Scores from Server Broadcast
      const myScore = (mySocketId && result.scores[mySocketId]) || 0;
      const oppScore = (opponentSocketId && result.scores[opponentSocketId]) ||
        Object.entries(result.scores).find(([id]) => id !== mySocketId)?.[1] || 0;

      // Determine outcome phrase & winner relative to this client
      let outcome: RPSOutcome = 'draw';
      if (result.winnerId === 'draw') {
        outcome = 'draw';
      } else if (result.winnerId === mySocketId) {
        outcome = 'win';
      } else {
        outcome = 'lose';
      }

      const phrase = RPSGameEngine.getOutcomePhrase(myChoice, oppChoice);

      if (import.meta.env.DEV) {
        console.log('[RPS MULTIPLAYER DEBUG] Server Round Result Received:', {
          roundId: result.roundId,
          myChoice,
          oppChoice,
          winnerId: result.winnerId,
          outcome,
          scores: result.scores,
          matchStatus
        });
      }

      // Trigger Animated Reveal Sequence ("ROCK!", "PAPER!", "SCISSORS!", "SHOOT!")
      const sequence = ['ROCK!', 'PAPER!', 'SCISSORS!', 'SHOOT!'];
      let idx = 0;

      const countInterval = setInterval(() => {
        if (idx < sequence.length) {
          setCountdownSequenceText(sequence[idx]);
          soundEngine.playMove();
          idx++;
        } else {
          clearInterval(countInterval);
          setCountdownSequenceText(null);

          // ONLY NOW POPULATE BOTH CHOICES & REVEAL RESULT TO TRIGGER 3D BATTLE ANIMATION
          setPlayerChoice(myChoice);
          setOpponentChoice(oppChoice);
          setRoundOutcome(outcome);
          setOutcomePhrase(phrase);
          setPhase('REVEAL');

          // UPDATE SCORES AT TOP ONLY WHEN BATTLE IS REVEALED
          setPlayerScore(myScore);
          setOpponentScore(oppScore);

          if (outcome === 'win') {
            soundEngine.playCapture();
            if (myScore >= targetPoints) {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
          } else if (outcome === 'lose') {
            soundEngine.playCheck();
          } else {
            soundEngine.playMove();
          }

          setPhase('RESULT');

          // Display full cinematic trailer sequence (3.8s) BEFORE transitioning to Match Complete or Next Round
          setTimeout(() => {
            if (isMatchCompleteRef.current || matchStatus === 'COMPLETE' || myScore >= targetPoints || oppScore >= targetPoints) {
              setPhase('MATCH_COMPLETE');
            } else {
              // Reset selection & opponentChoice for next round
              selectedChoiceRef.current = null;
              setPlayerChoice(null);
              setOpponentChoice(null);
              setRoundOutcome(null);
              setOutcomePhrase('');
              setOpponentLocked(false);
              setTimerSeconds(10);
              setRoundCount((r) => r + 1);
              setPhase('CHOOSING');
            }
          }, 3800);
        }
      }, 450);
    };

    // 3. Authoritative Match Complete Event
    const handleMatchComplete = (data: { winnerId: string; scores: Record<string, number> }) => {
      isMatchCompleteRef.current = true;
    };

    // 4. Authoritative Match Reset Event
    const handleMatchReset = () => {
      selectedChoiceRef.current = null;
      isMatchCompleteRef.current = false;
      setPlayerScore(0);
      setOpponentScore(0);
      setPlayerChoice(null);
      setOpponentChoice(null);
      setRoundOutcome(null);
      setOutcomePhrase('');
      setRoundCount(1);
      setTimerSeconds(10);
      setMyRematchAgreed(false);
      setOpponentRematchAgreed(false);
      setOpponentLocked(false);
      setPhase('CHOOSING');
    };

    const handleRematchUpdated = (data: { rematchAgreed: Record<string, boolean> }) => {
      if (mySocketId && data.rematchAgreed[mySocketId]) setMyRematchAgreed(true);
      if (opponentSocketId && data.rematchAgreed[opponentSocketId]) setOpponentRematchAgreed(true);
    };

    socket.on('rps_player_locked', handlePlayerLocked);
    socket.on('rps_round_result', handleRoundResult);
    socket.on('rps_match_complete', handleMatchComplete);
    socket.on('rps_match_reset', handleMatchReset);
    socket.on('rps_rematch_updated', handleRematchUpdated);

    return () => {
      socket.off('rps_player_locked', handlePlayerLocked);
      socket.off('rps_round_result', handleRoundResult);
      socket.off('rps_match_complete', handleMatchComplete);
      socket.off('rps_match_reset', handleMatchReset);
      socket.off('rps_rematch_updated', handleRematchUpdated);
    };
  }, [socketConnected, mySocketId, opponentSocketId, targetPoints]);

  // Handle Player Selecting Move (Locks choice & emits to server)
  const handleSelectChoice = useCallback(
    (choice: RPSChoice) => {
      if (phase !== 'CHOOSING' || selectedChoiceRef.current !== null) return;

      soundEngine.playClick();
      selectedChoiceRef.current = choice;
      setPlayerChoice(choice);
      setPhase('PLAYER_LOCKED');

      // Submit choice to server bound to room and current roundId
      emitSubmitRPSMove(roundCountRef.current, choice);

      if (import.meta.env.DEV) {
        console.log('[RPS DEBUG] User Selected & Emitted Choice:', {
          roundId: roundCountRef.current,
          choice
        });
      }
    },
    [phase]
  );

  // Handle 10-Second Timer Expiring (Auto-picks fallback if player didn't select before 0s)
  const handleTimerExpired = useCallback(() => {
    if (selectedChoiceRef.current === null) {
      const fallbackChoice = RPSGameEngine.getRandomChoice();
      selectedChoiceRef.current = fallbackChoice;
      setPlayerChoice(fallbackChoice);
      setPhase('PLAYER_LOCKED');
      emitSubmitRPSMove(roundCountRef.current, fallbackChoice);
    }
  }, []);

  // 10-Second Per-Round Turn Timer Loop
  useEffect(() => {
    if (phase !== 'CHOOSING' && phase !== 'PLAYER_LOCKED') return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimerExpired();
          return 0;
        }
        soundEngine.playMove();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, roundCount, handleTimerExpired]);

  // Rematch Consensus Flow
  const handleRequestRematch = useCallback(() => {
    soundEngine.playClick();
    setMyRematchAgreed(true);
    emitRequestRPSRematch();
  }, []);

  // Exit to Home Launcher Handler
  const handleExitToHome = useCallback(() => {
    soundEngine.playClick();
    emitLeaveRoom();
    useGameStore.getState().resetGame();
  }, []);

  return {
    state: {
      phase,
      targetPoints,
      playerScore,
      opponentScore,
      roundCount,
      timerSeconds,
      playerChoice,
      opponentChoice,
      roundOutcome,
      outcomePhrase,
      countdownSequenceText,
      myRematchAgreed,
      opponentRematchAgreed,
      opponentLocked,
      opponentHasLeft
    },
    actions: {
      handleSelectChoice,
      handleRequestRematch,
      handleExitToHome
    }
  };
}
