import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class WsJwtGuard extends AuthGuard('ws-jwt') implements CanActivate {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new Error('WebSocket authentication failed');
    }
    const client = context.switchToWs().getClient();
    client.data.user = user;
    return user;
  }
}
