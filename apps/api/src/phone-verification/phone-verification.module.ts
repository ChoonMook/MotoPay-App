import { Module } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { MsgHubModule } from '../msg-hub/msg-hub.module';
import { PhoneVerificationController } from './phone-verification.controller';
import { PhoneVerificationService } from './phone-verification.service';

@Module({
  imports: [MsgHubModule],
  controllers: [PhoneVerificationController],
  providers: [PhoneVerificationService, PhoneCryptoService],
  exports: [PhoneVerificationService],
})
export class PhoneVerificationModule {}
