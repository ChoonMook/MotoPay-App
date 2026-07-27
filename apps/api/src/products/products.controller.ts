// GET /products/packages/:packageCode — 패키지 상세 조회(로그인 불필요, 신차패키지 상품 정보 열람용)
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('packages/:packageCode')
  @ApiOperation({
    summary:
      '패키지 상세 조회 — 구성상품을 기본상품(무상)/업그레이드옵션(같은 상품분류 내 대체, 유상)/추가옵션(패키지 미포함 분류, 유상)으로 구분해 응답',
  })
  getPackageDetail(@Param('packageCode') packageCode: string) {
    return this.productsService.getPackageDetail(packageCode);
  }
}
