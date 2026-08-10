import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager.js';
import { GameManager } from '../services/GameManager.js';
import { PieceColor, LudoColor } from '../types/index.js';

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  return registerSocketHandlers(io, roomManager);
}

export function registerSocketHandlers(io: Server, roomManager: RoomManager) {
  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Connected:', socket.id);

    // Create Room
    socket.on(
      'create_room',
      (data: {
        gameType?: 'chess' | 'ludo';
        maxPlayers?: number;
        timeControlSeconds?: number;
        incSeconds?: number;
        playerName?: string;
        playerAvatar?: string;
        preferredColor?: 'w' | 'b' | 'random';
      }) => {
        const { roomCode, roomState } = roomManager.createRoom({
          gameType: data.gameType || 'chess',
          maxPlayers: data.maxPlayers,
          timeControlSeconds: data.timeControlSeconds,
          incSeconds: data.incSeconds
        });

        const result = roomManager.addPlayer(
          roomCode,
          socket.id,
          data.playerName || 'Creator',
          data.playerAvatar || 'av_alex',
          data.preferredColor
        );

        if (!result) {
          socket.emit('error_message', 'Failed to join newly created room');
          return;
        }

        socket.join(roomCode);
        socket.emit('room_created', {
          roomCode,
          playerColor: result.player.color,
          roomState
        });

        // Set state update callback for Ludo timer ticks
        const roomEntry = roomManager.getRoom(roomCode);
        if (roomEntry && roomEntry.ludoManager) {
          roomEntry.ludoManager.setUpdateCallback((updatedState) => {
            io.to(roomCode).emit('room_state_updated', updatedState);
          });
        }
      }
    );

    // Join Room
    socket.on(
      'join_room',
      (data: { roomCode: string; playerName?: string; playerAvatar?: string }) => {
        const roomCode = data.roomCode.toUpperCase();
        const entry = roomManager.getRoom(roomCode);

        if (!entry) {
          socket.emit('error_message', 'Room not found');
          return;
        }

        const result = roomManager.addPlayer(
          roomCode,
          socket.id,
          data.playerName || 'Guest',
          data.playerAvatar || 'av_zoe'
        );

        if (!result) {
          socket.emit('error_message', 'Could not join room');
          return;
        }

        socket.join(roomCode);
        socket.emit('room_joined', {
          roomCode,
          playerColor: result.player.ludoColor || result.player.color,
          role: result.role,
          roomState: result.roomState
        });

        // Start game if room is full or 2 players joined
        const s = result.roomState;
        if (s.status === 'waiting') {
          if (s.gameType === 'ludo') {
            const joinedCount = Object.values(s.ludoPlayers).filter(Boolean).length;
            if (joinedCount >= s.maxPlayers) {
              s.status = 'playing';
              io.to(roomCode).emit('game_started');
              if (entry.ludoManager) entry.ludoManager.startTurnTimer();
            }
          } else if (s.gameType === 'rps') {
            if (s.whitePlayer && s.blackPlayer) {
              s.status = 'playing';
              io.to(roomCode).emit('game_started');
            }
          } else if (s.whitePlayer && s.blackPlayer) {
            s.status = 'playing';
            io.to(roomCode).emit('game_started');
            entry.gameManager.startTimer(
              (updatedState) => {
                io.to(roomCode).emit('clock_tick', {
                  whiteTimeMs: updatedState.whitePlayer?.timeRemainingMs || 0,
                  blackTimeMs: updatedState.blackPlayer?.timeRemainingMs || 0
                });
              },
              (updatedState) => {
                io.to(roomCode).emit('game_over', {
                  winner: updatedState.winner,
                  winReason: updatedState.winReason || 'Time Expired',
                  roomState: updatedState
                });
              }
            );
          }
        }

        io.to(roomCode).emit('room_state_updated', result.roomState);
      }
    );

    // Make Move (Chess)
    socket.on('make_move', (data: { roomCode: string; from: string; to: string; promotion?: string }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry || !entry.gameManager) return;

      if (entry.state.status === 'waiting') {
        entry.state.status = 'playing';
        entry.gameManager.startTimer(
          (updatedState) => {
            io.to(roomCode).emit('clock_tick', {
              whiteTimeMs: updatedState.whitePlayer?.timeRemainingMs || 0,
              blackTimeMs: updatedState.blackPlayer?.timeRemainingMs || 0
            });
          },
          (updatedState) => {
            io.to(roomCode).emit('game_over', {
              winner: updatedState.winner,
              winReason: updatedState.winReason || 'Time Expired',
              roomState: updatedState
            });
          }
        );
      }

      const res = entry.gameManager.makeMove(data.from, data.to, data.promotion);
      if (!res.success) {
        socket.emit('error_message', res.error || 'Illegal move');
        return;
      }

      const move = entry.state.moveHistory[entry.state.moveHistory.length - 1];
      io.to(roomCode).emit('move_made', {
        move,
        roomState: entry.state,
        soundType: res.move?.captured ? 'capture' : entry.state.isCheck ? 'check' : 'move'
      });

      if (entry.state.status === 'checkmate' || entry.state.status === 'draw') {
        io.to(roomCode).emit('game_over', {
          winner: entry.state.winner,
          winReason: entry.state.winReason || 'Checkmate',
          roomState: entry.state
        });
      }

      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Request Draw (Chess)
    socket.on('request_draw', (data: { roomCode: string }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry) return;

      entry.state.pendingDrawOfferFrom = socket.id;

      const player = entry.state.whitePlayer?.id === socket.id ? entry.state.whitePlayer : entry.state.blackPlayer;
      const playerName = player?.name || 'Player';

      entry.state.chatMessages.push({
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: 'system',
        senderName: 'System',
        text: `🤝 ${playerName} has offered a Draw! Check Actions tab to respond.`,
        timestamp: Date.now(),
        isSystem: true
      });

      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Respond Draw (Chess)
    socket.on('respond_draw', (data: { roomCode: string; accept: boolean }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry) return;

      entry.state.pendingDrawOfferFrom = undefined;

      const responder = entry.state.whitePlayer?.id === socket.id ? entry.state.whitePlayer : entry.state.blackPlayer;
      const responderName = responder?.name || 'Opponent';

      if (data.accept) {
        entry.state.status = 'draw';
        entry.state.winner = 'draw';
        entry.state.winReason = 'Mutual Agreement Draw';
        if (entry.gameManager) entry.gameManager.stopTimer();

        entry.state.lastActionNotice = `🤝 ${responderName} accepted the Draw offer! Game finished as a Draw.`;
        entry.state.chatMessages.push({
          id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: 'system',
          senderName: 'System',
          text: `🤝 ${responderName} accepted the Draw offer! Game finished as a Draw.`,
          timestamp: Date.now(),
          isSystem: true
        });

        io.to(roomCode).emit('game_over', {
          winner: 'draw',
          winReason: 'Mutual Agreement Draw',
          roomState: entry.state
        });
      } else {
        entry.state.lastActionNotice = `❌ ${responderName} declined the Draw offer. Game continues.`;
        entry.state.chatMessages.push({
          id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: 'system',
          senderName: 'System',
          text: `❌ ${responderName} declined the Draw offer. Game continues.`,
          timestamp: Date.now(),
          isSystem: true
        });
      }

      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Request Undo (Chess)
    socket.on('request_undo', (data: { roomCode: string }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry) return;

      entry.state.pendingUndoOfferFrom = socket.id;

      const player = entry.state.whitePlayer?.id === socket.id ? entry.state.whitePlayer : entry.state.blackPlayer;
      const playerName = player?.name || 'Player';

      entry.state.chatMessages.push({
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: 'system',
        senderName: 'System',
        text: `↩️ ${playerName} requested an Undo for the last move! Check Actions tab to respond.`,
        timestamp: Date.now(),
        isSystem: true
      });

      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Respond Undo (Chess)
    socket.on('respond_undo', (data: { roomCode: string; accept: boolean }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry) return;

      entry.state.pendingUndoOfferFrom = undefined;

      const responder = entry.state.whitePlayer?.id === socket.id ? entry.state.whitePlayer : entry.state.blackPlayer;
      const responderName = responder?.name || 'Opponent';

      if (data.accept && entry.gameManager) {
        entry.gameManager.undoMove();

        entry.state.lastActionNotice = `✅ ${responderName} allowed the Undo request! Last move reverted.`;
        entry.state.chatMessages.push({
          id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: 'system',
          senderName: 'System',
          text: `✅ ${responderName} allowed the Undo request! Last move reverted.`,
          timestamp: Date.now(),
          isSystem: true
        });
      } else {
        entry.state.lastActionNotice = `❌ ${responderName} refused the Undo request. Game continues.`;
        entry.state.chatMessages.push({
          id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: 'system',
          senderName: 'System',
          text: `❌ ${responderName} refused the Undo request. Game continues.`,
          timestamp: Date.now(),
          isSystem: true
        });
      }

      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Resign Match (Chess)
    socket.on('resign_game', (data: { roomCode: string }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry) return;

      let resigningColor: PieceColor = 'w';
      if (entry.state.whitePlayer?.id === socket.id) resigningColor = 'w';
      else if (entry.state.blackPlayer?.id === socket.id) resigningColor = 'b';

      const winnerColor = resigningColor === 'w' ? 'b' : 'w';
      entry.state.status = 'resigned';
      entry.state.winner = winnerColor;
      entry.state.winReason = `${resigningColor === 'w' ? 'White' : 'Black'} Resigned`;

      if (entry.gameManager) entry.gameManager.stopTimer();

      entry.state.chatMessages.push({
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: 'system',
        senderName: 'System',
        text: `🏳️ ${resigningColor === 'w' ? 'White' : 'Black'} player resigned the match!`,
        timestamp: Date.now(),
        isSystem: true
      });

      io.to(roomCode).emit('game_over', {
        winner: winnerColor,
        winReason: `${resigningColor === 'w' ? 'White' : 'Black'} Resigned`,
        roomState: entry.state
      });

      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Restart / Rematch Game Handler (Chess & General)
    socket.on('restart_game', (data: { roomCode: string }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry) return;

      if (!entry.state.rematchRequestedBy) {
        entry.state.rematchRequestedBy = [];
      }

      if (!entry.state.rematchRequestedBy.includes(socket.id)) {
        entry.state.rematchRequestedBy.push(socket.id);
      }

      const connectedPlayerSockets = [
        entry.state.whitePlayer?.id,
        entry.state.blackPlayer?.id
      ].filter((id) => id && io.sockets.sockets.get(id)?.connected);

      if (connectedPlayerSockets.length <= 1 || entry.state.rematchRequestedBy.length >= connectedPlayerSockets.length) {
        entry.state.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        entry.state.turn = 'w';
        entry.state.status = 'playing';
        entry.state.winner = null;
        entry.state.winReason = undefined;
        entry.state.isCheck = false;
        entry.state.checkSquare = undefined;
        entry.state.lastMove = undefined;
        entry.state.moveHistory = [];
        entry.state.capturedWhite = [];
        entry.state.capturedBlack = [];
        entry.state.rematchRequestedBy = [];
        entry.state.opponentLeft = false;

        if (entry.state.whitePlayer) {
          entry.state.whitePlayer.timeRemainingMs = (entry.state.timeControlSeconds || 600) * 1000;
        }
        if (entry.state.blackPlayer) {
          entry.state.blackPlayer.timeRemainingMs = (entry.state.timeControlSeconds || 600) * 1000;
        }

        entry.gameManager = new GameManager(entry.state);
        entry.gameManager.startTimer(
          (updatedState) => {
            io.to(roomCode).emit('clock_tick', {
              whiteTimeMs: updatedState.whitePlayer?.timeRemainingMs || 0,
              blackTimeMs: updatedState.blackPlayer?.timeRemainingMs || 0
            });
          },
          (updatedState) => {
            io.to(roomCode).emit('game_over', {
              winner: updatedState.winner,
              winReason: updatedState.winReason || 'Time Expired',
              roomState: updatedState
            });
          }
        );

        io.to(roomCode).emit('game_started');
        io.to(roomCode).emit('room_state_updated', entry.state);
      } else {
        io.to(roomCode).emit('room_state_updated', entry.state);
      }
    });

    // Roll Dice (Ludo)
    socket.on('roll_dice', (data: { roomCode: string }) => {
      const entry = roomManager.getRoom(data.roomCode);
      if (!entry || !entry.ludoManager || entry.state.gameType !== 'ludo') return;

      const res = entry.ludoManager.rollDice(socket.id);
      if (!res.success) {
        socket.emit('error_message', res.error || 'Cannot roll dice');
        return;
      }

      io.to(data.roomCode.toUpperCase()).emit('ludo_dice_rolled', {
        diceValue: res.diceValue,
        canMoveTokens: res.canMoveTokens,
        autoPassed: res.autoPassed,
        roomState: entry.state
      });
      io.to(data.roomCode.toUpperCase()).emit('room_state_updated', entry.state);
    });

    // Move Token (Ludo)
    socket.on('move_ludo_token', (data: { roomCode: string; color: LudoColor; tokenId: number }) => {
      const entry = roomManager.getRoom(data.roomCode);
      if (!entry || !entry.ludoManager || entry.state.gameType !== 'ludo') return;

      const res = entry.ludoManager.moveToken(socket.id, data.color, data.tokenId);
      if (!res.success) {
        socket.emit('error_message', res.error || 'Cannot move token');
        return;
      }

      io.to(data.roomCode.toUpperCase()).emit('ludo_token_moved', {
        color: data.color,
        tokenId: data.tokenId,
        captured: res.captured,
        roomState: entry.state
      });
      io.to(data.roomCode.toUpperCase()).emit('room_state_updated', entry.state);
    });

    // Submit RPS Move Handler
    socket.on('submit_rps_move', (data: { roomCode: string; roundId: number; choice: 'rock' | 'paper' | 'scissors' }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry || !entry.rpsManager || entry.state.gameType !== 'rps') return;

      const res = entry.rpsManager.submitMove(socket.id, data.roundId, data.choice);
      if (!res.success) {
        socket.emit('error_message', res.error || 'Cannot submit RPS move');
        return;
      }

      io.to(roomCode).emit('rps_player_locked', {
        lockedPlayerIds: res.lockedPlayerIds,
        roomState: entry.state
      });

      if (res.isRoundComplete && res.result) {
        io.to(roomCode).emit('rps_round_result', {
          result: res.result,
          matchStatus: res.matchStatus,
          roomState: entry.state
        });
      }

      if (res.matchStatus === 'COMPLETE') {
        io.to(roomCode).emit('rps_match_complete', {
          winnerId: entry.state.rpsState?.winnerId,
          scores: entry.state.rpsState?.scores,
          roomState: entry.state
        });
      }

      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Request RPS Rematch Handler
    socket.on('request_rps_rematch', (data: { roomCode: string }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry || !entry.rpsManager || entry.state.gameType !== 'rps') return;

      const res = entry.rpsManager.requestRematch(socket.id);
      if (res.isMatchReset) {
        io.to(roomCode).emit('rps_match_reset', { roomState: entry.state });
      } else {
        io.to(roomCode).emit('rps_rematch_updated', {
          rematchAgreed: entry.state.rpsState?.rematchAgreed,
          roomState: entry.state
        });
      }
      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Send Chat Message Handler
    socket.on('send_chat', (data: { roomCode: string; text: string }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry || !data.text?.trim()) return;

      let senderName = 'Spectator';
      if (entry.state.whitePlayer?.id === socket.id) senderName = entry.state.whitePlayer.name;
      else if (entry.state.blackPlayer?.id === socket.id) senderName = entry.state.blackPlayer.name;
      else if (entry.state.ludoPlayers) {
        const lp = Object.values(entry.state.ludoPlayers).find((p) => p && p.id === socket.id);
        if (lp) senderName = lp.name;
      }

      const msg = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: socket.id,
        senderName,
        text: data.text.trim(),
        timestamp: Date.now()
      };

      entry.state.chatMessages.push(msg);
      io.to(roomCode).emit('chat_received', msg);
      io.to(roomCode).emit('room_state_updated', entry.state);
    });

    // Leave Room Handler
    socket.on('leave_room', () => {
      console.log('[Socket] Player left room:', socket.id);
      roomManager.handleDisconnect(
        socket.id,
        (code, state) => {
          state.opponentLeft = true;
          io.to(code).emit('room_state_updated', state);
        },
        (code, state) => {
          state.opponentLeft = true;
          io.to(code).emit('room_state_updated', state);
          io.to(code).emit('game_over', {
            winner: state.winner,
            winReason: state.winReason || 'Opponent Left',
            roomState: state
          });
        }
      );
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected:', socket.id);
      roomManager.handleDisconnect(
        socket.id,
        (code, state) => {
          state.opponentLeft = true;
          io.to(code).emit('room_state_updated', state);
        },
        (code, state) => {
          state.opponentLeft = true;
          io.to(code).emit('room_state_updated', state);
          io.to(code).emit('game_over', {
            winner: state.winner,
            winReason: state.winReason || 'Opponent Left',
            roomState: state
          });
        }
      );
    });
  });
}
