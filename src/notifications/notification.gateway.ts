import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(NotificationGateway.name);

  private userSockets = new Map<string, Socket[]>();

  constructor(
    private readonly jwt: JwtService,
  ) {}

  // async handleConnection(socket: Socket) {
  //   try {
  //     const token = socket.handshake.auth.token;
  //     const payload = this.jwt.verify(token);
  //     const userId = payload.sub;
      
  //     if (!this.userSockets.has(userId)) {
  //       this.userSockets.set(userId, []);
  //     }
  //     // this.userSockets.get(userId).push(socket);
  //     this.userSockets.get().push(socket);

  //     socket.on('disconnect', () => this.handleDisconnect(socket, userId));
  //   } catch (e) {
  //     socket.disconnect();
  //   }
  // }
  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token;
      const payload = this.jwt.verify(token);
      const userId = payload.sub;
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(socket);

      socket.on('disconnect', () => this.handleDisconnect(socket));
    } catch (e) {
      this.logger.error(`Connection error: ${e.message}`);
      socket.disconnect();
    }
  }









  // handleDisconnect(socket: Socket, userId: string) {
  //   const sockets = this.userSockets.get(userId);
  //   if (sockets) {
  //     const index = sockets.indexOf(socket);
  //     if (index > -1) {
  //       sockets.splice(index, 1);
  //     }
  //     if (sockets.length === 0) {
  //       this.userSockets.delete(userId);
  //     }
  //   }
  // }
  handleDisconnect(socket: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(socket);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }








  async notifyUser(userId: string, message: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socket => socket.emit('notification', message));
    }
  }
}



// import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { JwtService } from '@nestjs/jwt';
// import { UsersService } from '../users/users.service';

// @WebSocketGateway({
//   cors: {
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//   },
//   namespace: 'notifications',
// })
// export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   private userSockets = new Map<string, Socket[]>();

//   constructor(
//     private jwt: JwtService,
//     private users: UsersService,
//   ) {}

//   async handleConnection(socket: Socket) {
//     try {
//       const token = socket.handshake.auth.token;
//       const payload = this.jwt.verify(token);
//       const userId = payload.sub;
      
//       if (!this.userSockets.has(userId)) {
//         this.userSockets.set(userId, []);
//       }
//       this.userSockets.get(userId).push(socket);

//       socket.on('disconnect', () => this.handleDisconnect(socket, userId));
//     } catch (e) {
//       socket.disconnect();
//     }
//   }

//   handleDisconnect(socket: Socket, userId: string) {
//     const sockets = this.userSockets.get(userId);
//     if (sockets) {
//       const index = sockets.indexOf(socket);
//       if (index > -1) {
//         sockets.splice(index, 1);
//       }
//       if (sockets.length === 0) {
//         this.userSockets.delete(userId);
//       }
//     }
//   }

//   async notifyUser(userId: string, message: any) {
//     const sockets = this.userSockets.get(userId);
//     if (sockets) {
//       sockets.forEach(socket => socket.emit('notification', message));
//     }
//   }

//   async notifyUsers(userIds: string[], message: any) {
//     userIds.forEach(userId => this.notifyUser(userId, message));
//   }
// }