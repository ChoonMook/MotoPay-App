// 상품/패키지 조회(공개) + 관리자용 상품 관리(AD-CTLG-05) 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
