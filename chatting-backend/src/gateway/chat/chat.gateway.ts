import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    const username = client.handshake.query.username as string;
    console.log('Client connected:', client.id, 'Username:', username);

    if (!username) {
      client.disconnect();
      return;
    }

    this.onlineUsers.set(client.id, username);
    this.server.emit('user-list', this.getUserList());
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    this.onlineUsers.delete(client.id);
    this.server.emit('user-list', this.getUserList());
  }

  private getUserList() {
    return Array.from(this.onlineUsers.entries()).map(([socketId, username]) => ({
      socketId,
      username,
    }));
  }

  @SubscribeMessage('private-message')
  handlePrivateMessage(
    @MessageBody() payload: { to: string; from: string; message: string },
  ) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.server.to(payload.to).emit('receive-message', {
      from: payload.from,
      message: payload.message,
      time,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() payload: { to: string; from: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(payload.to).emit('typing', { from: payload.from });
  }
}
