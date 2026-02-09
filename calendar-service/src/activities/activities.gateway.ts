import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppLogger } from '../common/logger/logger.service';
import type { ActivityResponseDto } from '../common/dto';

@WebSocketGateway({
  cors: {
    // TODO: In production, restrict to frontend domain
    origin: '*',
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
   * Notify all clients viewing a specific activity that it has been updated
   */
  notifyActivityUpdate(activityId: number, data: ActivityResponseDto) {
    this.logger.log(`Notifying clients about activity ${activityId} update`);
    this.logger.log(
      `Currently viewing activities: ${JSON.stringify(Array.from(this.viewingActivities.entries()))}`
    );

    // Find all clients viewing this activity
    let notifiedCount = 0;
    for (const [clientId, activityIds] of this.viewingActivities.entries()) {
      if (activityIds.has(activityId)) {
        this.logger.log(`Sending update to client ${clientId}`);
        this.server.to(clientId).emit('dataUpdated', {
          activityId,
          ...data,
        });
        notifiedCount++;
      }
    }
    this.logger.log(`Notified ${notifiedCount} client(s)`);

    // Also broadcast to activities table subscribers
    this.broadcastActivityUpdated(data);
  }

  /**
   * Broadcast to all clients subscribed to the activities table that a new activity was created
   */
  broadcastActivityCreated(data: ActivityResponseDto) {
    this.logger.log(`Broadcasting activity created: ${data.id}`);
    this.server.to('activities-table').emit('activityCreated', data);
  }

  /**
   * Broadcast to all clients subscribed to the activities table that an activity was updated
   */
  broadcastActivityUpdated(data: ActivityResponseDto) {
    this.logger.log(`Broadcasting activity updated: ${data.id}`);
    this.server.to('activities-table').emit('activityUpdated', data);
  }
}
