// GET /admin/points, POST /admin/points/grant, POST /admin/points/deduct — AD-PNT-04/05/06 포인트 관리
// 관리자 로그인 전용
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { ForcePointAdjustDto } from './dto/force-point-adjust.dto';
import { GrantPurchasePointsDto } from './dto/grant-purchase-points.dto';
import { PointsService } from './points.service';

@ApiTags('admin-points')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/points')
export class AdminPointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get()
  @ApiOperation({
    summary:
      '포인트 내역 조회(AD-PNT-06) — 회원명 검색·구분·기간·회원id 필터(회원id는 AD-MBR-02 회원 상세 "포인트" 탭 전용)',
  })
  list(
    @Query('keyword') keyword?: string,
    @Query('kind') kind?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('memberId') memberId?: string,
  ) {
    return this.pointsService.adminList({ keyword, kind, dateFrom, dateTo, memberId });
  }

  @Post('grant')
  @ApiOperation({ summary: '포인트 강제 부여(AD-PNT-04) — 사유 필수' })
  grant(@Body() dto: ForcePointAdjustDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.pointsService.adminForceGrant(
      dto.memberId,
      dto.amount,
      dto.reason,
      me.username,
    );
  }

  @Post('deduct')
  @ApiOperation({
    summary: '포인트 강제 차감(AD-PNT-05) — 사유 필수, 보유 포인트 초과 시 에러',
  })
  deduct(@Body() dto: ForcePointAdjustDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.pointsService.adminForceDeduct(
      dto.memberId,
      dto.amount,
      dto.reason,
      me.username,
    );
  }

  @Post('grant-purchase')
  @ApiOperation({
    summary:
      '신차구매 포인트 지급 — 딜러사 신차구매 고객(VIN 기준, 회원 매핑된 건만) 대상 일괄 지급, 행 단위 개별 성공/실패',
  })
  grantPurchase(
    @Body() dto: GrantPurchasePointsDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.pointsService.adminGrantForPurchase(
      dto.items,
      dto.reason,
      me.username,
    );
  }
}
