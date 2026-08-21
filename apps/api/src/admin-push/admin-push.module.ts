import { Module } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PushModule } from '../push/push.module';
import { AdminPushController } from './admin-push.controller';
import { AdminPushService } from './admin-push.service';

@Module({
  imports: [PushModule],
  controllers: [AdminPushController],
  providers: [AdminPushService, PhoneCryptoService],
})
export class AdminPushModule {}
