// 관리자웹 범용 업로드(리치텍스트 에디터 본문 이미지 등) 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { AdminContentImageController } from './admin-content-image.controller';

@Module({
  controllers: [AdminContentImageController],
})
export class UploadsModule {}
