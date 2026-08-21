import { Module } from '@nestjs/common';
import { AdminAppVersionController } from './admin-app-version.controller';
import { AppVersionController } from './app-version.controller';
import { AppVersionService } from './app-version.service';

@Module({
  controllers: [AppVersionController, AdminAppVersionController],
  providers: [AppVersionService],
})
export class AppVersionModule {}
