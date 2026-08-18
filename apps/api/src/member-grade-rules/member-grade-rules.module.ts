// 회원 등급 기준 설정 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { AdminMemberGradeRulesController } from './admin-member-grade-rules.controller';
import { MemberGradeRulesService } from './member-grade-rules.service';

@Module({
  controllers: [AdminMemberGradeRulesController],
  providers: [MemberGradeRulesService],
  exports: [MemberGradeRulesService],
})
export class MemberGradeRulesModule {}
