import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { AiModule } from 'src/ai-blog/ai.module';

@Module({
  providers: [EventsGateway],
  imports: [AiModule],
})
export class EventsModule {}
