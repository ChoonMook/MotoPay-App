// 시공업체 스케줄 관리 API — 조회는 공개.
// 휴무일/예약가능 시간대/일자별 정원 등록·수정은 모두 파트너 로그인 + 본인 소속 업체인지 검증(assertOwnShop).
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartnerUser } from '../partner-auth/decorators/current-partner-user.decorator';
import { JwtPartnerAuthGuard } from '../partner-auth/guards/jwt-partner-auth.guard';
import type { SafePartnerUser } from '../partner-auth/partner-auth.types';
import { ShopScheduleService, TimeSlotInput } from './shop-schedule.service';

@ApiTags('shops')
@Controller('shops/:shopCode')
export class ShopScheduleController {
  constructor(private readonly scheduleService: ShopScheduleService) {}

  private assertOwnShop(partnerUser: SafePartnerUser, shopCode: string) {
    if (partnerUser.shopCode !== shopCode) {
      throw new ForbiddenException('본인 소속 업체만 관리할 수 있습니다.');
    }
  }

  @Get('holidays')
  @ApiOperation({ summary: '업체 휴무일 조회 — year/month 기준 월 단위' })
  listHolidays(
    @Param('shopCode') shopCode: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.scheduleService.listHolidays(
      shopCode,
      Number(year),
      Number(month),
    );
  }

  @Post('holidays')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '업체 휴무일 일괄 등록(휴무일 일괄 적용, 파트너 로그인 전용·본인 소속 업체만)',
  })
  async addHolidays(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('shopCode') shopCode: string,
    @Body('dates') dates: string[],
  ) {
    this.assertOwnShop(partnerUser, shopCode);
    await this.scheduleService.addHolidays(shopCode, dates);
    return { success: true };
  }

  @Delete('holidays/:date')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '업체 휴무일 개별 해제(파트너 로그인 전용·본인 소속 업체만)',
  })
  async removeHoliday(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('shopCode') shopCode: string,
    @Param('date') date: string,
  ) {
    this.assertOwnShop(partnerUser, shopCode);
    await this.scheduleService.removeHoliday(shopCode, date);
    return { success: true };
  }

  @Get('time-slots')
  @ApiOperation({ summary: '요일구분(dayType)별 예약가능 시간대 템플릿 조회' })
  getTimeSlots(
    @Param('shopCode') shopCode: string,
    @Query('dayType') dayType: string,
  ) {
    return this.scheduleService.getTimeSlots(shopCode, dayType);
  }

  @Put('time-slots/:dayType')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '요일구분별 예약가능 시간대 템플릿 저장(전체 교체, 파트너 로그인 전용·본인 소속 업체만)',
  })
  async replaceTimeSlots(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('shopCode') shopCode: string,
    @Param('dayType') dayType: string,
    @Body('slots') slots: TimeSlotInput[],
  ) {
    this.assertOwnShop(partnerUser, shopCode);
    await this.scheduleService.replaceTimeSlots(shopCode, dayType, slots);
    return { success: true };
  }

  @Get('schedule/monthly')
  @ApiOperation({
    summary: '월간 예약 현황 요약 — 일자별 예약건수·휴무여부·잠금여부',
  })
  getMonthlySummary(
    @Param('shopCode') shopCode: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.scheduleService.getMonthlySummary(
      shopCode,
      Number(year),
      Number(month),
    );
  }

  @Get('schedule')
  @ApiOperation({
    summary:
      '일자별 예약 현황 조회 — 시간대별 정원·잠금여부·예약 목록을 병합해 응답',
  })
  getDailySchedule(
    @Param('shopCode') shopCode: string,
    @Query('date') date: string,
  ) {
    return this.scheduleService.getDailySchedule(shopCode, date);
  }

  @Patch('daily-slots')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '특정 일자·시간의 정원/잠금 오버라이드(파트너 로그인 전용·본인 소속 업체만)',
  })
  async upsertDailySlot(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('shopCode') shopCode: string,
    @Body('date') date: string,
    @Body('time') time: string,
    @Body('capacity') capacity?: number,
    @Body('isLocked') isLocked?: boolean,
  ) {
    this.assertOwnShop(partnerUser, shopCode);
    await this.scheduleService.upsertDailySlot(shopCode, {
      date,
      time,
      capacity,
      isLocked,
    });
    return { success: true };
  }
}
