// 앱 전체에서 PrismaService를 재주입 없이 쓸 수 있도록 전역 모듈로 등록
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
