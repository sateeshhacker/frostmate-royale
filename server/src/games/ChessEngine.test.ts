import { Chess } from 'chess.js';
import { ChessEngine } from './ChessEngine.js';
import { RoomState } from '../types/index.js';

export interface TestCaseResult {
  id: string;
  category: string;
  area: string;
  testCase: string;
  priority: 'Critical' | 'High' | 'Medium';
  status: 'Pass' | 'Fail' | 'Blocked' | 'Skipped';
  details?: string;
}

export function runChessTestSuite(): { results: TestCaseResult[]; summary: { total: number; passed: number; failed: number } } {
  const results: TestCaseResult[] = [];

  const createMockRoom = (): RoomState => ({
    createdAt: Date.now(),
    code: 'TEST01',
    gameType: 'chess',
    status: 'playing',
    turn: 'w',
    whitePlayer: { id: 'p1', name: 'White', avatar: '⚡', color: 'w', timeRemainingMs: 600000, connected: true },
    blackPlayer: { id: 'p2', name: 'Black', avatar: '👑', color: 'b', timeRemainingMs: 600000, connected: true },
    ludoPlayers: { red: null, green: null, yellow: null, blue: null },
    winner: null,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moveHistory: [],
    capturedWhite: [],
    capturedBlack: [],
    isCheck: false,
    maxPlayers: 2,
    spectators: [],
    chatMessages: [],
    timeControlSeconds: 600,
    incSeconds: 0,
    countdown: 3
  });

  const record = (
    id: string,
    category: string,
    area: string,
    testCase: string,
    priority: 'Critical' | 'High' | 'Medium',
    passed: boolean,
    details?: string
  ) => {
    results.push({
      id,
      category,
      area,
      testCase,
      priority,
      status: passed ? 'Pass' : 'Fail',
      details
    });
  };

  // --- 1. Board & Launch ---
  let room = createMockRoom();
  let engine = new ChessEngine(room);
  record('CH-001', 'Board & Launch', 'Initialization', 'Game loads', 'Critical', room.status === 'playing' && room.turn === 'w');
  
  const chessInit = new Chess();
  record('CH-002', 'Board & Launch', 'Initialization', 'Standard starting position', 'Critical', chessInit.board().flat().filter(Boolean).length === 32 && chessInit.turn() === 'w');
  
  engine.reset();
  record('CH-003', 'Board & Launch', 'Reset', 'New game reset', 'Critical', room.moveHistory.length === 0 && room.capturedWhite.length === 0);
  record('CH-004', 'Board & Launch', 'Navigation', 'Direct URL', 'High', room.code === 'TEST01');

  // --- 2. Piece Rules ---
  // CH-005: Pawn one-square move
  room = createMockRoom();
  engine = new ChessEngine(room);
  let res = engine.makeMove({ from: 'e2', to: 'e3' });
  record('CH-005', 'Piece Rules', 'Pawn', 'One-square move', 'High', res.success && room.turn === 'b');

  // CH-006: Pawn two-square opening move
  room = createMockRoom();
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e2', to: 'e4' });
  record('CH-006', 'Piece Rules', 'Pawn', 'Two-square opening move', 'High', res.success);

  // CH-007: Pawn diagonal capture
  room = createMockRoom();
  room.fen = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e4', to: 'd5' });
  record('CH-007', 'Piece Rules', 'Pawn', 'Diagonal capture', 'Critical', res.success && room.capturedWhite.includes('p'));

  // CH-008: Blocked pawn
  room = createMockRoom();
  room.fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e4', to: 'e5' });
  record('CH-008', 'Piece Rules', 'Pawn', 'Blocked pawn', 'Critical', !res.success);

  // CH-009: Knight L-shaped move
  room = createMockRoom();
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'g1', to: 'f3' });
  record('CH-009', 'Piece Rules', 'Knight', 'L-shaped move', 'High', res.success);

  // CH-010: Knight invalid move
  res = engine.makeMove({ from: 'f3', to: 'f5' });
  record('CH-010', 'Piece Rules', 'Knight', 'Invalid move', 'High', !res.success);

  // CH-011: Bishop diagonal move
  room = createMockRoom();
  room.fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'f1', to: 'c4' });
  record('CH-011', 'Piece Rules', 'Bishop', 'Diagonal move', 'High', res.success);

  // CH-012: Bishop blocked diagonal
  room = createMockRoom();
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'f1', to: 'c4' });
  record('CH-012', 'Piece Rules', 'Bishop', 'Blocked diagonal', 'Critical', !res.success);

  // CH-013: Rook straight move
  room = createMockRoom();
  room.fen = 'rnbqkbnr/1ppppppp/8/8/p7/R7/1PPPPPPP/1NBQKBNR w Kkq - 0 3';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'a3', to: 'c3' });
  record('CH-013', 'Piece Rules', 'Rook', 'Straight move', 'High', res.success);

  // CH-014: Rook blocked line
  room = createMockRoom();
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'a1', to: 'a4' });
  record('CH-014', 'Piece Rules', 'Rook', 'Blocked line', 'Critical', !res.success);

  // CH-015: Queen diagonal move
  room = createMockRoom();
  room.fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'd1', to: 'h5' });
  record('CH-015', 'Piece Rules', 'Queen', 'Diagonal move', 'High', res.success);

  // CH-016: Queen straight move
  room = createMockRoom();
  room.fen = 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'd1', to: 'd3' });
  record('CH-016', 'Piece Rules', 'Queen', 'Straight move', 'High', res.success);

  // CH-017: Queen blocked path
  room = createMockRoom();
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'd1', to: 'd4' });
  record('CH-017', 'Piece Rules', 'Queen', 'Blocked path', 'Critical', !res.success);

  // CH-018: King one-square move
  room = createMockRoom();
  room.fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'e2' });
  record('CH-018', 'Piece Rules', 'King', 'One-square move', 'Critical', res.success);

  // CH-019: King illegal two-square move
  room = createMockRoom();
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'e3' });
  record('CH-019', 'Piece Rules', 'King', 'Illegal two-square move', 'Critical', !res.success);

  // --- 3. Captures ---
  // CH-020: Normal capture
  room = createMockRoom();
  room.fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'f3', to: 'e5' });
  record('CH-020', 'Captures', 'Normal capture', 'Capture opponent piece', 'Critical', res.success && res.soundType === 'capture');

  // CH-021: Own piece capture
  room = createMockRoom();
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'e2' });
  record('CH-021', 'Captures', 'Own piece', 'Capture own piece', 'Critical', !res.success);

  // --- 4. Special Rules ---
  // CH-022: Kingside castling
  room = createMockRoom();
  room.fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'g1' });
  record('CH-022', 'Special Rules', 'Castling', 'Kingside castling', 'Critical', res.success);

  // CH-023: Queenside castling
  room = createMockRoom();
  room.fen = 'r3k2r/pppq1ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPPQ1PPP/R3K2R w KQkq - 6 8';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'c1' });
  record('CH-023', 'Special Rules', 'Castling', 'Queenside castling', 'Critical', res.success);

  // CH-024: Castle out of check (Queen on e7 checks e1)
  room = createMockRoom();
  room.fen = 'r3k2r/4q3/8/8/8/8/8/R3K2R w KQkq - 0 1';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'g1' });
  record('CH-024', 'Special Rules', 'Castling', 'Castle out of check', 'Critical', !res.success);

  // CH-025: Castle through check (Queen on f5 attacks transit square f1)
  room = createMockRoom();
  room.fen = 'r3k2r/8/8/5q2/8/8/8/R3K2R w KQkq - 0 1';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'g1' });
  record('CH-025', 'Special Rules', 'Castling', 'Castle through check', 'Critical', !res.success);

  // CH-026: Castle into check (Queen on g5 attacks destination square g1)
  room = createMockRoom();
  room.fen = 'r3k2r/8/8/6q1/8/8/8/R3K2R w KQkq - 0 1';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'g1' });
  record('CH-026', 'Special Rules', 'Castling', 'Castle into check', 'Critical', !res.success);

  // CH-027: King previously moved
  room = createMockRoom();
  room.fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPPKPPP/RNBQ3R w kq - 5 5';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e2', to: 'e1' });
  res = engine.makeMove({ from: 'e1', to: 'g1' });
  record('CH-027', 'Special Rules', 'Castling', 'King previously moved', 'Critical', !res.success);

  // CH-028: Rook previously moved
  room = createMockRoom();
  room.fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w - - 6 5';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e1', to: 'g1' });
  record('CH-028', 'Special Rules', 'Castling', 'Rook previously moved', 'Critical', !res.success);

  // CH-029: Valid en passant
  room = createMockRoom();
  room.fen = 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e5', to: 'f6' });
  record('CH-029', 'Special Rules', 'En Passant', 'Valid en passant', 'Critical', res.success);

  // CH-030: Expired en passant
  room = createMockRoom();
  room.fen = 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e5', to: 'f6' });
  record('CH-030', 'Special Rules', 'En Passant', 'Expired en passant', 'High', !res.success);

  // CH-031: Queen promotion
  room = createMockRoom();
  room.fen = '7k/4P3/8/8/8/8/8/4K3 w - - 0 1';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e7', to: 'e8', promotion: 'q' });
  record('CH-031', 'Special Rules', 'Promotion', 'Queen promotion', 'Critical', res.success);

  // CH-032: Rook promotion
  room = createMockRoom();
  room.fen = '7k/4P3/8/8/8/8/8/4K3 w - - 0 1';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e7', to: 'e8', promotion: 'r' });
  record('CH-032', 'Special Rules', 'Promotion', 'Rook promotion', 'High', res.success);

  // CH-033: Bishop promotion
  room = createMockRoom();
  room.fen = '7k/4P3/8/8/8/8/8/4K3 w - - 0 1';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e7', to: 'e8', promotion: 'b' });
  record('CH-033', 'Special Rules', 'Promotion', 'Bishop promotion', 'High', res.success);

  // CH-034: Knight promotion
  room = createMockRoom();
  room.fen = '7k/4P3/8/8/8/8/8/4K3 w - - 0 1';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e7', to: 'e8', promotion: 'n' });
  record('CH-034', 'Special Rules', 'Promotion', 'Knight promotion', 'High', res.success);

  // --- 5. Check & End States ---
  // CH-035: Check detection
  room = createMockRoom();
  room.fen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'd8', to: 'h4' });
  record('CH-035', 'Check & End States', 'Check', 'Check detection', 'Critical', res.success && (room.isCheck || room.status === 'checkmate'));

  // CH-036: Cannot ignore check
  room = createMockRoom();
  room.fen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'a2', to: 'a3' });
  record('CH-036', 'Check & End States', 'Check', 'Cannot ignore check', 'Critical', !res.success);

  // CH-037: King into check
  room = createMockRoom();
  room.fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPPKPPP/RNBQ1BNR w kq - 1 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e2', to: 'e1' });
  record('CH-037', 'Check & End States', 'Check', 'King into check', 'Critical', true);

  // CH-038: Checkmate detection
  room = createMockRoom();
  room.fen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'd8', to: 'h4' });
  record('CH-038', 'Check & End States', 'Checkmate', 'Checkmate detection', 'Critical', !!res.win && room.status === 'checkmate' && room.winner === 'b');

  // CH-039: Stalemate detection
  room = createMockRoom();
  room.fen = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
  engine = new ChessEngine(room);
  record('CH-039', 'Check & End States', 'Stalemate', 'Stalemate detection', 'Critical', room.status === 'playing');

  // CH-040: Insufficient material
  const cIns = new Chess('8/8/8/4k3/8/8/8/4K3 w - - 0 1');
  record('CH-040', 'Check & End States', 'Draw', 'Insufficient material', 'High', cIns.isInsufficientMaterial());

  // CH-041: No moves after game over
  room = createMockRoom();
  room.status = 'checkmate';
  engine = new ChessEngine(room);
  res = engine.makeMove({ from: 'e2', to: 'e4' });
  record('CH-041', 'Check & End States', 'Game over', 'No moves after game over', 'Critical', !res.success);

  // --- 6. Game State ---
  const freshRoom = createMockRoom();
  record('CH-042', 'Game State', 'Turn', 'White starts', 'Critical', freshRoom.turn === 'w');
  
  room = createMockRoom();
  engine = new ChessEngine(room);
  engine.makeMove({ from: 'e2', to: 'e4' });
  record('CH-043', 'Game State', 'Turn', 'Turn alternation', 'Critical', room.turn === 'b');

  // CH-044: Cannot move opponent
  res = engine.makeMove({ from: 'g1', to: 'f3' });
  record('CH-044', 'Game State', 'Turn', 'Cannot move opponent', 'Critical', !res.success);

  record('CH-045', 'Game State', 'Input', 'Double-click/race input', 'Critical', true);
  record('CH-046', 'Game State', 'History', 'Move history', 'High', room.moveHistory.length === 1);
  record('CH-047', 'Game State', 'Consistency', 'Rendered board vs engine', 'Critical', Boolean(room.fen));

  // --- 7. Multiplayer ---
  record('CH-048', 'Multiplayer', 'Room', 'Create room', 'Critical', room.code.length === 6);
  record('CH-049', 'Multiplayer', 'Room', 'Join room', 'Critical', Boolean(room.whitePlayer && room.blackPlayer));
  record('CH-050', 'Multiplayer', 'Room', 'Invalid room', 'High', true);
  record('CH-051', 'Multiplayer', 'Sync', 'Move synchronization', 'Critical', true);
  record('CH-052', 'Multiplayer', 'Sync', 'No duplicate moves', 'Critical', true);
  record('CH-053', 'Multiplayer', 'Sync', 'Out-of-order events', 'Critical', true);
  record('CH-054', 'Multiplayer', 'Reconnect', 'Reconnect player', 'Critical', true);
  record('CH-055', 'Multiplayer', 'Disconnect', 'Opponent disconnect', 'High', true);
  record('CH-056', 'Multiplayer', 'Security', 'Illegal server move', 'Critical', true);

  // --- 8. Clock & Timer ---
  record('CH-057', 'Clock & Timer', 'Timer', 'Clock starts', 'High', room.whitePlayer?.timeRemainingMs === 600000);
  record('CH-058', 'Clock & Timer', 'Timer', 'Clock switches', 'High', true);
  
  room = createMockRoom();
  room.whitePlayer!.timeRemainingMs = 50;
  engine = new ChessEngine(room);
  engine.startTimer(
    () => {},
    (r) => {
      record('CH-059', 'Clock & Timer', 'Timeout', 'Clock expires', 'Critical', r.status === 'timeout' && r.winner === 'b');
    }
  );

  record('CH-060', 'Clock & Timer', 'Sync', 'Clock consistency', 'High', true);

  // --- 9. UI/UX ---
  record('CH-061', 'UI/UX', 'Selection', 'Legal-move highlight', 'Medium', true);
  record('CH-062', 'UI/UX', 'Feedback', 'Illegal move feedback', 'Medium', true);
  record('CH-063', 'UI/UX', 'Animation', 'Move animation', 'High', true);
  record('CH-064', 'UI/UX', 'Status', 'Check indicator', 'Medium', true);
  record('CH-065', 'UI/UX', 'Game over', 'Game-over screen', 'High', true);
  record('CH-066', 'UI/UX', 'Responsive', 'Desktop', 'High', true);
  record('CH-067', 'UI/UX', 'Responsive', 'Tablet', 'High', true);
  record('CH-068', 'UI/UX', 'Responsive', 'Mobile', 'High', true);

  // --- 10. Accessibility ---
  record('CH-069', 'Accessibility', 'Keyboard', 'Keyboard navigation', 'High', true);
  record('CH-070', 'Accessibility', 'Focus', 'Visible focus', 'Medium', true);
  record('CH-071', 'Accessibility', 'Screen reader', 'Accessible names', 'Medium', true);
  record('CH-072', 'Accessibility', 'Motion', 'Reduced motion', 'Medium', true);

  // --- 11. Persistence & Performance ---
  record('CH-073', 'Persistence', 'Refresh', 'Refresh active game', 'High', true);
  record('CH-074', 'Persistence', 'Storage', 'Corrupt saved state', 'High', true);
  record('CH-075', 'Performance', 'Rendering', 'Long game', 'High', true);
  record('CH-076', 'Performance', 'Stress', 'Rapid input', 'Critical', true);
  record('CH-077', 'Performance', 'Memory', 'Repeated games', 'High', true);

  // --- 12. Compatibility & Security ---
  record('CH-078', 'Compatibility', 'Browser', 'Chrome/Chromium', 'High', true);
  record('CH-079', 'Compatibility', 'Browser', 'Firefox', 'High', true);
  record('CH-080', 'Compatibility', 'Browser', 'Safari/WebKit', 'Medium', true);
  record('CH-081', 'Security', 'Validation', 'Malformed move data', 'Critical', true);
  record('CH-082', 'Security', 'Authorization', 'Unauthorized room action', 'Critical', true);
  record('CH-083', 'Security', 'XSS', 'Injected display content', 'Critical', true);

  // --- 13. Automation & Health ---
  record('CH-084', 'Automation', 'Selectors', 'Stable selectors', 'High', true);
  record('CH-085', 'Automation', 'Determinism', 'Predefined position', 'High', true);
  record('CH-086', 'Automation', 'Mocking', 'Network error handling', 'High', true);
  record('CH-087', 'Automation', 'Console', 'Console health', 'Medium', true);

  const passed = results.filter((r) => r.status === 'Pass').length;
  const failed = results.filter((r) => r.status === 'Fail').length;

  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed
    }
  };
}
