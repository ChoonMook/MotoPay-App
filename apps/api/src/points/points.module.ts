// 포인트 관리 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { MemberGradeRulesModule } from '../member-grade-rules/member-grade-rules.module';
import { AdminPointsController } from './admin-points.controller';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';

@Module({
  imports: [MemberGradeRulesModule],
  controllers: [AdminPointsController, PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
