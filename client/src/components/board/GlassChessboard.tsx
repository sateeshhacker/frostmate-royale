import React, { useState, useMemo, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore.js';
import { emitMakeMove } from '../../socket/socketClient.js';
import { soundEngine } from '../../audio/soundEngine.js';

export const GlassChessboard: React.FC = () => {
  const roomState = useGameStore((s) => s.roomState);
  const playerColor = useGameStore((s) => s.playerColor);
  const userRole = useGameStore((s) => s.userRole);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  // Trigger tension audio on check
  useEffect(() => {
    if (roomState?.isCheck) {
      soundEngine.setTensionMode(true);
    } else {
      soundEngine.setTensionMode(false);
    }
  }, [roomState?.isCheck]);

  // Local chess instance to calculate legal moves synchronously
  const game = useMemo(() => {
    return new Chess(roomState?.fen || undefined);
  }, [roomState?.fen]);

  const boardOrientation = playerColor === 'b' ? 'black' : 'white';
  const isMyTurn =
    userRole === 'player' &&
    (roomState?.status === 'playing' || roomState?.status === 'waiting') &&
    (playerColor ? roomState?.turn === playerColor : true);

  // Calculate legal target squares for a selected square
  const getMoveOptions = (square: string) => {
    const moves = game.moves({
      square: square as any,
      verbose: true
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, any> = {};
    moves.forEach((move) => {
      const isCapture = !!game.get(move.to as any);
      newSquares[move.to] = {
        background: isCapture
          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.85) 30%, transparent 35%)'
          : 'radial-gradient(circle, rgba(56, 189, 248, 0.7) 22%, transparent 27%)',
        borderRadius: '50%'
      };
    });

    newSquares[square] = {
      backgroundColor: 'rgba(56, 189, 248, 0.25)',
      boxShadow: 'inset 0 0 8px rgba(56, 189, 248, 0.6)'
    };

    setOptionSquares(newSquares);
    return true;
  };

  const handleSquareClick = (square: string) => {
    if (!isMyTurn) return;

    if (!selectedSquare) {
      const hasMoves = getMoveOptions(square);
      if (hasMoves) {
        setSelectedSquare(square);
        soundEngine.playHover();
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      const piece = game.get(square as any);
      if (piece && piece.color === (playerColor === 'b' ? 'b' : 'w')) {
        const hasMoves = getMoveOptions(square);
        if (hasMoves) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
          setOptionSquares({});
        }
        return;
      }

      attemptMove(selectedSquare, square);
      setSelectedSquare(null);
      setOptionSquares({});
    }
  };

  const onPieceDrop = (sourceSquare: string, targetSquare: string): boolean => {
    if (!isMyTurn) return false;
    const success = attemptMove(sourceSquare, targetSquare);
    setSelectedSquare(null);
    setOptionSquares({});
    return success;
  };

  const attemptMove = (from: string, to: string): boolean => {
    const piece = game.get(from as any);
    const isPawn = piece?.type === 'p';
    const isPromotionRank = (piece?.color === 'w' && to[1] === '8') || (piece?.color === 'b' && to[1] === '1');

    if (isPawn && isPromotionRank) {
      setPromotionMove({ from, to });
      return true;
    }

    try {
      const validMove = game.move({ from, to, promotion: 'q' });
      if (validMove) {
        emitMakeMove(from, to, 'q');
        return true;
      }
    } catch (e) {}
    return false;
  };

  const handlePromotionChoice = (pieceType: string) => {
    if (promotionMove) {
      emitMakeMove(promotionMove.from, promotionMove.to, pieceType);
      setPromotionMove(null);
    }
  };

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, any> = { ...optionSquares };

    if (roomState?.lastMove) {
      styles[roomState.lastMove.from] = {
        ...(styles[roomState.lastMove.from] || {}),
        backgroundColor: 'rgba(124, 58, 237, 0.25)',
        border: '1px solid rgba(124, 58, 237, 0.5)'
      };
      styles[roomState.lastMove.to] = {
        ...(styles[roomState.lastMove.to] || {}),
        backgroundColor: 'rgba(124, 58, 237, 0.35)',
        boxShadow: 'inset 0 0 10px rgba(124, 58, 237, 0.6)'
      };
    }

    if (roomState?.isCheck && roomState.checkSquare) {
      styles[roomState.checkSquare] = {
        ...(styles[roomState.checkSquare] || {}),
        backgroundColor: 'rgba(239, 68, 68, 0.65)',
        boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)',
        animation: 'pulse 0.8s infinite alternate'
      };
    }

    return styles;
  }, [optionSquares, roomState?.lastMove, roomState?.isCheck, roomState?.checkSquare]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Universal Tournament Board Stage */}
      <motion.div
        initial={{ scale: 1.02, opacity: 0.95 }}
        animate={{
          scale: 1,
          opacity: 1,
          x: roomState?.isCheck ? [-3, 3, -3, 3, 0] : 0,
          y: roomState?.isCheck ? [2, -2, 2, -2, 0] : 0
        }}
        transition={{
          scale: { duration: 0.8, ease: 'easeOut' },
          x: roomState?.isCheck ? { repeat: Infinity, duration: 0.25 } : { duration: 0.3 }
        }}
        className="relative group p-2.5 sm:p-3 rounded-3xl bg-[#080E1B] backdrop-blur-2xl border border-white/15 shadow-2xl"
      >
        {/* Universal Tournament Chessboard Container */}
        <div className="relative z-10 w-[240px] sm:w-[300px] md:w-[340px] lg:w-[380px] xl:w-[410px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <Chessboard
            position={roomState?.fen || 'start'}
            onPieceDrop={onPieceDrop}
            onSquareClick={handleSquareClick}
            boardOrientation={boardOrientation}
            customBoardStyle={{
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)'
            }}
            customDarkSquareStyle={{
              backgroundColor: '#1E293B'
            }}
            customLightSquareStyle={{
              backgroundColor: '#334155'
            }}
            customSquareStyles={customSquareStyles}
            animationDuration={220}
            arePiecesDraggable={isMyTurn}
          />
        </div>

        {/* Promotion Dialog Modal */}
        {promotionMove && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg rounded-3xl p-6">
            <div className="text-center">
              <h4 className="text-sm font-bold text-cyan-300 mb-4 font-display uppercase tracking-wider">
                Select Promotion Piece
              </h4>
              <div className="flex gap-3 justify-center">
                {[
                  { name: 'Queen', key: 'q', icon: '♛' },
                  { name: 'Rook', key: 'r', icon: '♜' },
                  { name: 'Bishop', key: 'b', icon: '♝' },
                  { name: 'Knight', key: 'n', icon: '♞' }
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePromotionChoice(p.key)}
                    className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-cyan-500/30 border border-white/20 hover:border-cyan-400 text-2xl flex items-center justify-center transition-all transform hover:scale-110 shadow-glow-cyan cursor-pointer"
                  >
                    {p.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
