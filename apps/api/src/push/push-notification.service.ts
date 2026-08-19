// Expo 푸시 토큰 등록/해제 + 발송 — 예약 확정·시공 완료 등 서비스 필수 알림 전용(마케팅 동의 여부 무관 발송)
import { Injectable, Logger } from '@nestjs/common';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterPushTokenDto } from './dto/register-push-token.dto';

export type PushOwnerType = 'USER' | 'PARTNER';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expo = new Expo();

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async registerToken(
    ownerType: PushOwnerType,
    ownerId: string,
    dto: RegisterPushTokenDto,
  ): Promise<void> {
    await this.prisma.pushToken.upsert({
      where: { expoPushToken: dto.expoPushToken },
      create: {
        ownerType,
        ownerId,
        expoPushToken: dto.expoPushToken,
        platform: dto.platform,
      },
      update: {
        ownerType,
        ownerId,
        platform: dto.platform,
      },
    });
  }

  async unregisterToken(expoPushToken: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { expoPushToken } });
  }

  /**
   * 서비스 필수 알림 발송(예약 확정·시공 완료 등) — 실패해도 호출부 트랜잭션에 영향 주지 않도록 예외를 던지지 않음.
   * 푸시 토큰이 없어도(웹만 쓰는 회원 등) 인앱 알림함(CU-MYPG-12)에는 항상 기록한다.
   */
  async sendToOwner(
    ownerType: PushOwnerType,
    ownerId: string,
    message: { type: string; title: string; body: string; data?: Record<string, unknown> },
  ): Promise<void> {
    await this.notificationsService.create(ownerType, ownerId, {
      type: message.type,
      title: message.title,
      body: message.body,
    });

    const tokens = await this.prisma.pushToken.findMany({
      where: { ownerType, ownerId },
    });
    if (tokens.length === 0) return;

    const messages: ExpoPushMessage[] = [];
    const invalidTokens: string[] = [];
    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token.expoPushToken)) {
        invalidTokens.push(token.expoPushToken);
        continue;
      }
      messages.push({
        to: token.expoPushToken,
        title: message.title,
        body: message.body,
        data: message.data,
        sound: 'default',
      });
    }
    if (invalidTokens.length > 0) {
      await this.prisma.pushToken.deleteMany({
        where: { expoPushToken: { in: invalidTokens } },
      });
    }
    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    const deadTokens: string[] = [];
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((ticket, i) => {
          if (
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          ) {
            deadTokens.push(chunk[i].to as string);
          }
        });
      } catch (err) {
        this.logger.warn(`Expo 푸시 발송 실패: ${(err as Error).message}`);
      }
    }
    if (deadTokens.length > 0) {
      await this.prisma.pushToken.deleteMany({
        where: { expoPushToken: { in: deadTokens } },
      });
    }
  }

  /** 특정 업체 소속의 사용 중인 파트너 계정 전원에게 발송(예: 새 예약 접수) */
  async sendToShopPartners(
    shopCode: string,
    message: { type: string; title: string; body: string; data?: Record<string, unknown> },
  ): Promise<void> {
    const partnerUsers = await this.prisma.partnerUser.findMany({
      where: { shopCode, useYn: true },
      select: { id: true },
    });
    await Promise.all(
      partnerUsers.map((pu) => this.sendToOwner('PARTNER', pu.id, message)),
    );
  }
}
