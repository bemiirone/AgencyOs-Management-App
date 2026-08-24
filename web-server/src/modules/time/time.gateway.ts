import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { TimeEntryService } from './time-entry.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4200'],
  },
})
@UseGuards(WsJwtGuard)
export class TimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() declare server: Server;

  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly timeEntryService: TimeEntryService) {}

  afterInit(server: Server) {
    console.log('Time WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    console.log(`[WS Gateway] Client connected: ${client.id}`);
    console.log(`[WS Gateway] Query params:`, client.handshake.query);
  }

  async handleDisconnect(client: Socket) {
    console.log(`[WS Gateway] Client disconnected: ${client.id}`);

    const interval = this.timerIntervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(client.id);
    }
  }

  @SubscribeMessage('startTimer')
  async handleStartTimer(
    @MessageBody() data: { timeEntryId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[WS Gateway] startTimer received from ${client.id}:`, data);
    console.log(`[WS Gateway] client.data.user:`, client.data.user);
    const { timeEntryId } = data;

    const timeEntry = await this.timeEntryService.findOne(
      timeEntryId,
      client.data.user?.tenantId,
    );

    console.log(`[WS Gateway] Found timeEntry:`, timeEntry);

    if (timeEntry?.isRunning) {
      console.log(`[WS Gateway] Starting interval for ${client.id}`);
      const interval = setInterval(() => {
        this.server.to(client.id).emit('timerTick', {
          timeEntryId,
          elapsed: Math.floor((Date.now() - timeEntry.startTime.getTime()) / 1000),
        });
      }, 1000);

      this.timerIntervals.set(client.id, interval);
    }

    return { event: 'timerStarted', data: { timeEntryId } };
  }

  @SubscribeMessage('stopTimer')
  async handleStopTimer(
    @MessageBody() data: { timeEntryId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[WS Gateway] stopTimer received from ${client.id}:`, data);
    const { timeEntryId } = data;

    const interval = this.timerIntervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(client.id);
    }

    const timeEntry = await this.timeEntryService.stop(
      timeEntryId,
      client.data.user?.tenantId,
      client.data.user?.userId,
    );

    this.server.to(client.id).emit('timerStopped', {
      timeEntryId,
      duration: timeEntry.duration,
    });

    return { event: 'timerStopped', data: { timeEntryId, duration: timeEntry.duration } };
  }
}
