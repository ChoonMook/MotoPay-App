import { Module } from '@nestjs/common';
import { MsgHubService } from './msg-hub.service';

@Module({
  providers: [MsgHubService],
  exports: [MsgHubService],
})
export class MsgHubModule {}
