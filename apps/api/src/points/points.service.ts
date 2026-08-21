// 포인트 내역 조회(AD-PNT-06)·관리자 강제 부여(AD-PNT-04)·강제 차감(AD-PNT-05)·신차구매 포인트 지급(관리자) +
// 포인트홈(CU-PNT-01)·포인트 내역(CU-PNT-06) 고객용 조회
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push/push-notification.service';

export interface AdminPointHistoryListItem {
  id: number;
  memberId: string;
  memberName: string;
  kind: string; // -> CommonCodeDetail(code='POINT_HIST_KIND')
  amount: number;
  balanceAfter: number;
  title: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string; // ISO
}

export interface GrantPurchasePointsResultRow {
  vin: string;
  success: boolean;
  error?: string;
}

export interface MyPointsSummary {
  balance: number;
  totalCharged: number; // 전체 적립 합계(충전+관리자부여+신차구매포인트 등 amount>0 전체)
  totalUsed: number; // 전체 사용 합계(사용+관리자차감 등 amount<0 전체, 절대값)
}

export interface MyPointHistoryItem {
  title: string;
  kind: string; // -> CommonCodeDetail(code='POINT_HIST_KIND')
  amount: number;
  balanceAfter: number;
  createdAt: string; // ISO
}

const PURCHASE_GRANT_TITLE = '신차구매 포인트 지급';

@Injectable()
export class PointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
  ) {}

  // ── 고객 포인트홈(CU-PNT-01)·포인트 내역(CU-PNT-06) ──────────────────

  async getMySummary(memberId: string): Promise<MyPointsSummary> {
    const [user, positive, negative] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: memberId },
        select: { pointBalance: true },
      }),
      this.prisma.pointHistory.aggregate({
        where: { memberId, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      this.prisma.pointHistory.aggregate({
        where: { memberId, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
    ]);
    return {
      balance: user?.pointBalance ?? 0,
      totalCharged: positive._sum.amount ?? 0,
      totalUsed: Math.abs(negative._sum.amount ?? 0),
    };
  }

  async getMyHistory(memberId: string): Promise<MyPointHistoryItem[]> {
    const histories = await this.prisma.pointHistory.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
    });
    return histories.map((h) => ({
      title: h.title,
      kind: h.kind,
      amount: h.amount,
      balanceAfter: h.balanceAfter,
      createdAt: h.createdAt.toISOString(),
    }));
  }

  async adminList(params: {
    keyword?: string;
    kind?: string;
    dateFrom?: string;
    dateTo?: string;
    memberId?: string;
  }): Promise<AdminPointHistoryListItem[]> {
    const histories = await this.prisma.pointHistory.findMany({
      where: {
        ...(params.memberId ? { memberId: params.memberId } : {}),
        ...(params.kind ? { kind: params.kind } : {}),
        ...(params.keyword
          ? { member: { name: { contains: params.keyword } } }
          : {}),
        ...(params.dateFrom || params.dateTo
          ? {
              createdAt: {
                ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
                ...(params.dateTo
                  ? {
                      lt: new Date(
                        new Date(params.dateTo).getTime() + 24 * 60 * 60 * 1000,
                      ),
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: { member: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // 관리자 처리건은 createdBy에 AdminAccount.username이 들어있어(FK 없음) 표시용 이름을 배치 조회
    const adminUsernames = [
      ...new Set(
        histories
          .filter((h) => h.createdBy && h.createdBy !== h.memberId)
          .map((h) => h.createdBy as string),
      ),
    ];
    const admins = adminUsernames.length
      ? await this.prisma.adminAccount.findMany({
          where: { username: { in: adminUsernames } },
          select: { username: true, name: true },
        })
      : [];
    const adminNameByUsername = new Map(admins.map((a) => [a.username, a.name]));

    return histories.map((h) => ({
      id: h.id,
      memberId: h.memberId,
      memberName: h.member.name,
      kind: h.kind,
      amount: h.amount,
      balanceAfter: h.balanceAfter,
      title: h.title,
      reason: h.reason,
      // 회원 스스로 충전/사용한 건은 createdBy에 회원 자기 자신의 User.id가 그대로 들어있어(스키마 설계상 의도된
      // 동작) 관리자 화면에는 id 대신 회원명으로 표시. 관리자 처리건은 username 대신 AdminAccount.name으로 표시
      createdBy:
        h.createdBy === h.memberId
          ? h.member.name
          : (h.createdBy && adminNameByUsername.get(h.createdBy)) ?? h.createdBy,
      createdAt: h.createdAt.toISOString(),
    }));
  }

  /** 포인트 충전(CU-PNT-02) — 실제 결제 게이트웨이 연동은 없고, 예약 결제 확정과 동일하게 확정 즉시 적립 처리 */
  async chargeMyPoints(
    memberId: string,
    amount: number,
    method: 'BANK' | 'CARD',
  ): Promise<AdminPointHistoryListItem> {
    const title = method === 'CARD' ? '카드 충전' : '무통장 충전';
    return this.adjust(memberId, amount, null, memberId, 'CHARGE', title);
  }

  /** 포인트 사용(CU-RSVC-14 결제 확정) — ReservationsService.confirmPayment이 pointsUsed>0일 때 호출 */
  async useMyPoints(
    memberId: string,
    amount: number,
    title: string,
  ): Promise<AdminPointHistoryListItem> {
    return this.adjust(memberId, -amount, null, memberId, 'USE', title);
  }

  async adminForceGrant(
    memberId: string,
    amount: number,
    reason: string,
    adminUsername: string,
  ): Promise<AdminPointHistoryListItem> {
    return this.adjust(memberId, amount, reason, adminUsername, 'GRANT');
  }

  async adminForceDeduct(
    memberId: string,
    amount: number,
    reason: string,
    adminUsername: string,
  ): Promise<AdminPointHistoryListItem> {
    return this.adjust(memberId, -amount, reason, adminUsername, 'DEDUCT');
  }

  /**
   * 신차구매 포인트 지급 — 딜러사 신차구매 고객(NewCarPurchaseCustomer)을 VIN으로 찾아 매핑된 회원에게 지급.
   * 행 단위로 개별 성공/실패 처리(신차 구매내역 엑셀 일괄업로드와 동일한 정책) — 한 행 실패가 나머지에 영향 없음.
   * 미매핑(회원 연결 전) VIN은 지급 대상 회원 자체가 없어 실패 처리.
   */
  async adminGrantForPurchase(
    items: { vin: string; amount: number }[],
    reason: string,
    adminUsername: string,
  ): Promise<GrantPurchasePointsResultRow[]> {
    const results: GrantPurchasePointsResultRow[] = [];
    for (const item of items) {
      try {
        const purchase = await this.prisma.newCarPurchaseCustomer.findUnique({
          where: { vin: item.vin },
        });
        if (!purchase) {
          throw new NotFoundException('신차 구매내역을 찾을 수 없습니다.');
        }
        if (!purchase.isMapped || !purchase.memberId) {
          throw new BadRequestException('회원 매핑 전이라 포인트를 지급할 수 없습니다.');
        }
        await this.adjust(
          purchase.memberId,
          item.amount,
          reason,
          adminUsername,
          'PURCHASE_GRANT',
          PURCHASE_GRANT_TITLE,
        );
        results.push({ vin: item.vin, success: true });
      } catch (err) {
        results.push({
          vin: item.vin,
          success: false,
          error: err instanceof Error ? err.message : '지급 실패',
        });
      }
    }
    return results;
  }

  private async adjust(
    memberId: string,
    signedAmount: number,
    reason: string | null,
    processedBy: string,
    kind: 'GRANT' | 'DEDUCT' | 'PURCHASE_GRANT' | 'CHARGE' | 'USE',
    title?: string,
  ): Promise<AdminPointHistoryListItem> {
    const member = await this.prisma.user.findUnique({
      where: { id: memberId },
    });
    if (!member || member.role !== 'CUSTOMER') {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }
    const nextBalance = member.pointBalance + signedAmount;
    if (nextBalance < 0) {
      throw new BadRequestException('보유 포인트를 초과하여 차감할 수 없습니다.');
    }

    const [, history] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: memberId },
        data: { pointBalance: nextBalance },
      }),
      this.prisma.pointHistory.create({
        data: {
          memberId,
          kind,
          amount: signedAmount,
          balanceAfter: nextBalance,
          title:
            title ??
            (kind === 'GRANT'
              ? '관리자 부여'
              : kind === 'DEDUCT'
                ? '관리자 차감'
                : kind === 'PURCHASE_GRANT'
                  ? PURCHASE_GRANT_TITLE
                  : kind === 'CHARGE'
                    ? '포인트 충전'
                    : '포인트 사용'),
          reason,
          createdBy: processedBy,
        },
        include: { member: { select: { name: true } } },
      }),
    ]);

    // 관리자가 부여한 포인트만 알림(고객 본인이 충전한 CHARGE는 스스로 한 행동이라 불필요)
    if (kind === 'GRANT' || kind === 'PURCHASE_GRANT') {
      this.pushService
        .sendToOwner('USER', memberId, {
          type: 'POINT_GRANTED',
          vars: { amount: signedAmount.toLocaleString() },
        })
        .catch(() => {});
    }

    return {
      id: history.id,
      memberId: history.memberId,
      memberName: history.member.name,
      kind: history.kind,
      amount: history.amount,
      balanceAfter: history.balanceAfter,
      title: history.title,
      reason: history.reason,
      createdBy: history.createdBy,
      createdAt: history.createdAt.toISOString(),
    };
  }
}
