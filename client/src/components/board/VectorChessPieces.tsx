import React from 'react';

/**
 * ♟️ High-Focus Tournament Vector Chess Pieces
 * Designed for maximum clarity and zero cognitive eye strain:
 * - White Army: Pure Pearl Ivory (#F8FAFC) with refined charcoal outline
 * - Black Army: Matte Obsidian Slate (#1E293B) with crisp silver outline
 * - Zero distracting neon glare filters to preserve calculation focus!
 */
export const renderPieceSvg = (piece: string, size: number = 45) => {
  const isWhite = piece.startsWith('w');
  const type = piece.charAt(1).toUpperCase();

  // Calm, High-Focus Tournament Palette (No Neon Strain)
  const fill = isWhite ? '#F8FAFC' : '#1E293B';
  const stroke = isWhite ? '#334155' : '#94A3B8';
  const accent = isWhite ? '#64748B' : '#CBD5E1';

  switch (type) {
    case 'P': // Pawn
      return (
        <svg width={size} height={size} viewBox="0 0 45 45" className="filter drop-shadow-sm">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 12,38 L 33,38 C 33,35 30,34 27,34 L 18,34 C 15,34 12,35 12,38 Z" />
            <path d="M 14,34 L 31,34 L 29,30 L 16,30 Z" />
            <path d="M 16.5,30 C 18,22 17,19 22.5,16.5 C 28,19 27,22 28.5,30 Z" />
            <circle cx="22.5" cy="11.5" r="5.5" />
          </g>
          {!isWhite && <circle cx="22.5" cy="11.5" r="3.5" fill="none" stroke={accent} strokeWidth="1" opacity="0.6" />}
        </svg>
      );

    case 'N': // Knight
      return (
        <svg width={size} height={size} viewBox="0 0 45 45" className="filter drop-shadow-sm">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 12,38 L 33,38 C 33,35 30,34 27,34 L 18,34 C 15,34 12,35 12,38 Z" />
            <path d="M 13.5,34 L 31.5,34 L 30,30 L 15,30 Z" />
            <path d="M 15,30 C 15,26 13,23 10.5,20.5 C 14.5,20.5 16.5,13.5 22,9.5 C 25,9.5 27,11 26.5,13 C 28,12 31.5,13 31.5,16.5 C 31.5,19 28.5,21 28,21.5 C 30,22 30.5,24 28,26.5 C 25,29.5 29.5,30 30,30 Z" />
            <circle cx="23.5" cy="14" r="1.2" fill={stroke} />
            <path d="M 19,13 C 21,16 20,22 17,27" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
          </g>
        </svg>
      );

    case 'B': // Bishop
      return (
        <svg width={size} height={size} viewBox="0 0 45 45" className="filter drop-shadow-sm">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 12,38 L 33,38 C 33,35 30,34 27,34 L 18,34 C 15,34 12,35 12,38 Z" />
            <path d="M 14,34 L 31,34 L 29,30 L 16,30 Z" />
            <path d="M 16,30 C 17,23 16,18 22.5,11 C 29,18 28,23 29,30 Z" />
            <circle cx="22.5" cy="8" r="2.2" />
            <path d="M 20,17 L 26,19" stroke={stroke} strokeWidth="1.5" />
          </g>
          {!isWhite && <path d="M 22.5,13 L 22.5,24" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />}
        </svg>
      );

    case 'R': // Rook
      return (
        <svg width={size} height={size} viewBox="0 0 45 45" className="filter drop-shadow-sm">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 11,38 L 34,38 C 34,35 31,34 28,34 L 17,34 C 14,34 11,35 11,38 Z" />
            <path d="M 13.5,34 L 31.5,34 L 30,29 L 15,29 Z" />
            <path d="M 15,29 L 16,17 L 29,17 L 30,29 Z" />
            <path d="M 13.5,17 L 13.5,10 L 17.5,10 L 17.5,13.5 L 20.5,13.5 L 20.5,10 L 24.5,10 L 24.5,13.5 L 27.5,13.5 L 27.5,10 L 31.5,10 L 31.5,17 Z" />
          </g>
        </svg>
      );

    case 'Q': // Queen
      return (
        <svg width={size} height={size} viewBox="0 0 45 45" className="filter drop-shadow-sm">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 10,38 L 35,38 C 35,35 32,34 28,34 L 17,34 C 13,34 10,35 10,38 Z" />
            <path d="M 13,34 L 32,34 L 30,29 L 15,29 Z" />
            <path d="M 15,29 C 16.5,22 14.5,18 22.5,14 C 30.5,18 28.5,22 30,29 Z" />
            <path d="M 12,17.5 L 7,11.5 L 14.5,13.5 L 22.5,8 L 30.5,13.5 L 38,11.5 L 33,17.5 Z" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="14.5" cy="12" r="1.5" />
            <circle cx="22.5" cy="6.5" r="1.8" />
            <circle cx="30.5" cy="12" r="1.5" />
            <circle cx="38" cy="10" r="1.5" />
          </g>
        </svg>
      );

    case 'K': // King
      return (
        <svg width={size} height={size} viewBox="0 0 45 45" className="filter drop-shadow-sm">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M 22.5,4 L 22.5,11 M 19,7.5 L 26,7.5" stroke={stroke} strokeWidth="2" />
            <path d="M 10,38 L 35,38 C 35,35 32,34 28,34 L 17,34 C 13,34 10,35 10,38 Z" />
            <path d="M 13,34 L 32,34 L 30,29 L 15,29 Z" />
            <path d="M 15,29 C 16,21 13.5,16 22.5,12 C 31.5,16 29,21 30,29 Z" />
            <path d="M 16,16 C 19,18 26,18 29,16" fill="none" stroke={stroke} strokeWidth="1.5" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};

export const getVectorCustomPieces = () => {
  const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
  const map: Record<string, (props: { squareWidth: number }) => JSX.Element> = {};

  pieces.forEach((p) => {
    map[p] = ({ squareWidth }) => (
      <div
        style={{
          width: squareWidth,
          height: squareWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none'
        }}
      >
        {renderPieceSvg(p, Math.floor(squareWidth * 0.88))}
      </div>
    );
  });

  return map;
};
