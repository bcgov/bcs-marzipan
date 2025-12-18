import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { AppLogger } from '../common/logger/logger.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
  },
})
export class ActivitiesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new AppLogger(ActivitiesGateway.name);
  private readonly viewingActivities = new Map<string, Set<number>>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.viewingActivities.delete(client.id);
  }

  @SubscribeMessage('viewActivity')
  handleViewActivity(client: Socket, activityId: number) {
    this.logger.debug(`Client ${client.id} is viewing activity ${activityId}`);

    if (!this.viewingActivities.has(client.id)) {
      this.viewingActivities.set(client.id, new Set());
    }

    this.viewingActivities.get(client.id).add(activityId);
  }

  @SubscribeMessage('leaveActivity')
  handleLeaveActivity(client: Socket, activityId: number) {
    this.logger.debug(`Client ${client.id} left activity ${activityId}`);

    const viewing = this.viewingActivities.get(client.id);
    if (viewing) {
      viewing.delete(activityId);
    }
  }

  /**
   * Notify all clients viewing a specific activity that it has been updated
   */
  notifyActivityUpdate(activityId: number, data: any) {
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
  }
}
