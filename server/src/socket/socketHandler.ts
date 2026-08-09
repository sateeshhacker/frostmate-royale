import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager.js';
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
          data.playerAvatar || '⚡',
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
          data.playerAvatar || '🚀'
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
          } else if (s.whitePlayer && s.blackPlayer) {
            s.status = 'playing';
            io.to(roomCode).emit('game_started');
          }
        }

        io.to(roomCode).emit('room_state_updated', result.roomState);
      }
    );

    // Roll Dice (Ludo) - Anti-Cheat Server Socket Validation
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

    // Move Token (Ludo) - Anti-Cheat Server Socket Validation
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

    // Submit RPS Move Handler (Authoritative Server Validation)
    socket.on('submit_rps_move', (data: { roomCode: string; roundId: number; choice: 'rock' | 'paper' | 'scissors' }) => {
      const roomCode = data.roomCode?.toUpperCase();
      const entry = roomManager.getRoom(roomCode);
      if (!entry || !entry.rpsManager || entry.state.gameType !== 'rps') return;

      const res = entry.rpsManager.submitMove(socket.id, data.roundId, data.choice);
      if (!res.success) {
        socket.emit('error_message', res.error || 'Cannot submit RPS move');
        return;
      }

      // Notify room that a player locked their move
      io.to(roomCode).emit('rps_player_locked', {
        lockedPlayerIds: res.lockedPlayerIds,
        roomState: entry.state
      });

      // If both players locked in for this round, broadcast authoritative result to BOTH clients
      if (res.isRoundComplete && res.result) {
        io.to(roomCode).emit('rps_round_result', {
          result: res.result,
          matchStatus: res.matchStatus,
          roomState: entry.state
        });
      }

      // Broadcast match complete if goal reached
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
        (code, state) => io.to(code).emit('room_state_updated', state),
        (code, state) => {
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
        (code, state) => io.to(code).emit('room_state_updated', state),
        (code, state) => {
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
