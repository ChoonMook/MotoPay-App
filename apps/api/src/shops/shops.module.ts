// 시공업체 조회·스케줄 관리 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { ShopScheduleController } from './shop-schedule.controller';
import { ShopScheduleService } from './shop-schedule.service';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  controllers: [ShopsController, ShopScheduleController],
  providers: [ShopsService, ShopScheduleService],
  exports: [ShopsService, ShopScheduleService],
})
export class ShopsModule {}
