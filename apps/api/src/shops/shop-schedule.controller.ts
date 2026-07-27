// 시공업체 스케줄 관리 API — 휴무일 조회는 공개, 등록/수정은 로그인 필요(업체 소유권 검증은 아직 없음, CLAUDE.md 참고)
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShopScheduleService, TimeSlotInput } from './shop-schedule.service';

@ApiTags('shops')
@Controller('shops/:shopCode')
export class ShopScheduleController {
  constructor(private readonly scheduleService: ShopScheduleService) {}

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '업체 휴무일 일괄 등록(휴무일 일괄 적용)' })
  addHolidays(
    @Param('shopCode') shopCode: string,
    @Body('dates') dates: string[],
  ) {
    return this.scheduleService.addHolidays(shopCode, dates);
  }

  @Delete('holidays/:date')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '업체 휴무일 개별 해제' })
  removeHoliday(
    @Param('shopCode') shopCode: string,
    @Param('date') date: string,
  ) {
    return this.scheduleService.removeHoliday(shopCode, date);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '요일구분별 예약가능 시간대 템플릿 저장(전체 교체)',
  })
  replaceTimeSlots(
    @Param('shopCode') shopCode: string,
    @Param('dayType') dayType: string,
    @Body('slots') slots: TimeSlotInput[],
  ) {
    return this.scheduleService.replaceTimeSlots(shopCode, dayType, slots);
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 일자·시간의 정원/잠금 오버라이드' })
  upsertDailySlot(
    @Param('shopCode') shopCode: string,
    @Body('date') date: string,
    @Body('time') time: string,
    @Body('capacity') capacity?: number,
    @Body('isLocked') isLocked?: boolean,
  ) {
    return this.scheduleService.upsertDailySlot(shopCode, {
      date,
      time,
      capacity,
      isLocked,
    });
  }
}
