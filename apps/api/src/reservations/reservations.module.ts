// 시공 예약 생성/조회 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PointsModule } from '../points/points.module';
import { ProductsModule } from '../products/products.module';
import { AdminReservationsController } from './admin-reservations.controller';
import { PartnerReservationsController } from './partner-reservations.controller';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [ProductsModule, PointsModule],
  controllers: [
    ReservationsController,
    PartnerReservationsController,
    AdminReservationsController,
  ],
  providers: [ReservationsService, PhoneCryptoService],
})
export class ReservationsModule {}
