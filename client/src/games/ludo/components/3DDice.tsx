import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '../../shared/audio/soundEngine.js';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  onRoll: () => void;
  disabled?: boolean;
}

export const Dice3D: React.FC<Dice3DProps> = ({ value, isRolling, onRoll, disabled }) => {
  const [spinCount, setSpinCount] = useState(0);

  const handleClick = () => {
    if (disabled || isRolling) return;
    soundEngine.playMove();
    setSpinCount((prev) => prev + 1);
    onRoll();
  };

  // Helper to render pips/dots on 3x3 grid
  const renderPips = (val: number) => {
    const pips: boolean[] = Array(9).fill(false);
    if (val === 1) pips[4] = true;
    else if (val === 2) { pips[0] = true; pips[8] = true; }
    else if (val === 3) { pips[0] = true; pips[4] = true; pips[8] = true; }
    else if (val === 4) { pips[0] = true; pips[2] = true; pips[6] = true; pips[8] = true; }
    else if (val === 5) { pips[0] = true; pips[2] = true; pips[4] = true; pips[6] = true; pips[8] = true; }
    else if (val === 6) { pips[0] = true; pips[2] = true; pips[3] = true; pips[5] = true; pips[6] = true; pips[8] = true; }

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-10 h-10 p-1 pointer-events-none">
        {pips.map((active, idx) => (
          <div key={idx} className="flex items-center justify-center">
            {active && (
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 shadow-inner" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-1">
      <motion.button
        onClick={handleClick}
        disabled={disabled || isRolling}
        animate={{
          rotate: isRolling ? [0, 90, 180, 270, 360] : spinCount * 360,
          scale: isRolling ? [1, 1.2, 0.95, 1] : 1
        }}
        transition={{ duration: isRolling ? 0.5 : 0.3, ease: 'easeInOut' }}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-white via-cyan-50 to-cyan-200 border-2 border-white flex items-center justify-center shadow-glow-cyan transition-transform ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95 shadow-2xl'
        }`}
      >
        {isRolling ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.3 }}
            className="text-2xl"
          >
            🎲
          </motion.div>
        ) : value && value >= 1 && value <= 6 ? (
          renderPips(value)
        ) : (
          <span className="text-2xl drop-shadow-md">🎲</span>
        )}

        {/* Specular Light Reflective Layer */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
      </motion.button>
    </div>
  );
};
