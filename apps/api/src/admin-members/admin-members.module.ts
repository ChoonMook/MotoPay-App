// 고객 회원 관리(AD-MBR-02 고객 회원 목록) 모듈 등록
import { Module } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { AdminMembersController } from './admin-members.controller';
import { AdminMembersService } from './admin-members.service';

@Module({
  controllers: [AdminMembersController],
  providers: [AdminMembersService, PhoneCryptoService],
})
export class AdminMembersModule {}
