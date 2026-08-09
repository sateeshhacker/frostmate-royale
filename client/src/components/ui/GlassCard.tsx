import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '../../audio/soundEngine.js';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverEffect || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6; // max 6deg
    const rotateY = ((x - centerX) / centerX) * 6;  // max 6deg

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    if (!hoverEffect) return;
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  const handleMouseEnter = () => {
    if (hoverEffect) soundEngine.playHover();
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      style={{ transform, transition: 'transform 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)' }}
      className={`relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-glass-md transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:border-cyan-400/40 hover:shadow-glow-cyan' : ''
      } ${className}`}
    >
      {/* Dynamic Cursor Light Reflection / Glare */}
      {hoverEffect && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.12), transparent 40%)`
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
