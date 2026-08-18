// GET /admin/member-grade-rules, PATCH /admin/member-grade-rules/:gradeCode — AD-PNT-07 회원 등급 기준 설정
// 관리자 로그인 전용
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { UpdateMemberGradeRuleDto } from './dto/update-member-grade-rule.dto';
import { MemberGradeRulesService } from './member-grade-rules.service';

@ApiTags('admin-member-grade-rules')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/member-grade-rules')
export class AdminMemberGradeRulesController {
  constructor(private readonly memberGradeRulesService: MemberGradeRulesService) {}

  @Get()
  @ApiOperation({ summary: '회원 등급 기준 설정 목록(AD-PNT-07) — GOLD/SILVER/BRONZE 3건' })
  list() {
    return this.memberGradeRulesService.list();
  }

  @Patch(':gradeCode')
  @ApiOperation({ summary: '회원 등급 기준 설정 수정 — 기준금액·할인율·금액권' })
  update(
    @Param('gradeCode') gradeCode: string,
    @Body() dto: UpdateMemberGradeRuleDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.memberGradeRulesService.update(gradeCode, dto, me.username);
  }
}
