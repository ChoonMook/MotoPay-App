// GET /shops/me/reservations/today, PATCH /shops/me/reservations/:reservationNo/progress, GET /shops/me/reservations/package-stats
// GET /shops/me/reservations/packages, GET /shops/me/reservations/packages/:reservationNo
// — 파트너(시공업체) 로그인 전용, 항상 로그인 계정 소속 업체(shopCode) 기준으로만 조회/수정
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartnerUser } from '../partner-auth/decorators/current-partner-user.decorator';
import { JwtPartnerAuthGuard } from '../partner-auth/guards/jwt-partner-auth.guard';
import type { SafePartnerUser } from '../partner-auth/partner-auth.types';
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
}
