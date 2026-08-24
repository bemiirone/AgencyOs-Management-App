import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { StorageService } from './storage.service';

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected';

interface PendingHandler {
  event: string;
  handler: (...args: unknown[]) => void;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private storageService = inject(StorageService);

  private socket: Socket | null = null;
  private _status = signal<WebSocketStatus>('disconnected');
  private pendingHandlers: PendingHandler[] = [];

  status = computed(() => this._status());

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.storageService.getToken();
    if (!token) return;

    this._status.set('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || '3000';
    const url = `${protocol}//${host}:${port}`;

    this.socket = io(url, {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected:', this.socket?.id);
      this._status.set('connected');
      for (const pending of this.pendingHandlers) {
        this.socket!.on(pending.event, pending.handler);
      }
      this.pendingHandlers = [];
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      this._status.set('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error.message);
      this._status.set('disconnected');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._status.set('disconnected');
  }

  on<T>(event: string, handler: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, handler);
    } else {
      this.pendingHandlers.push({ event, handler: handler as (...args: unknown[]) => void });
    }
  }

  off(event: string, handler?: (...args: unknown[]) => void): void {
    if (!this.socket) return;
    this.socket.off(event, handler);
  }

  emit(event: string, data: unknown): void {
    if (!this.socket?.connected) {
      console.warn(`[WS] Cannot emit "${event}" - not connected`);
      return;
    }
    console.log(`[WS] Emitting "${event}":`, data);
    this.socket.emit(event, data);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
