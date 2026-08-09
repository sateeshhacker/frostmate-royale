import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { MagneticButton } from '../ui/MagneticButton.js';
import { useGameStore } from '../../store/useGameStore.js';
import { Copy, Check, Download } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine.js';

export const ExportModal: React.FC = () => {
  const isOpen = useGameStore((s) => s.showExportModal);
  const onClose = () => useGameStore.getState().setShowExportModal(false);
  const roomState = useGameStore((s) => s.roomState);

  const [copiedPgn, setCopiedPgn] = useState(false);
  const [copiedFen, setCopiedFen] = useState(false);

  if (!roomState) return null;

  // Generate PGN format
  const generatePgn = () => {
    let pgn = `[Event "FrostMate Royale"]\n[Site "FrostMate Online"]\n[Date "${new Date().toISOString().slice(0, 10)}"]\n[White "${roomState.whitePlayer?.name || 'White'}"]\n[Black "${roomState.blackPlayer?.name || 'Black'}"]\n[Result "${roomState.winner === 'w' ? '1-0' : roomState.winner === 'b' ? '0-1' : '1/2-1/2'}"]\n\n`;
    
    roomState.moveHistory.forEach((move, idx) => {
      if (idx % 2 === 0) pgn += `${Math.floor(idx / 2) + 1}. `;
      pgn += `${move.san} `;
    });
    return pgn.trim();
  };

  const pgnString = generatePgn();
  const fenString = roomState.fen;

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(pgnString);
    setCopiedPgn(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(fenString);
    setCopiedFen(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedFen(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export PGN & FEN" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* PGN Export */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-300">Portable Game Notation (PGN)</label>
            <button
              onClick={handleCopyPgn}
              className="text-xs text-cyan-300 flex items-center gap-1 hover:text-white"
            >
              {copiedPgn ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedPgn ? 'Copied' : 'Copy PGN'}</span>
            </button>
          </div>
          <textarea
            readOnly
            value={pgnString}
            rows={5}
            className="w-full bg-black/60 border border-white/15 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none custom-scrollbar"
          />
        </div>

        {/* FEN Export */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-300">Forsyth-Edwards Notation (FEN)</label>
            <button
              onClick={handleCopyFen}
              className="text-xs text-cyan-300 flex items-center gap-1 hover:text-white"
            >
              {copiedFen ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedFen ? 'Copied' : 'Copy FEN'}</span>
            </button>
          </div>
          <input
            type="text"
            readOnly
            value={fenString}
            className="w-full bg-black/60 border border-white/15 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  );
};
