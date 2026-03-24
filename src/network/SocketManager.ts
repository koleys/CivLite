import type { GameState } from '@/game/entities/types';

export interface PlayerInfo {
  id: number;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}

export interface GameRoom {
  code: string;
  hostId: number;
  players: PlayerInfo[];
  settings: Record<string, unknown>;
  state: 'waiting' | 'starting' | 'playing' | 'ended';
}

export interface GameAction {
  type: string;
  playerId: number;
  payload: unknown;
  timestamp: number;
}

export interface StateDelta {
  turn: number;
  actions: GameAction[];
  checksum: string;
}

export type MessageType =
  | 'create_room'
  | 'join_room'
  | 'leave_room'
  | 'rejoin_room'
  | 'player_joined'
  | 'player_left'
  | 'player_ready'
  | 'game_start'
  | 'game_state'
  | 'action'
  | 'action_batch'
  | 'turn_end'
  | 'sync_checkpoint'
  | 'chat_message'
  | 'error'
  | 'ping';

export interface NetworkMessage {
  type: MessageType;
  payload: unknown;
  senderId?: number;
  timestamp: number;
}

export interface MultiplayerConfig {
  serverUrl: string;
  reconnectTimeout: number;
  heartbeatInterval: number;
}

const DEFAULT_CONFIG: MultiplayerConfig = {
  serverUrl: 'wss://civlite-server.example.com',
  reconnectTimeout: 5000,
  heartbeatInterval: 30000,
};

export class SocketManager {
  private ws: WebSocket | null = null;
  private config: MultiplayerConfig;
  private roomCode: string | null = null;
  private playerId: number | null = null;
  private players: Map<number, PlayerInfo> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pendingActions: GameAction[] = [];
  private actionQueue: GameAction[] = [];
  private lastCheckpoint: number = 0;
  private isReconnecting: boolean = false;
  private messageHandlers: Map<MessageType, ((payload: unknown) => void)[]> = new Map();

  private disconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<MultiplayerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  connect(serverUrl?: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const url = serverUrl || this.config.serverUrl;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('Connected to game server');
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: NetworkMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from game server');
          this.stopHeartbeat();
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          resolve(false);
        };
      } catch (error) {
        console.error('Failed to connect:', error);
        resolve(false);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomCode = null;
    this.players.clear();
  }

  private handleDisconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    
    this.disconnectTimeout = setTimeout(() => {
      const timer = setTimeout(() => {
        this.connect().then(() => {
          if (this.roomCode && this.playerId) {
            this.rejoinRoom(this.roomCode, this.playerId);
          }
          this.isReconnecting = false;
        });
      }, this.config.reconnectTimeout);
      void timer;
    }, 5000);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private send(type: MessageType, payload: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: not connected');
      return;
    }

    const message: NetworkMessage = {
      type,
      payload,
      senderId: this.playerId ?? undefined,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(message: NetworkMessage): void {
    switch (message.type) {
      case 'player_joined':
        this.handlePlayerJoined(message.payload as PlayerInfo);
        break;
      case 'player_left':
        this.handlePlayerLeft(message.payload as { playerId: number });
        break;
      case 'game_state':
        this.handleGameState(message.payload as { state: GameState; delta?: StateDelta });
        break;
      case 'action':
        this.handleAction(message.payload as GameAction);
        break;
      case 'action_batch':
        this.handleActionBatch(message.payload as { actions: GameAction[] });
        break;
      case 'sync_checkpoint':
        this.handleCheckpoint(message.payload as StateDelta);
        break;
      case 'chat_message':
        this.handleChatMessage(message.payload as { playerId: number; message: string });
        break;
      case 'error':
        this.handleError(message.payload as { message: string });
        break;
    }

    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.payload));
    }
  }

  on(type: MessageType, handler: (payload: unknown) => void): void {
    const handlers = this.messageHandlers.get(type) || [];
    handlers.push(handler);
    this.messageHandlers.set(type, handlers);
  }

  off(type: MessageType, handler: (payload: unknown) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
  }

  createRoom(hostName: string, settings: Record<string, unknown>): Promise<string> {
    return new Promise((resolve, reject) => {
      const handler = (payload: unknown) => {
        const data = payload as { roomCode: string; playerId: number };
        this.roomCode = data.roomCode;
        this.playerId = data.playerId;
        this.players.set(data.playerId, { id: data.playerId, name: hostName, isHost: true, isConnected: true, isReady: true });
        this.off('create_room', handler);
        resolve(data.roomCode);
      };

      this.on('create_room', handler);
      this.send('create_room', { hostName, settings });

      setTimeout(() => {
        this.off('create_room', handler);
        reject(new Error('Timeout creating room'));
      }, 10000);
    });
  }

  joinRoom(roomCode: string, playerName: string): Promise<PlayerInfo[]> {
    return new Promise((resolve, reject) => {
      const handler = (payload: unknown) => {
        const data = payload as { playerId: number; players: PlayerInfo[] };
        this.roomCode = roomCode;
        this.playerId = data.playerId;
        data.players.forEach((p) => this.players.set(p.id, p));
        this.off('join_room', handler);
        resolve(data.players);
      };

      const errorHandler = (payload: unknown) => {
        const error = payload as { message: string };
        this.off('join_room', handler);
        this.off('error', errorHandler);
        reject(new Error(error.message));
      };

      this.on('join_room', handler);
      this.on('error', errorHandler);
      this.send('join_room', { roomCode, playerName });

      setTimeout(() => {
        this.off('join_room', handler);
        this.off('error', errorHandler);
        reject(new Error('Timeout joining room'));
      }, 10000);
    });
  }

  private rejoinRoom(roomCode: string, playerId: number): void {
    this.send('rejoin_room', { roomCode, playerId });
  }

  leaveRoom(): void {
    this.send('leave_room', { roomCode: this.roomCode });
    this.roomCode = null;
    this.players.clear();
  }

  setPlayerReady(isReady: boolean): void {
    this.send('player_ready', { roomCode: this.roomCode, isReady });
  }

  startGame(): void {
    this.send('game_start', { roomCode: this.roomCode });
  }

  sendAction(action: GameAction): void {
    this.pendingActions.push(action);
    
    if (this.pendingActions.length >= 5) {
      this.flushActions();
    }
  }

  private flushActions(): void {
    if (this.pendingActions.length === 0) return;

    const actions = [...this.pendingActions];
    this.pendingActions = [];
    
    this.send('action_batch', {
      roomCode: this.roomCode,
      actions,
    });
  }

  endTurn(): void {
    this.flushActions();
    this.send('turn_end', { roomCode: this.roomCode });
  }

  sendChatMessage(message: string): void {
    if (!this.playerId) return;
    
    this.send('chat_message', {
      roomCode: this.roomCode,
      playerId: this.playerId,
      message: this.filterChatMessage(message),
    });
  }

  private filterChatMessage(message: string): string {
    const forbiddenWords = ['spam', 'badword'];
    let filtered = message;
    forbiddenWords.forEach((word) => {
      filtered = filtered.replace(new RegExp(word, 'gi'), '***');
    });
    return filtered.slice(0, 500);
  }

  private handlePlayerJoined(player: PlayerInfo): void {
    this.players.set(player.id, player);
  }

  private handlePlayerLeft(data: { playerId: number }): void {
    this.players.delete(data.playerId);
  }

  private handleGameState(data: { state: GameState; delta?: StateDelta }): void {
    void data;
    console.log('Received game state');
  }

  private handleAction(action: GameAction): void {
    this.actionQueue.push(action);
  }

  private handleActionBatch(data: { actions: GameAction[] }): void {
    this.actionQueue.push(...data.actions);
  }

  private handleCheckpoint(delta: StateDelta): void {
    this.lastCheckpoint = delta.turn;
    console.log(`Checkpoint synced at turn ${delta.turn}`);
  }

  private handleChatMessage(data: { playerId: number; message: string }): void {
    const player = this.players.get(data.playerId);
    const name = player?.name || `Player ${data.playerId}`;
    console.log(`[Chat] ${name}: ${data.message}`);
  }

  private handleError(error: { message: string }): void {
    console.error('Server error:', error.message);
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  getPlayerId(): number | null {
    return this.playerId;
  }

  getPlayers(): PlayerInfo[] {
    return Array.from(this.players.values());
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  isHost(): boolean {
    const player = this.playerId !== null ? this.players.get(this.playerId) : null;
    return player?.isHost || false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getQueuedActions(): GameAction[] {
    const actions = [...this.actionQueue];
    this.actionQueue = [];
    return actions;
  }

  getLastCheckpoint(): number {
    return this.lastCheckpoint;
  }
}

let socketManagerInstance: SocketManager | null = null;

export function createSocketManager(config?: Partial<MultiplayerConfig>): SocketManager {
  socketManagerInstance = new SocketManager(config);
  return socketManagerInstance;
}

export function getSocketManager(): SocketManager | null {
  return socketManagerInstance;
}
