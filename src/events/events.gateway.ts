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
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Ai blog')
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
  @ApiOperation({ summary: 'Generate an article' })
  @ApiBody({
    description: 'Data needed to generate an article',
    type: Object,
    examples: {
      example1: {
        value: {
          description: 'Your article description here',
          articleLength: '5',
          additionalDescription: 'Any additional description here',
        },
      },
    },
  })
  async handleGenerateArticle(
    @MessageBody()
    data: {
      description: string;
      articleLength: string;
      additionalDescription: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    await this.aiService.generateTextByUserDescription(
      data.description,
      data.articleLength,
      client,
      data.additionalDescription,
    );
  }
}
