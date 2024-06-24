import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AiService } from '../ai-blog/ai.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly aiService: AiService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('generateArticle')
  async handleGenerateArticle(
    @MessageBody()
    data: {
      description: string;
      articleLength: string;
      additionalDescription: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('here');

    await this.aiService.generateTextByUserDescription(
      data.description,
      data.articleLength,
      client,
      data.additionalDescription,
    );
  }
}
