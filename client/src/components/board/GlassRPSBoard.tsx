import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore.js';
import { soundEngine } from '../../audio/soundEngine.js';
import confetti from 'canvas-confetti';

export type RPSChoice = 'rock' | 'paper' | 'scissors';

export const RPS_RULES: Record<RPSChoice, { beats: RPSChoice; phrase: string; icon: string; name: string; color: string }> = {
  rock: {
    beats: 'scissors',
    phrase: 'Rock crushes Scissors!',
    icon: '🪨',
    name: 'ROCK',
    color: '#38bdf8'
  },
  paper: {
    beats: 'rock',
    phrase: 'Paper covers Rock!',
    icon: '📄',
    name: 'PAPER',
    color: '#f8fafc'
  },
  scissors: {
    beats: 'paper',
    phrase: 'Scissors cuts Paper!',
    icon: '✂️',
    name: 'SCISSORS',
    color: '#ff6672'
  }
};

export const GlassRPSBoard: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const storeTargetPoints = useGameStore((s) => s.rpsTargetPoints);

  // Target points from room state or store (supports 3, 5, 10 pts)
  const targetPoints = (roomState?.timeControlSeconds && roomState.timeControlSeconds <= 20)
    ? roomState.timeControlSeconds
    : (storeTargetPoints || 5);

  // Game State
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerChoice, setPlayerChoice] = useState<RPSChoice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<RPSChoice | null>(null);
  const [isMoveLocked, setIsMoveLocked] = useState(false);

  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [resultPhrase, setResultPhrase] = useState<string>('');
  
  // Countdown state ("ROCK!", "PAPER!", "SCISSORS!", "SHOOT!")
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(10);

  // Dual Rematch Consensus State
  const [myRematchAgreed, setMyRematchAgreed] = useState(false);
  const [opponentRematchAgreed, setOpponentRematchAgreed] = useState(false);

  const isGameOver = playerScore >= targetPoints || opponentScore >= targetPoints;

  // 10-Second Per-Round Timer Loop: Ticks to 0 BEFORE concluding point
  useEffect(() => {
    if (isAnimating || isGameOver) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Timer reached 0s: Trigger Round Conclusion
          clearInterval(interval);
          triggerRoundConclusion();
          return 0;
        }
        soundEngine.playMove();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnimating, isGameOver, roundCount, playerChoice, isMoveLocked]);

  // Handle Player Selection during the 10s Timer (Locks choice, does NOT conclude early)
  const handleSelectChoice = (choice: RPSChoice) => {
    if (isAnimating || isGameOver || isMoveLocked) return;

    soundEngine.playClick();
    setPlayerChoice(choice);
    setIsMoveLocked(true);
  };

  // Conclude Round ONLY AFTER full 10-Second Timer completes
  const triggerRoundConclusion = () => {
    setIsAnimating(true);
    setRoundResult(null);

    // Auto-pick move if player didn't select before 10s timer expired
    const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];
    const finalPlayerChoice = playerChoice || choices[Math.floor(Math.random() * choices.length)];
    if (!playerChoice) {
      setPlayerChoice(finalPlayerChoice);
    }

    const aiChoice = choices[Math.floor(Math.random() * choices.length)];

    // Trigger Animated Reveal Sequence ("ROCK!", "PAPER!", "SCISSORS!", "SHOOT!")
    const sequence = ['ROCK!', 'PAPER!', 'SCISSORS!', 'SHOOT!'];
    let idx = 0;

    const countInterval = setInterval(() => {
      if (idx < sequence.length) {
        setCountdownText(sequence[idx]);
        soundEngine.playMove();
        idx++;
      } else {
        clearInterval(countInterval);
        setCountdownText(null);
        revealWinner(finalPlayerChoice, aiChoice);
      }
    }, 450);
  };

  // Determine Round Winner & Conclude Point
  const revealWinner = (pChoice: RPSChoice, oChoice: RPSChoice) => {
    setOpponentChoice(oChoice);

    if (pChoice === oChoice) {
      setRoundResult('tie');
      setResultPhrase(`Both chose ${RPS_RULES[pChoice].name}! It's a Tie!`);
      soundEngine.playMove();
    } else if (RPS_RULES[pChoice].beats === oChoice) {
      setRoundResult('win');
      setResultPhrase(RPS_RULES[pChoice].phrase);
      setPlayerScore((s) => {
        const next = s + 1;
        if (next >= targetPoints) triggerVictoryConfetti();
        return next;
      });
      soundEngine.playCapture();
    } else {
      setRoundResult('lose');
      setResultPhrase(RPS_RULES[oChoice].phrase);
      setOpponentScore((s) => s + 1);
      soundEngine.playCheck();
    }

    // Reset move selection & timer for the next round
    setTimeout(() => {
      setIsAnimating(false);
      setIsMoveLocked(false);
      setPlayerChoice(null);
      setOpponentChoice(null);
      setTimerSeconds(10);
      setRoundCount((r) => r + 1);
    }, 1800);
  };

  const triggerVictoryConfetti = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  };

  // Handle Dual Rematch Consensus & Complete Score Reset
  const handleRequestRematch = () => {
    soundEngine.playClick();
    setMyRematchAgreed(true);

    setTimeout(() => {
      setOpponentRematchAgreed(true);
      setTimeout(() => {
        // Both players agreed -> RESET ALL SCORES & ROUNDS
        setPlayerScore(0);
        setOpponentScore(0);
        setPlayerChoice(null);
        setOpponentChoice(null);
        setIsMoveLocked(false);
        setRoundResult(null);
        setResultPhrase('');
        setRoundCount(1);
        setTimerSeconds(10);
        setIsAnimating(false);
        setMyRematchAgreed(false);
        setOpponentRematchAgreed(false);
      }, 800);
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-8 rounded-3xl bg-[#0B1225]/90 backdrop-blur-2xl border border-pink-400/30 shadow-2xl overflow-hidden select-none">
      
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-900/20 via-transparent to-cyan-900/20 pointer-events-none" />

      {/* Header: Scoreboard & Target Points Goal */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-pink-300 uppercase tracking-widest">
              ROUND {roundCount} • FIRST TO {targetPoints} POINTS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-white">ROCK PAPER SCISSORS ROYALE</h2>
        </div>

        {/* Score Tally */}
        <div className="flex items-center gap-6 bg-[#030611]/80 px-6 py-3 rounded-2xl border border-white/15 shadow-inner">
          <div className="text-center">
            <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold block">YOU</span>
            <span className="text-3xl font-black text-white">{playerScore}</span>
          </div>
          <div className="text-center px-1">
            <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">TARGET</span>
            <span className="text-xs font-bold text-pink-400">{targetPoints} PTS</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-mono uppercase text-pink-400 font-bold block">OPPONENT</span>
            <span className="text-3xl font-black text-white">{opponentScore}</span>
          </div>
        </div>
      </div>

      {/* 10-Second Per-Round Turn Timer Progress Bar */}
      <div className="relative z-10 my-4">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-1">
          <span className="flex items-center gap-1.5 text-pink-300 font-bold uppercase">
            <Clock size={13} />
            <span>ROUND TIMER (CONCLUDES AT 0s)</span>
          </span>
          <span className={`font-bold font-mono ${timerSeconds <= 3 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
            {timerSeconds}s
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-1000"
            style={{ width: `${(timerSeconds / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Battle Arena Stage */}
      <div className="relative z-10 py-8 my-4 rounded-2xl bg-[#030611]/70 border border-white/10 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
        
        {/* Animate Sequence Countdown Overlay ("ROCK!", "PAPER!", "SCISSORS!", "SHOOT!") */}
        <AnimatePresence mode="wait">
          {countdownText && (
            <motion.div
              key={countdownText}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.35, type: 'spring' }}
              className="absolute z-30 text-4xl sm:text-6xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-400 drop-shadow-2xl uppercase"
            >
              {countdownText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revealed Battle Outcome Stage */}
        {!countdownText && playerChoice && opponentChoice ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center gap-8 sm:gap-16">
              {/* Player Reveal Card */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex flex-col items-center p-4 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 text-center shadow-glow-cyan"
              >
                <span className="text-5xl sm:text-6xl">{RPS_RULES[playerChoice].icon}</span>
                <span className="text-xs font-bold font-mono text-cyan-300 mt-2">YOUR CHOICE</span>
              </motion.div>

              <span className="text-2xl font-black text-gray-500">VS</span>

              {/* Opponent Reveal Card */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex flex-col items-center p-4 rounded-2xl bg-pink-500/20 border border-pink-400/50 text-center shadow-glow-cyan"
              >
                <span className="text-5xl sm:text-6xl">{RPS_RULES[opponentChoice].icon}</span>
                <span className="text-xs font-bold font-mono text-pink-400 mt-2">OPPONENT CHOICE</span>
              </motion.div>
            </div>

            {/* Result Toast Banner */}
            {roundResult && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`px-6 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase border shadow-lg ${
                  roundResult === 'win'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-glow-cyan'
                    : roundResult === 'lose'
                    ? 'bg-red-500/20 text-red-300 border-red-400/50'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                }`}
              >
                {resultPhrase}
              </motion.div>
            )}
          </div>
        ) : (
          !countdownText && (
            <div className="text-center space-y-2">
              {isMoveLocked ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-2xl mx-auto shadow-glow-cyan">
                    <ShieldCheck size={28} />
                  </div>
                  <p className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                    MOVE LOCKED ({RPS_RULES[playerChoice!].name})
                  </p>
                  <p className="text-xs text-gray-400">
                    Waiting for timer ({timerSeconds}s) to reach 0s before concluding point...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 text-2xl mx-auto animate-pulse">
                    ✂️
                  </div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    SELECT MOVE BEFORE TIMER EXPIRES ({timerSeconds}s)
                  </p>
                  <p className="text-xs text-gray-400">Point concludes when timer reaches 0s!</p>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Interactive 3D Move Selectors */}
      <div className="relative z-10 grid grid-cols-3 gap-4 pt-2">
        {(Object.keys(RPS_RULES) as RPSChoice[]).map((key) => {
          const rule = RPS_RULES[key];
          const isSelected = playerChoice === key;

          return (
            <button
              key={key}
              disabled={isAnimating || isGameOver || isMoveLocked}
              onClick={() => handleSelectChoice(key)}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${
                isSelected
                  ? 'bg-emerald-500/25 border-emerald-400 shadow-glow-cyan scale-105'
                  : 'bg-[#030611]/80 hover:bg-[#111A25] border-white/15 hover:border-pink-400/50 hover:scale-105 active:scale-95'
              } ${isAnimating || isGameOver || isMoveLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">
                {rule.icon}
              </span>
              <span className="text-xs font-black font-display tracking-widest text-white uppercase flex items-center gap-1">
                {rule.name}
                {isSelected && <ShieldCheck size={14} className="text-emerald-400" />}
              </span>
              <span className="text-[10px] text-gray-400 font-mono hidden sm:block">
                {isSelected ? 'LOCKED IN' : `BEATS ${rule.beats.toUpperCase()}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Match Outcome Victory Screen with Dual Rematch Consensus */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-4xl shadow-glow-cyan">
            {playerScore >= targetPoints ? '🏆' : '💀'}
          </div>

          <h3 className="text-3xl font-black font-display text-white uppercase tracking-wider">
            {playerScore >= targetPoints ? `VICTORY! REACHED ${targetPoints} POINTS` : 'GAME OVER! OPPONENT WINS MATCH'}
          </h3>

          <p className="text-xs text-gray-300">
            Final Score: {playerScore} - {opponentScore} (Target: {targetPoints} Pts)
          </p>

          {/* Dual Rematch Status */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${
              myRematchAgreed ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
            }`}>
              {myRematchAgreed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              <span>YOU: {myRematchAgreed ? 'ACCEPTED' : 'WAITING'}</span>
            </div>

            <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${
              opponentRematchAgreed ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'
            }`}>
              {opponentRematchAgreed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              <span>OPPONENT: {opponentRematchAgreed ? 'ACCEPTED' : 'WAITING'}</span>
            </div>
          </div>

          <button
            disabled={myRematchAgreed}
            onClick={handleRequestRematch}
            className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
              myRematchAgreed
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 active:scale-95 text-white shadow-glow-cyan'
            }`}
          >
            <RefreshCw size={14} className={myRematchAgreed ? 'animate-spin' : ''} />
            <span>{myRematchAgreed ? 'WAITING FOR OPPONENT...' : 'START NEW MATCH (RESET SCORES 0-0)'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
