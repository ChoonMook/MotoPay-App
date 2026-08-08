import { Module } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAccountsService } from './admin-accounts.service';

@Module({
  controllers: [AdminAccountsController],
  providers: [AdminAccountsService, PhoneCryptoService],
})
export class AdminAccountsModule {}
