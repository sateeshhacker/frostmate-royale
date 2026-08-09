import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowUpRight } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';
import { GameId } from '../../hooks/useHeroState.js';

interface GameSelectorCardsProps {
  activeGame: GameId;
  onHoverGame: (gameId: GameId | null) => void;
  onSelectGame: (gameId: GameId) => void;
}

export const GAME_CARDS_DATA: Array<{
  num: string;
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
  borderStyle: string;
  glowStyle: string;
}> = [
  {
    num: '01',
    id: 'chess',
    title: 'CHESS',
    subtitle: 'THINK AHEAD.',
    description: 'Strategy. Patience. Precision.',
    icon: '♟️',
    accentColor: '#8B5CF6',
    borderStyle: 'hover:border-[#8B5CF6]/60',
    glowStyle: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]'
  },
  {
    num: '02',
    id: 'ludo',
    title: 'LUDO',
    subtitle: 'ROLL THE DICE.',
    description: 'Luck. Chaos. Competition.',
    icon: '🎲',
    accentColor: '#D9F84A',
    borderStyle: 'hover:border-[#D9F84A]/60',
    glowStyle: 'hover:shadow-[0_0_25px_rgba(217,248,74,0.25)]'
  },
  {
    num: '03',
    id: 'rps',
    title: 'ROCK PAPER SCISSORS',
    subtitle: 'TRUST YOUR INSTINCT.',
    description: 'Fast. Simple. Unpredictable.',
    icon: '🪨📄✂️',
    accentColor: '#FF6672',
    borderStyle: 'hover:border-[#FF6672]/60',
    glowStyle: 'hover:shadow-[0_0_25px_rgba(255,102,114,0.25)]'
  }
];

export const GameSelectorCards: React.FC<GameSelectorCardsProps> = ({
  activeGame,
  onHoverGame,
  onSelectGame
}) => {
  return (
    <div id="selector-section" className="w-full max-w-[1440px] mx-auto py-8 px-4 sm:px-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#22D3EE] font-bold">
            // COMPACT ARENA SELECTOR
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#F8FAFC] mt-1">
            CHOOSE YOUR ARENA
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#8D9AB2] max-w-md">
          Hover to focus the 3D viewport studio or click to immediately launch into multiplayer combat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {GAME_CARDS_DATA.map((card) => {
          const isFocused = activeGame === card.id;

          return (
            <motion.div
              key={card.id}
              tabIndex={0}
              onMouseEnter={() => {
                soundEngine.playMove();
                onHoverGame(card.id);
              }}
              onMouseLeave={() => {
                onHoverGame(null);
              }}
              onFocus={() => {
                onHoverGame(card.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectGame(card.id);
                }
              }}
              onClick={() => {
                soundEngine.playClick();
                onSelectGame(card.id);
              }}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`relative rounded-2xl p-6 bg-[#0B1225] border border-white/10 ${card.borderStyle} ${card.glowStyle} transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[200px] overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                isFocused ? 'ring-1 ring-white/30 scale-[1.01]' : ''
              }`}
            >
              {/* Top Row: Number & Icon */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-mono font-black tracking-widest"
                  style={{ color: card.accentColor }}
                >
                  {card.num}
                </span>
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {card.icon}
                </span>
              </div>

              {/* Middle: Content */}
              <div className="space-y-1 my-2">
                <span
                  className="text-[10px] font-mono font-extrabold tracking-widest uppercase block"
                  style={{ color: card.accentColor }}
                >
                  {card.subtitle}
                </span>
                <h3 className="text-xl font-black font-display text-[#F8FAFC] tracking-tight group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-[#8D9AB2] font-medium pt-1">
                  {card.description}
                </p>
              </div>

              {/* Bottom Row: Action */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between mt-auto">
                <span className="text-xs font-bold text-[#8D9AB2] group-hover:text-white transition-colors flex items-center gap-1">
                  <span>ENTER ARENA</span>
                  <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>

                <button
                  className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-sm transition-all"
                  style={{
                    backgroundColor: `${card.accentColor}20`,
                    color: card.accentColor,
                    borderColor: `${card.accentColor}40`
                  }}
                >
                  <Play size={12} className="fill-current" />
                  <span>PLAY →</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
