import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ACCESS_TOKEN_COOKIE, type AuthUser } from '@corpcal/shared';

import { AuthService, type JwtPayload } from '../auth/auth.service';
import { getCorsAllowedOrigins } from '../common/config/cors-allowed-origins';
import { AppLogger } from '../common/logger/logger.service';

/** Id-only payloads so field-level HTTP redaction cannot be bypassed via WebSocket. */
type ActivityTableSocketPayload = { activityId: number };

export type LockHandoffPendingPayload = {
  activityId: number;
  graceEndsAt: string;
  counterpartUsername: string;
  role: 'holder' | 'requester';
};

@WebSocketGateway({
  cors: {
    origin: getCorsAllowedOrigins(),
    credentials: true,
  },
})
@Injectable()
export class ActivitiesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new AppLogger(ActivitiesGateway.name);
  private readonly viewingActivities = new Map<string, Set<number>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService
  ) {}

  afterInit(server: Server): void {
    server.use((socket, next) => {
      const token = this.extractAccessToken(socket);
      if (!token) {
        next();
        return;
      }
      try {
        const payload = this.jwtService.verify<JwtPayload>(token);
        socket.data.authUser = this.authService.validatePayload(payload);
      } catch {
        // Invalid token: still allow connection for anonymous viewers
      }
      next();
    });
  }

  private extractAccessToken(socket: Socket): string | null {
    const auth = socket.handshake.auth as { token?: string } | undefined;
    if (auth?.token && typeof auth.token === 'string') {
      return auth.token;
    }
    const header = socket.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return null;
    const prefix = `${ACCESS_TOKEN_COOKIE}=`;
    const part = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(prefix));
    if (!part) return null;
    return decodeURIComponent(part.slice(prefix.length));
  }

  handleConnection(client: Socket) {
    const user = client.data.authUser as AuthUser | undefined;
    if (user) {
      void client.join(`user:${user.id}`);
    }
    this.logger.log(
      `Client connected: ${client.id}${user ? ` userId=${user.id}` : ''}`
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.viewingActivities.delete(client.id);
    void client.leave('activities-table');
  }

  @SubscribeMessage('viewActivity')
  handleViewActivity(client: Socket, activityId: number) {
    this.logger.debug(`Client ${client.id} is viewing activity ${activityId}`);

    let viewing = this.viewingActivities.get(client.id);
    if (!viewing) {
      viewing = new Set();
      this.viewingActivities.set(client.id, viewing);
    }

    viewing.add(activityId);
  }

  @SubscribeMessage('leaveActivity')
  handleLeaveActivity(client: Socket, activityId: number) {
    this.logger.debug(`Client ${client.id} left activity ${activityId}`);

    const viewing = this.viewingActivities.get(client.id);
    if (viewing) {
      viewing.delete(activityId);
    }
  }

  @SubscribeMessage('subscribeToActivities')
  handleSubscribeToActivities(client: Socket) {
    this.logger.debug(
      `Client ${client.id} subscribed to activities table updates`
    );
    void client.join('activities-table');
  }

  @SubscribeMessage('unsubscribeFromActivities')
  handleUnsubscribeFromActivities(client: Socket) {
    this.logger.debug(
      `Client ${client.id} unsubscribed from activities table updates`
    );
    void client.leave('activities-table');
  }

  /**
   * Notify all clients viewing a specific activity that it has been updated.
   * Emits id-only payloads; clients refetch via HTTP where field-level redaction applies.
   */
  notifyActivityUpdate(activityId: number) {
    this.logger.log(`Notifying clients about activity ${activityId} update`);
    this.logger.debug(
      `viewingActivities map size=${this.viewingActivities.size} (deferred from PATCH handler)`
    );

    const payload: ActivityTableSocketPayload = { activityId };

    let notifiedCount = 0;
    for (const [clientId, activityIds] of this.viewingActivities.entries()) {
      if (activityIds.has(activityId)) {
        this.logger.log(`Sending update to client ${clientId}`);
        this.server.to(clientId).emit('dataUpdated', payload);
        notifiedCount++;
      }
    }
    this.logger.log(`Notified ${notifiedCount} client(s)`);

    this.broadcastActivityUpdated(activityId);
  }

  broadcastActivityCreated(activityId: number) {
    this.logger.log(`Broadcasting activity created: ${activityId}`);
    const payload: ActivityTableSocketPayload = { activityId };
    this.server.to('activities-table').emit('activityCreated', payload);
  }

  broadcastActivityUpdated(activityId: number) {
    this.logger.log(`Broadcasting activity updated: ${activityId}`);
    const payload: ActivityTableSocketPayload = { activityId };
    this.server.to('activities-table').emit('activityUpdated', payload);
  }

  notifyLockAcquired(
    activityId: number,
    lockedBy: { userId: number; username: string }
  ) {
    this.logger.log(
      `Notifying viewers of activity ${activityId}: lock acquired by ${lockedBy.username}`
    );
    for (const [clientId, activityIds] of this.viewingActivities.entries()) {
      if (activityIds.has(activityId)) {
        this.server.to(clientId).emit('lockAcquired', { activityId, lockedBy });
      }
    }
  }

  notifyLockReleased(activityId: number) {
    this.logger.log(
      `Notifying viewers of activity ${activityId}: lock released`
    );
    for (const [clientId, activityIds] of this.viewingActivities.entries()) {
      if (activityIds.has(activityId)) {
        this.server.to(clientId).emit('lockReleased', { activityId });
      }
    }
  }

  /**
   * Targeted toast for lock holder or admin requester only (not all activity viewers).
   */
  notifyLockHandoffPending(
    userId: number,
    payload: LockHandoffPendingPayload
  ): void {
    this.server.to(`user:${userId}`).emit('lockHandoffPending', payload);
  }
}
