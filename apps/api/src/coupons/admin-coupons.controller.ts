// GET /admin/coupons, GET /admin/coupons/:couponNo, GET /admin/coupons/preview-target-count,
// GET /admin/coupons/member/:memberId, POST /admin/coupons — AD-CPN-02(쿠폰 발행)·AD-CPN-03(쿠폰 내역 조회)·
// AD-MBR-02(회원 상세 "쿠폰" 탭), 관리자 로그인 전용
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { CouponsService } from './coupons.service';
import { IssueCouponDto } from './dto/issue-coupon.dto';

@ApiTags('admin-coupons')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({
    summary: '쿠폰 내역 목록(AD-CPN-03) — 발행주체·상태·발행일 기간 필터',
  })
  list(
    @Query('issuerType') issuerType?: string,
    @Query('status') status?: 'ACTIVE' | 'CLOSED',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.couponsService.adminList({ issuerType, status, dateFrom, dateTo });
  }

  @Get('preview-target-count')
  @ApiOperation({ summary: '쿠폰 발행 대상고객 미리보기(AD-CPN-02) — 전체/조건별' })
  previewTargetCount(
    @Query('targetType') targetType: string,
    @Query('targetGrade') targetGrade?: string,
  ) {
    return this.couponsService.previewTargetCount(targetType, targetGrade);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: '특정 회원에게 발급된 쿠폰 전체(AD-MBR-02 회원 상세 "쿠폰" 탭)' })
  listForMember(@Param('memberId') memberId: string) {
    return this.couponsService.adminListForMember(memberId);
  }

  @Get(':couponNo')
  @ApiOperation({ summary: '쿠폰 상세 — 개별 발급·사용 내역 포함' })
  getDetail(@Param('couponNo') couponNo: string) {
    return this.couponsService.adminGetDetail(couponNo);
  }

  @Post()
  @ApiOperation({ summary: '쿠폰 발행(AD-CPN-02) — 발행 즉시 대상 회원 확정' })
  issue(@Body() dto: IssueCouponDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.couponsService.adminIssue(dto, me.username);
  }
}
