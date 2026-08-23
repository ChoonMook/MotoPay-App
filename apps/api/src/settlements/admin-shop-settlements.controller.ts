// POST /admin/settlements/shop-batches/generate, GET /admin/settlements/shop-batches(/:id/items),
// PATCH /admin/settlements/shop-batches/:id/payout — AD-STL-04 정산 내역 조회, 관리자 로그인 전용
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { GenerateShopSettlementBatchDto } from './dto/generate-shop-settlement-batch.dto';
import { UpdateShopSettlementPayoutDto } from './dto/update-shop-settlement-payout.dto';
import { ShopSettlementsService } from './shop-settlements.service';

@ApiTags('admin-shop-settlements')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/settlements/shop-batches')
export class AdminShopSettlementsController {
  constructor(private readonly shopSettlementsService: ShopSettlementsService) {}

  @Post('generate')
  @ApiOperation({
    summary:
      '정산 배치 생성(AD-STL-04) — 대상월에 인수확인 완료된 신차패키지(PKG) 예약을 시공업체별로 집계. 여러 번 실행해도 중복 집계 안 됨',
  })
  generate(@Body() dto: GenerateShopSettlementBatchDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.shopSettlementsService.generate(dto.settlementMonth, me.username);
  }

  @Get()
  @ApiOperation({ summary: '정산 배치 목록 조회(AD-STL-04) — 대상월·시공업체 필터' })
  list(@Query('settlementMonth') settlementMonth?: string, @Query('shopCode') shopCode?: string) {
    return this.shopSettlementsService.list({ settlementMonth, shopCode });
  }

  @Get(':id/items')
  @ApiOperation({ summary: '정산 배치 상세(구성상품·예약 건별 내역) 조회' })
  getItems(@Param('id', ParseIntPipe) id: number) {
    return this.shopSettlementsService.getItems(id);
  }

  @Patch(':id/payout')
  @ApiOperation({ summary: '지급 상태·지급일 수정(지급완료 처리)' })
  updatePayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShopSettlementPayoutDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.shopSettlementsService.updatePayout(id, dto, me.username);
  }
}
