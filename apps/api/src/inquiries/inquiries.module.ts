// 1:1 문의 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { AdminInquiriesController } from './admin-inquiries.controller';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  controllers: [InquiriesController, AdminInquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
