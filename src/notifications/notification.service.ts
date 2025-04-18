import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(private notificationGateway: NotificationGateway) {}

  async notifyUser(userId: string, message: any) {
    await this.notificationGateway.notifyUser(userId, message);
  }

  async notifyUsers(userIds: string[], message: any) {
    userIds.forEach(userId => this.notifyUser(userId, message));
  }
}