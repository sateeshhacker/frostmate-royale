import { RoomState } from '../types/index.js';

export interface ActionResult {
  success: boolean;
  error?: string;
  soundType?: 'move' | 'capture' | 'check' | 'checkmate' | 'dice';
  win?: boolean;
}

export interface IGameEngine {
  makeMove(payload: any): ActionResult;
  handleAction(actionType: string, payload: any): ActionResult;
  reset(): void;
}
