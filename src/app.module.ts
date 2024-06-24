import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from './ai-blog/ai.module';
import { AiService } from './ai-blog/ai.service';
import { Post, PostSchema } from './ai-blog/schemas/post.schema';
import { AiController } from './ai-blog/ai.controller';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.DATABASE_URL || ''),
    AiModule,
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AiService, AiController],
})
export class AppModule {}
