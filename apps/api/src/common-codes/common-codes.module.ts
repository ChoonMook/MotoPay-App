import { Module } from '@nestjs/common';
import { AdminCommonCodesController } from './admin-common-codes.controller';
import { CommonCodesController } from './common-codes.controller';
import { CommonCodesService } from './common-codes.service';

@Module({
  controllers: [CommonCodesController, AdminCommonCodesController],
  providers: [CommonCodesService],
})
export class CommonCodesModule {}
