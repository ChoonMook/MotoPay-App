// GET /me/points, GET /me/points/history, GET /me/points/grade, POST /me/points/charge — 포인트홈(CU-PNT-01)·
// 포인트 충전(CU-PNT-02)·포인트 내역(CU-PNT-06)·회원 등급 혜택(CU-PNT-07), 로그인한 본인 데이터만 조회/처리
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { MemberGradeRulesService } from '../member-grade-rules/member-grade-rules.service';
import { ChargeMyPointsDto } from './dto/charge-my-points.dto';
import { PointsService } from './points.service';

@ApiTags('points')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/points')
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly memberGradeRulesService: MemberGradeRulesService,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 포인트 요약(CU-PNT-01) — 잔액·총 적립·총 사용' })
  getMySummary(@CurrentUser() user: SafeUser) {
    return this.pointsService.getMySummary(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: '내 포인트 내역(CU-PNT-06) — 전체 내역, 필터는 프론트에서 처리' })
  getMyHistory(@CurrentUser() user: SafeUser) {
    return this.pointsService.getMyHistory(user.id);
  }

  @Get('grade')
  @ApiOperation({ summary: '내 회원 등급 혜택(CU-PNT-07) — 현재 등급·실적·다음 등급·등급별 혜택' })
  getMyGrade(@CurrentUser() user: SafeUser) {
    return this.memberGradeRulesService.getMyGradeInfo(user.id);
  }

  @Post('charge')
  @ApiOperation({ summary: '포인트 충전(CU-PNT-02) — 최소 10,000원, 확정 즉시 적립' })
  charge(@Body() dto: ChargeMyPointsDto, @CurrentUser() user: SafeUser) {
    return this.pointsService.chargeMyPoints(user.id, dto.amount, dto.method);
  }
}
