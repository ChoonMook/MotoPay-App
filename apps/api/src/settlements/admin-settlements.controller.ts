// GET /admin/settlements/shops, GET/PUT /admin/settlements/products/:productCode/commissions
// — AD-STL-02 정산 기준 관리, 관리자 로그인 전용. 시공업체 기본 수수료 수정은 AD-CO-02 업체관리
// 매장정보 탭(PATCH /admin/companies/:id/shop/settlement)으로 이관됨(2026-08-23)
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { SetProductShopCommissionsDto } from './dto/set-product-shop-commissions.dto';
import { SettlementsService } from './settlements.service';

@ApiTags('admin-settlements')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/settlements')
export class AdminSettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get('shops')
  @ApiOperation({
    summary: '시공업체별 기본 수수료 목록 조회(AD-STL-02 하단 예외 화면의 기본값 힌트 표시용)',
  })
  listShopCommissions() {
    return this.settlementsService.listShopCommissions();
  }

  @Get('products/:productCode/commissions')
  @ApiOperation({ summary: '구성상품별 수수료(매입가) 예외 목록 조회(AD-STL-02)' })
  getProductCommissions(@Param('productCode') productCode: string) {
    return this.settlementsService.getProductCommissions(productCode);
  }

  @Put('products/:productCode/commissions')
  @ApiOperation({
    summary:
      '구성상품별 수수료(매입가) 예외 전체 교체 저장(AD-STL-02) — 목록에 없는 시공업체는 예외 삭제(기본값 적용으로 복귀)',
  })
  setProductCommissions(
    @Param('productCode') productCode: string,
    @Body() dto: SetProductShopCommissionsDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.settlementsService.setProductCommissions(productCode, dto, me.username);
  }
}
