// Expo 푸시 토큰 등록/발송 기능을 묶는 모듈 — 다른 모듈(reservations 등)이 PushNotificationService를 재사용
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushTokenController } from './push-token.controller';
import { PartnerPushTokenController } from './partner-push-token.controller';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [NotificationsModule],
  controllers: [PushTokenController, PartnerPushTokenController],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class PushModule {}
