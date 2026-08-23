// 정산 기준 관리(AD-STL-02)·정산 내역 조회(AD-STL-04) 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { AdminSettlementsController } from './admin-settlements.controller';
import { AdminShopSettlementsController } from './admin-shop-settlements.controller';
import { SettlementsService } from './settlements.service';
import { ShopSettlementsService } from './shop-settlements.service';

@Module({
  imports: [ProductsModule],
  controllers: [AdminSettlementsController, AdminShopSettlementsController],
  providers: [SettlementsService, ShopSettlementsService],
})
export class SettlementsModule {}
