// POST /reservations(예약 생성)/GET /reservations/me(내 예약 목록)/PATCH /reservations/:id/cancel(취소)/PATCH /reservations/:id/reschedule(일정변경) — 로그인 필요
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
  ) {
    return this.reservationsService.create({
      shopCode,
      date,
      time,
      reservationType,
      memberId: user.id,
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
}
