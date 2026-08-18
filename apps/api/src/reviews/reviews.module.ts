// 후기 관리(블라인드 처리) 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { AdminReviewsController } from './admin-reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
