// POST /reservations(예약 생성)/GET /reservations/me(내 예약 목록)/PATCH /reservations/:id/cancel(취소)/PATCH /reservations/:id/reschedule(일정변경)
// /PATCH /reservations/:id/pay(결제 확정)/PATCH /reservations/:id/resched-accept·resched-reject(파트너 일정변경요청 수락·거절)
// /GET /reservations/:id/handover(시공완료·인수확인 상세)/PATCH /reservations/:id/handover-confirm(인수확인)
// /GET·POST /reservations/:id/review(후기 조회·등록) — 로그인 필요
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { ReservationsService } from './reservations.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RejectReschedDto } from './dto/reject-resched.dto';

@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({
    summary: '시공 예약 생성 — 휴무일·정원·잠금 검증 후 예약번호 자동 채번',
  })
  create(
    @CurrentUser() user: SafeUser,
    @Body('shopCode') shopCode: string,
    @Body('date') date: string,
    @Body('time') time: string,
    @Body('reservationType') reservationType: string,
    @Body('selectedItems')
    selectedItems?: { componentCode: string; price: number }[],
    @Body('tintPositions')
    tintPositions?: { position: string; level: string }[],
  ) {
    return this.reservationsService.create({
      shopCode,
      date,
      time,
      reservationType,
      memberId: user.id,
      selectedItems,
      tintPositions,
    });
  }

  @Get('me')
  @ApiOperation({ summary: '내 예약 목록 조회' })
  listMine(@CurrentUser() user: SafeUser) {
    return this.reservationsService.listMine(user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary:
      '예약 취소 — 확정 상태·미래 일정만 가능, 취소 사유·일시를 함께 저장',
  })
  cancel(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @Body('reasonEtc') reasonEtc?: string,
  ) {
    return this.reservationsService.cancel(user.id, id, { reason, reasonEtc });
  }

  @Patch(':id/reschedule')
  @ApiOperation({
    summary: '일정 변경 — 확정 상태만 가능, 새 일시도 휴무일·정원·잠금 검증',
  })
  reschedule(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body('date') date: string,
    @Body('time') time: string,
  ) {
    return this.reservationsService.reschedule(user.id, id, { date, time });
  }

  @Patch(':id/pay')
  @ApiOperation({
    summary:
      '결제 확정(CU-RSVC-14) — 업체/추천안 선정으로 생성된 예약에 쿠폰/포인트/결제수단/최종금액을 기록, 예약당 1회만 가능',
  })
  confirmPayment(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.reservationsService.confirmPayment(user.id, id, dto);
  }

  @Patch(':id/resched-accept')
  @ApiOperation({
    summary:
      '파트너 일정변경 요청 수락(CU-RSVC-21) — 실제 일정을 파트너가 제안한 일시로 변경',
  })
  acceptResched(@CurrentUser() user: SafeUser, @Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.acceptResched(user.id, id);
  }

  @Patch(':id/resched-reject')
  @ApiOperation({
    summary: '파트너 일정변경 요청 거절(CU-RSVC-21) — 기존 일정 유지, 거절 사유는 선택 입력',
  })
  rejectResched(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectReschedDto,
  ) {
    return this.reservationsService.rejectResched(user.id, id, dto.reason);
  }

  @Get(':id/package-items')
  @ApiOperation({
    summary:
      '신차패키지 선택 내역(CU-NCPK-09/CU-RSVC-20) — 예약확정 시점에 저장된 시공 항목·제품·가격, 썬팅 부위별 농도를 진행상태 상관없이 조회',
  })
  getPackageSelection(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.getPackageSelection(user.id, id);
  }

  @Get(':id/handover')
  @ApiOperation({
    summary:
      '시공완료·인수확인 상세(CU-RSVC-16/CU-NCPK-10) — 완료된 시공 사진·메모·구매 항목, 완료일로부터 3일 경과 시 자동 확정',
  })
  getHandoverDetail(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reservationsService.getHandoverDetail(user.id, id);
  }

  @Patch(':id/handover-confirm')
  @ApiOperation({ summary: '인수확인 — 시공완료 상태에서만 가능, 1회만 가능' })
  async confirmHandover(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.reservationsService.confirmHandover(user.id, id);
    return { success: true };
  }

  @Get(':id/review')
  @ApiOperation({ summary: '후기 조회 — 작성한 후기가 없으면 review: null' })
  async getReview(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return { review: await this.reservationsService.getReview(user.id, id) };
  }

  @Post(':id/review')
  @ApiOperation({
    summary: '후기 등록(CU-RSVC-17) — 시공완료 상태에서 예약당 1회만 가능',
  })
  createReview(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reservationsService.createReview(user.id, id, dto);
  }
}
