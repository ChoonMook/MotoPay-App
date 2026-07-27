import { Module } from '@nestjs/common';
import { CommonCodesController } from './common-codes.controller';
import { CommonCodesService } from './common-codes.service';

@Module({
  controllers: [CommonCodesController],
  providers: [CommonCodesService],
})
export class CommonCodesModule {}
