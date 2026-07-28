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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TimeEntryService } from './time-entry.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },
})
@UseGuards(JwtAuthGuard)
export class TimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly timeEntryService: TimeEntryService) {}

  afterInit(server: Server) {
    console.log('Time WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

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
    const { timeEntryId } = data;

    const timeEntry = await this.timeEntryService.findOne(
      client.data.user?.tenantId,
      timeEntryId,
    );

    if (timeEntry?.isRunning) {
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
