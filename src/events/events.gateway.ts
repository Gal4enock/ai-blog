/**
 * WebSocket Gateway for AI blog operations.
 *
 * This gateway handles WebSocket connections and messages related to generating articles.
 * It interacts with the `AiService` to generate text and process files uploaded by the user.
 * The gateway supports receiving user input via WebSocket messages, processing the input,
 * and streaming the generated article parts back to the client in real-time.
 *
 * @class EventsGateway
 * @decorator WebSocketGateway - Marks the class as a WebSocket gateway.
 * @decorator ApiTags - Tags the WebSocket gateway for Swagger documentation.
 * @decorator WebSocketServer - Injects the WebSocket server instance.
 *
 * @constructor - Initializes the gateway with a dependency on the AiService.
 *
 * @method handleConnection - Handles a new WebSocket connection.
 * @method handleDisconnect - Handles a WebSocket disconnection.
 * @method handleGenerateArticle - Handles the 'generateArticle' WebSocket message to generate an article.
 *
 * @param client - The WebSocket client that connects or disconnects.
 * @param data - The data provided by the client for generating the article.
 * @param description - The description provided by the user for generating text.
 * @param articleLength - The length of the article to be generated.
 * @param layoutStructure - The layout structure of the blog post.
 * @param callToAction - The call to action phrase to include in the blog post.
 * @param toneOfVoice - The tone of voice for the blog post.
 * @param languageComplexity - The language complexity for the blog post.
 * @param vocabularyLevel - The vocabulary level for the blog post.
 * @param formalityLevel - The formality level for the blog post.
 * @param tempOfVoice - The tempo of voice for the blog post.
 * @param keywords - The keywords to include in the blog post.
 * @param headings - The headings for the different sections of the blog post.
 * @param subheadings - The subheadings for the different sections of the blog post.
 * @param link - A link to include information from in the blog post.
 * @param sampleText - A sample text to guide the generation of the blog post.
 *
 * @throws HttpException - Throws an exception in case of errors during processing.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import * as path from 'path';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { Server, Socket } from 'socket.io';
import { AiService } from '../ai-blog/ai.service';
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
      client: Socket;
      layoutStructure: string;
      callToAction: string;
      toneOfVoice: string;
      languageComplexity: string;
      vocabularyLevel: string;
      formalityLevel: string;
      tempOfVoice: string;
      keywords: string[];
      sampleText?: string;
      headings?: { introduction: string; mainBody: string; conclusion: string };
      subheadings?: string[];
      link?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const filePath = path.join(__dirname, '../../', 'uploads');

    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) =>
        new PDFLoader(path, {
          splitPages: false,
        }),
      '.PDF': (path) =>
        new PDFLoader(path, {
          splitPages: false,
        }),
    });

    const rawDocs = await directoryLoader.load();
    let infoContentFile: string | undefined;
    let sampleTextFile: string | undefined;
    let sampleKeywordsFile: string | undefined;

    rawDocs.forEach((doc) => {
      if (doc.metadata.source.includes('infoContent')) {
        infoContentFile = doc.pageContent;
      }
      if (doc.metadata.source.includes('sampleText')) {
        sampleTextFile = doc.pageContent;
      }
      if (doc.metadata.source.includes('sampleKeywords')) {
        sampleKeywordsFile = doc.pageContent;
      }
    });

    await this.aiService.generateTextByUserDescription(
      data.description,
      data.articleLength,
      client,
      data.layoutStructure,
      data.callToAction,
      data.toneOfVoice,
      data.languageComplexity,
      data.vocabularyLevel,
      data.formalityLevel,
      data.tempOfVoice,
      data.keywords,
      data.headings,
      data.subheadings,
      data.link,
      infoContentFile,
      sampleTextFile,
      sampleKeywordsFile,
    );
  }
}
