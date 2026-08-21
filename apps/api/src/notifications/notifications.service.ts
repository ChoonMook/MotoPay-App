// 인앱 알림함(CU-MYPG-12/PT-PROF-01 알림함) — PushNotificationService.sendToOwner()가 발송 시점에 호출해 기록,
// 본인은 목록 조회·읽음 처리·안읽음 개수 조회만 가능(수정/삭제 UI 없음)
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationOwnerType = 'USER' | 'PARTNER';

export interface NotificationView {
  id: number;
  type: string;
  title: string;
  body: string;
  // 알림 탭 시 이동 대상(reservationNo/requestNo/reservationType 등) — PushNotificationService가 발송한 data 그대로
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ownerType: NotificationOwnerType,
    ownerId: string,
    data: { type: string; title: string; body: string; data?: Record<string, unknown> },
  ): Promise<void> {
    const { data: linkData, ...rest } = data;
    await this.prisma.notification.create({
      data: {
        ownerType,
        ownerId,
        ...rest,
        dataJson: linkData ? JSON.stringify(linkData) : null,
      },
    });
  }

  async listMine(ownerType: NotificationOwnerType, ownerId: string): Promise<NotificationView[]> {
    const rows = await this.prisma.notification.findMany({
      where: { ownerType, ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      data: r.dataJson ? (JSON.parse(r.dataJson) as Record<string, string>) : null,
      isRead: r.isRead,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async unreadCount(ownerType: NotificationOwnerType, ownerId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { ownerType, ownerId, isRead: false },
    });
  }

  async markRead(ownerType: NotificationOwnerType, ownerId: string, id: number): Promise<void> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row || row.ownerType !== ownerType || row.ownerId !== ownerId) {
      throw new NotFoundException('알림을 찾을 수 없습니다.');
    }
    if (row.isRead) return;
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
