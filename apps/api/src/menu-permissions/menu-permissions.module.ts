// 메뉴 권한(AD-SYS-05 메뉴권한관리) 모듈 등록
import { Module } from '@nestjs/common';
import { MenuPermissionsController } from './menu-permissions.controller';
import { MenuPermissionsService } from './menu-permissions.service';

@Module({
  controllers: [MenuPermissionsController],
  providers: [MenuPermissionsService],
})
export class MenuPermissionsModule {}
