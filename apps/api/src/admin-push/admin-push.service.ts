// 관리자 임의 공지 푸시 발송(AD-CS-04) — 회원/시공업체 사용자 대상 검색·전체발송·발송이력 조회
import { BadRequestException, Injectable } from '@nestjs/common';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push/push-notification.service';
import type { SendPushBroadcastDto } from './dto/send-push-broadcast.dto';

export interface PartnerUserSearchItem {
  id: string;
  name: string;
  phone: string;
  shopName: string;
}

export interface AdminPushBroadcastListItem {
  id: number;
  targetType: string; // 'USER' | 'PARTNER'
  scope: string; // 'ALL' | 'INDIVIDUAL'
  targetCount: number;
  title: string;
  body: string;
  createdBy: string | null;
  createdAt: string;
}

@Injectable()
export class AdminPushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  /** 발송 대상 검색용 — 전체 업체를 가로질러 사용중인 시공업체 사용자 전체 목록(클라이언트에서 이름으로 필터) */
  async listPartnerUsersForSearch(): Promise<PartnerUserSearchItem[]> {
    const rows = await this.prisma.partnerUser.findMany({
      where: { useYn: true },
      include: { shop: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: this.phoneCrypto.decrypt(r.phoneEncrypted),
      shopName: r.shop.name,
    }));
  }

  async listHistory(): Promise<AdminPushBroadcastListItem[]> {
    const rows = await this.prisma.adminPushBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      scope: r.scope,
      targetCount: r.targetCount,
      title: r.title,
      body: r.body,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async send(
    dto: SendPushBroadcastDto,
    adminUsername: string,
  ): Promise<{ targetCount: number }> {
    let targetIds: string[];
    if (dto.scope === 'ALL') {
      if (dto.targetType === 'USER') {
        const users = await this.prisma.user.findMany({
          where: { role: 'CUSTOMER', withdrawnAt: null },
          select: { id: true },
        });
        targetIds = users.map((u) => u.id);
      } else {
        const partners = await this.prisma.partnerUser.findMany({
          where: { useYn: true },
          select: { id: true },
        });
        targetIds = partners.map((p) => p.id);
      }
    } else {
      if (!dto.ids || dto.ids.length === 0) {
        throw new BadRequestException('발송 대상을 선택해 주세요.');
      }
      targetIds = dto.ids;
    }
    if (targetIds.length === 0) {
      throw new BadRequestException('발송 대상이 없습니다.');
    }

    // 서비스 필수 알림과 동일하게 실패해도 발송 자체(이력 기록)에는 영향 주지 않음
    for (const id of targetIds) {
      this.pushService
        .sendToOwner(dto.targetType, id, {
          type: 'ADMIN_NOTICE',
          override: { title: dto.title, body: dto.body },
        })
        .catch(() => {});
    }

    await this.prisma.adminPushBroadcast.create({
      data: {
        targetType: dto.targetType,
        scope: dto.scope,
        targetCount: targetIds.length,
        title: dto.title,
        body: dto.body,
        createdBy: adminUsername,
      },
    });

    return { targetCount: targetIds.length };
  }
}
