// GET /admin/ncpk-reservations, GET /admin/ncpk-reservations/:reservationNo — AD-NCPK-07 신차패키지 시공현황(전체 업체 통합 모니터링)
// 관리자 로그인 전용, 조회 전용(수정 없음)
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { ReservationsService } from './reservations.service';

@ApiTags('admin-reservations')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/ncpk-reservations')
export class AdminReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({
    summary:
      '신차패키지 시공현황 목록(AD-NCPK-07) — 전체 업체 통합, 고객명/예약번호 검색·예약상태·진행상태·딜러사 필터',
  })
  list(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('progressStatus') progressStatus?: string,
    @Query('dealerCompanyId') dealerCompanyId?: string,
  ) {
    return this.reservationsService.adminListPackages({
      keyword,
      status,
      progressStatus,
      dealerCompanyId: dealerCompanyId ? Number(dealerCompanyId) : undefined,
    });
  }

  @Get(':reservationNo')
  @ApiOperation({ summary: '신차패키지 시공현황 상세 — 구성상품·썬팅부위·완료정보·사진 포함' })
  getDetail(@Param('reservationNo') reservationNo: string) {
    return this.reservationsService.adminGetPackageDetail(reservationNo);
  }
}
