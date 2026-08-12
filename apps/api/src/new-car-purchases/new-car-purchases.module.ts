// 신차 구매 내역(DL-NCPK-01~04) 관리 기능을 묶는 모듈
import { Module } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { AdminNewCarPurchasesController } from './admin-new-car-purchases.controller';
import { NewCarPurchasesService } from './new-car-purchases.service';

@Module({
  controllers: [AdminNewCarPurchasesController],
  providers: [NewCarPurchasesService, PhoneCryptoService],
})
export class NewCarPurchasesModule {}
