import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { getCorsAllowedOrigins } from '../common/config/cors-allowed-origins';
import { AppLogger } from '../common/logger/logger.service';

/** Id-only payloads so field-level HTTP redaction cannot be bypassed via WebSocket. */
type ActivityTableSocketPayload = { activityId: number };

@WebSocketGateway({
  cors: {
    origin: getCorsAllowedOrigins(),
    credentials: true,
  },
})
export class ActivitiesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new AppLogger(ActivitiesGateway.name);
  private readonly viewingActivities = new Map<string, Set<number>>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.viewingActivities.delete(client.id);
    // Remove client from activities-table room
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
    // Join a room for table-level updates
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

    // Find all clients viewing this activity
    let notifiedCount = 0;
    for (const [clientId, activityIds] of this.viewingActivities.entries()) {
      if (activityIds.has(activityId)) {
        this.logger.log(`Sending update to client ${clientId}`);
        this.server.to(clientId).emit('dataUpdated', payload);
        notifiedCount++;
      }
    }
    this.logger.log(`Notified ${notifiedCount} client(s)`);

    // Also broadcast to activities table subscribers
    this.broadcastActivityUpdated(activityId);
  }

  /**
   * Broadcast to all clients subscribed to the activities table that a new activity was created
   */
  broadcastActivityCreated(activityId: number) {
    this.logger.log(`Broadcasting activity created: ${activityId}`);
    const payload: ActivityTableSocketPayload = { activityId };
    this.server.to('activities-table').emit('activityCreated', payload);
  }

  /**
   * Broadcast to all clients subscribed to the activities table that an activity was updated
   */
  broadcastActivityUpdated(activityId: number) {
    this.logger.log(`Broadcasting activity updated: ${activityId}`);
    const payload: ActivityTableSocketPayload = { activityId };
    this.server.to('activities-table').emit('activityUpdated', payload);
  }

  /**
   * Notify all clients viewing a specific activity that a lock was acquired.
   */
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

  /**
   * Notify all clients viewing a specific activity that the lock was released.
   */
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
}
