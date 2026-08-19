// 인앱 알림함 기능을 묶는 모듈 — PushModule이 발송 시점에 NotificationsService를 재사용
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { PartnerNotificationsController } from './partner-notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, PartnerNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
