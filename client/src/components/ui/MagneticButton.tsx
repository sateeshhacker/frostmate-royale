import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '../../audio/soundEngine.js';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button'
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setPosition({ x: x * 0.25, y: y * 0.25 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    soundEngine.playClick();
    if (onClick) onClick();
  };

  const handleMouseEnter = () => {
    if (!disabled) soundEngine.playHover();
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs font-semibold rounded-xl',
    md: 'px-6 py-3 text-sm font-semibold rounded-xl',
    lg: 'px-8 py-4 text-base font-bold rounded-2xl'
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan hover:shadow-cyan-500/50 border border-cyan-400/30',
    secondary:
      'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple hover:shadow-purple-500/50 border border-purple-400/30',
    gold:
      'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-black font-extrabold shadow-glow-gold hover:shadow-amber-400/60 border border-amber-300/50',
    danger:
      'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-glow-danger hover:shadow-red-500/50 border border-red-400/30',
    glass:
      'bg-white/10 text-white backdrop-blur-lg border border-white/20 hover:bg-white/20 hover:border-white/40 shadow-glass-sm'
  }[variant];

  return (
    <motion.button
      ref={btnRef}
      type={type}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 ${sizeClasses} ${variantClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed filter grayscale' : 'cursor-pointer'
      } ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
};
