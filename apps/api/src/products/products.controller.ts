// GET /products(상품 카탈로그 조회 — prodCat/prodType 필터), GET /products/packages/:packageCode(패키지 상세 조회) — 로그인 불필요
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: '상품 카탈로그 조회 — 예약시공(입찰) 전문가추천 화면의 상품 검색용, prodCat/prodType으로 필터',
  })
  list(@Query('prodCat') prodCat?: string, @Query('prodType') prodType?: string) {
    return this.productsService.list({ prodCat, prodType });
  }

  @Get('packages/:packageCode')
  @ApiOperation({
    summary:
      '패키지 상세 조회 — 구성상품을 기본상품(무상)/업그레이드옵션(같은 상품분류 내 대체, 유상)/추가옵션(패키지 미포함 분류, 유상)으로 구분해 응답',
  })
  getPackageDetail(@Param('packageCode') packageCode: string) {
    return this.productsService.getPackageDetail(packageCode);
  }
}
