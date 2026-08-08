// 업체 관리(AD-CO-02/03/04) 모듈 등록 — 매장(Shop) 정보 조회/수정은 ShopsService를 그대로 재사용
import { Module } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { ShopsModule } from '../shops/shops.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [ShopsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, PhoneCryptoService],
})
export class CompaniesModule {}
