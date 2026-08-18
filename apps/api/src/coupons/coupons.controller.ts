// GET /me/coupons — 보유 쿠폰함(CU-MYPG-16), 로그인한 본인 발급 내역만 조회
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { CouponsService } from './coupons.service';

@ApiTags('coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: '보유 쿠폰함(CU-MYPG-16) — 발급된 쿠폰 전체' })
  getMyCoupons(@CurrentUser() user: SafeUser) {
    return this.couponsService.getMyCoupons(user.id);
  }
}
