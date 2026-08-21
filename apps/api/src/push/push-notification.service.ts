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
   * 푸시 제목/본문을 CommonCodeDetail(code='PUSH_MSG_TYPE')에서 조회 — detailName=제목, ref1=본문 템플릿.
   * ref1의 {key} 플레이스홀더를 vars[key]로 치환한다. 코드값이 없으면(등록 누락) type을 그대로 노출해 원인을 바로 알 수 있게 한다.
   */
  private async resolveMessage(
    type: string,
    vars?: Record<string, string>,
  ): Promise<{ title: string; body: string }> {
    const detail = await this.prisma.commonCodeDetail.findUnique({
      where: { code_detailCode: { code: 'PUSH_MSG_TYPE', detailCode: type } },
    });
    const title = detail?.detailName ?? type;
    const template = detail?.ref1 ?? '';
    const body = template.replace(/\{(\w+)\}/g, (match, key: string) => vars?.[key] ?? match);
    return { title, body };
  }

  /**
   * 서비스 필수 알림 발송(예약 확정·시공 완료 등) — 실패해도 호출부 트랜잭션에 영향 주지 않도록 예외를 던지지 않음.
   * 푸시 토큰이 없어도(웹만 쓰는 회원 등) 인앱 알림함(CU-MYPG-12)에는 항상 기록한다.
   */
  async sendToOwner(
    ownerType: PushOwnerType,
    ownerId: string,
    message: {
      type: string;
      vars?: Record<string, string>;
      data?: Record<string, unknown>;
      // 관리자가 그때그때 직접 입력하는 공지(AD-CS-04)처럼 고정 템플릿이 없는 발송용 — 있으면 공통코드
      // 조회를 건너뛰고 이 값을 그대로 쓴다
      override?: { title: string; body: string };
    },
  ): Promise<void> {
    const { title, body } = message.override ?? (await this.resolveMessage(message.type, message.vars));

    await this.notificationsService.create(ownerType, ownerId, {
      type: message.type,
      title,
      body,
      data: message.data,
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
        title,
        body,
        // 알림함(DB)은 type 컬럼이 따로 있어 필요 없지만, OS 푸시 배너를 직접 탭했을 때 클라이언트가
        // 이동 대상을 판별할 유일한 단서가 이 data뿐이라 type을 반드시 함께 실어 보낸다
        data: { ...message.data, type: message.type },
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
    message: { type: string; vars?: Record<string, string>; data?: Record<string, unknown> },
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
