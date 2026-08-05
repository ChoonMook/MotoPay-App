// GET /shops/me/reservations/today, PATCH /shops/me/reservations/:reservationNo/progress, GET /shops/me/reservations/package-stats
// GET /shops/me/reservations/packages, GET /shops/me/reservations/packages/:reservationNo, PATCH /shops/me/reservations/:reservationNo/complete
// GET /shops/me/reservations/bids, POST/GET /shops/me/reservations/:reservationNo/call-logs
// — 파트너(시공업체) 로그인 전용, 항상 로그인 계정 소속 업체(shopCode) 기준으로만 조회/수정
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartnerUser } from '../partner-auth/decorators/current-partner-user.decorator';
import { JwtPartnerAuthGuard } from '../partner-auth/guards/jwt-partner-auth.guard';
import type { SafePartnerUser } from '../partner-auth/partner-auth.types';
import { CompleteReservationDto } from './dto/complete-reservation.dto';
import { CreateCallLogDto } from './dto/create-call-log.dto';
import { UpdateReservationProgressDto } from './dto/update-reservation-progress.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtPartnerAuthGuard)
@Controller('shops/me/reservations')
export class PartnerReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('today')
  @ApiOperation({ summary: '내 업체의 오늘 예약 목록(파트너 홈 "오늘의 시공 일정")' })
  listToday(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.reservationsService.listTodayForShop(partnerUser.shopCode);
  }

  @Get('package-stats')
  @ApiOperation({
    summary:
      '신차패키지(reservationType=PKG) 예약의 진행상태별 건수(파트너 홈 "신차패키지 시공관리" 통계)',
  })
  getPackageStats(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.reservationsService.getPackageStats(partnerUser.shopCode);
  }

  @Get('packages')
  @ApiOperation({
    summary: '내 업체의 신차패키지 시공 건 목록(PT-NCPK-01) — 상태 무관 전체, 탭 구분은 프론트에서 필터',
  })
  listPackages(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.reservationsService.listPackagesForShop(partnerUser.shopCode);
  }

  @Get('bids')
  @ApiOperation({
    summary: '내 업체의 예약시공(입찰) 시공 건 목록(PT-RSVC-08) — 낙찰 확정된 Reservation(BID) 전체',
  })
  listBidJobs(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.reservationsService.listBidJobsForShop(partnerUser.shopCode);
  }

  @Get('packages/:reservationNo')
  @ApiOperation({
    summary: '신차패키지 시공 상세(PT-NCPK-02) — 고객·차량·패키지 구성상품 포함',
  })
  getPackageDetail(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('reservationNo') reservationNo: string,
  ) {
    return this.reservationsService.getPackageJobDetail(
      partnerUser.shopCode,
      reservationNo,
    );
  }

  @Patch(':reservationNo/progress')
  @ApiOperation({ summary: '예약 시공 진행상태 변경(신청/시공중/완료)' })
  async updateProgress(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('reservationNo') reservationNo: string,
    @Body() dto: UpdateReservationProgressDto,
  ) {
    await this.reservationsService.updateProgress(
      partnerUser.shopCode,
      reservationNo,
      dto.progressStatus,
    );
    return { success: true };
  }

  @Patch(':reservationNo/complete')
  @ApiOperation({
    summary:
      '시공 완료 등록(PT-NCPK-04) — 시공중 상태에서만 가능, 시공 사진(3~10장)·작업 메모 저장 후 진행상태를 완료로 전환',
  })
  async completeReservation(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('reservationNo') reservationNo: string,
    @Body() dto: CompleteReservationDto,
  ) {
    await this.reservationsService.completeReservation(
      partnerUser.shopCode,
      reservationNo,
      dto,
    );
    return { success: true };
  }

  @Post(':reservationNo/call-logs')
  @ApiOperation({ summary: '해피콜(고객 확인 전화) 이력 등록(PT-RSVC-03)' })
  async addCallLog(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('reservationNo') reservationNo: string,
    @Body() dto: CreateCallLogDto,
  ) {
    await this.reservationsService.addCallLog(
      partnerUser.shopCode,
      reservationNo,
      dto,
    );
    return { success: true };
  }

  @Get(':reservationNo/call-logs')
  @ApiOperation({ summary: '해피콜 이력 목록(최신순)' })
  listCallLogs(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('reservationNo') reservationNo: string,
  ) {
    return this.reservationsService.listCallLogs(
      partnerUser.shopCode,
      reservationNo,
    );
  }
}
