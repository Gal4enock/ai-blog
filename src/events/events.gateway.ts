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
  async handleGenerateArticle(
    @MessageBody()
    data: {
      description: string;
      articleLength: string;
      layoutStructure: string;
      callToAction: string;
      headings?: { introduction: string; mainBody: string; conclusion: string };
      subheadings?: string[];
      link?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    await this.aiService.generateTextByUserDescription(
      data.description,
      data.articleLength,
      client,
      data.layoutStructure,
      data.callToAction,
      data.headings,
      data.subheadings,
      data.link,
    );
  }
}
