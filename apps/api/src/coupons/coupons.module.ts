// 쿠폰 발행/조회 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { MemberGradeRulesModule } from '../member-grade-rules/member-grade-rules.module';
import { AdminCouponsController } from './admin-coupons.controller';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [MemberGradeRulesModule],
  controllers: [AdminCouponsController, CouponsController],
  providers: [CouponsService],
})
export class CouponsModule {}
