// 쿠폰 발행(AD-CPN-02)·쿠폰 내역 조회(AD-CPN-03) — 관리자 전용. 발행 즉시 대상 회원을 확정해
// CouponIssuance를 함께 생성(전체/조건별/개별선택 모두 발행 시점 스냅샷).
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MemberGradeRulesService } from '../member-grade-rules/member-grade-rules.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push/push-notification.service';
import {
  formatDateOnly,
  parseDateOnly,
  todayUtcMidnight,
} from '../common/schedule-date.util';
import type { IssueCouponDto } from './dto/issue-coupon.dto';

export interface AdminCouponListItem {
  couponNo: string;
  name: string;
  couponType: string;
  discountValue: number;
  issuerType: string;
  issuerCompanyName: string | null;
  targetType: string;
  validFrom: string;
  validTo: string;
  issuedCount: number;
  usedCount: number;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
}

export interface AdminCouponIssuanceItem {
  memberId: string;
  memberName: string;
  status: string;
  usedAt: string | null;
  createdAt: string;
}

export interface AdminCouponDetail extends AdminCouponListItem {
  targetGrade: string | null;
  issuances: AdminCouponIssuanceItem[];
}

export interface MyCouponItem {
  couponNo: string;
  name: string;
  couponType: string; // -> CommonCodeDetail(code='COUPON_TYPE')
  discountValue: number;
  issuerType: string; // -> CommonCodeDetail(code='COUPON_ISSUER_TYPE')
  issuerCompanyName: string | null;
  status: string; // ISSUED(사용가능)/USED(사용완료)/EXPIRED(만료) — 유효기간이 지났으면 저장값과 무관하게 EXPIRED로 보정
  validFrom: string;
  validTo: string;
  issuedAt: string;
  usedAt: string | null;
}

export interface AdminMemberCouponItem {
  couponNo: string;
  couponName: string;
  couponType: string;
  discountValue: number;
  issuerType: string;
  status: string; // -> CommonCodeDetail(code='COUPON_ISSUANCE_STATUS')
  validFrom: string;
  validTo: string;
  issuedAt: string;
  usedAt: string | null;
}

function resolveStatus(validTo: Date): 'ACTIVE' | 'CLOSED' {
  return validTo < todayUtcMidnight() ? 'CLOSED' : 'ACTIVE';
}

/** 발급 건 상태 — USED는 저장값 그대로, 그 외에는 유효기간이 지났으면 저장값과 무관하게 EXPIRED로 보정 */
function resolveIssuanceStatus(status: string, validTo: Date): string {
  if (status === 'USED') return 'USED';
  return validTo < todayUtcMidnight() ? 'EXPIRED' : 'ISSUED';
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memberGradeRulesService: MemberGradeRulesService,
    private readonly pushService: PushNotificationService,
  ) {}

  async adminList(params: {
    issuerType?: string;
    status?: 'ACTIVE' | 'CLOSED';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AdminCouponListItem[]> {
    const coupons = await this.prisma.coupon.findMany({
      where: {
        ...(params.issuerType ? { issuerType: params.issuerType } : {}),
        ...(params.dateFrom || params.dateTo
          ? {
              createdAt: {
                ...(params.dateFrom
                  ? { gte: parseDateOnly(params.dateFrom) }
                  : {}),
                ...(params.dateTo
                  ? {
                      lt: new Date(
                        parseDateOnly(params.dateTo).getTime() +
                          24 * 60 * 60 * 1000,
                      ),
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: {
        issuerCompany: { select: { name: true } },
        _count: { select: { issuances: { where: { status: 'USED' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return coupons
      .map((c) => ({
        couponNo: c.couponNo,
        name: c.name,
        couponType: c.couponType,
        discountValue: c.discountValue,
        issuerType: c.issuerType,
        issuerCompanyName: c.issuerCompany?.name ?? null,
        targetType: c.targetType,
        validFrom: formatDateOnly(c.validFrom),
        validTo: formatDateOnly(c.validTo),
        issuedCount: c.issuedCount,
        usedCount: c._count.issuances,
        status: resolveStatus(c.validTo),
        createdAt: c.createdAt.toISOString(),
      }))
      .filter((c) => !params.status || c.status === params.status);
  }

  async adminGetDetail(couponNo: string): Promise<AdminCouponDetail> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { couponNo },
      include: {
        issuerCompany: { select: { name: true } },
        issuances: {
          include: { member: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }
    const usedCount = coupon.issuances.filter(
      (i) => i.status === 'USED',
    ).length;

    return {
      couponNo: coupon.couponNo,
      name: coupon.name,
      couponType: coupon.couponType,
      discountValue: coupon.discountValue,
      issuerType: coupon.issuerType,
      issuerCompanyName: coupon.issuerCompany?.name ?? null,
      targetType: coupon.targetType,
      targetGrade: coupon.targetGrade,
      validFrom: formatDateOnly(coupon.validFrom),
      validTo: formatDateOnly(coupon.validTo),
      issuedCount: coupon.issuedCount,
      usedCount,
      status: resolveStatus(coupon.validTo),
      createdAt: coupon.createdAt.toISOString(),
      issuances: coupon.issuances.map((i) => ({
        memberId: i.memberId,
        memberName: i.member.name,
        status: i.status,
        usedAt: i.usedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
    };
  }

  /** 특정 회원에게 발급된 쿠폰 전체(AD-MBR-02 회원 상세 "쿠폰" 탭) */
  async adminListForMember(memberId: string): Promise<AdminMemberCouponItem[]> {
    const issuances = await this.prisma.couponIssuance.findMany({
      where: { memberId },
      include: { coupon: true },
      orderBy: { createdAt: 'desc' },
    });
    return issuances.map((i) => ({
      couponNo: i.coupon.couponNo,
      couponName: i.coupon.name,
      couponType: i.coupon.couponType,
      discountValue: i.coupon.discountValue,
      issuerType: i.coupon.issuerType,
      status: resolveIssuanceStatus(i.status, i.coupon.validTo),
      validFrom: formatDateOnly(i.coupon.validFrom),
      validTo: formatDateOnly(i.coupon.validTo),
      issuedAt: i.createdAt.toISOString(),
      usedAt: i.usedAt?.toISOString() ?? null,
    }));
  }

  /** 보유 쿠폰함(CU-MYPG-16) — 로그인한 본인에게 발급된 쿠폰 전체 */
  async getMyCoupons(memberId: string): Promise<MyCouponItem[]> {
    const issuances = await this.prisma.couponIssuance.findMany({
      where: { memberId },
      include: { coupon: { include: { issuerCompany: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return issuances.map((i) => ({
      couponNo: i.coupon.couponNo,
      name: i.coupon.name,
      couponType: i.coupon.couponType,
      discountValue: i.coupon.discountValue,
      issuerType: i.coupon.issuerType,
      issuerCompanyName: i.coupon.issuerCompany?.name ?? null,
      status: resolveIssuanceStatus(i.status, i.coupon.validTo),
      validFrom: formatDateOnly(i.coupon.validFrom),
      validTo: formatDateOnly(i.coupon.validTo),
      issuedAt: i.createdAt.toISOString(),
      usedAt: i.usedAt?.toISOString() ?? null,
    }));
  }

  /** 발행 전 대상고객 미리보기(AD-CPN-02) — ALL/CONDITION만 해당, INDIVIDUAL은 프론트에서 선택 인원 수로 대체 */
  async previewTargetCount(
    targetType: string,
    targetGrade?: string,
  ): Promise<number> {
    if (targetType === 'ALL') {
      return this.prisma.user.count({
        where: { role: 'CUSTOMER', withdrawnAt: null },
      });
    }
    if (targetType === 'CONDITION') {
      if (!targetGrade) {
        throw new BadRequestException('대상 등급을 선택해 주세요.');
      }
      const ids = await this.memberGradeRulesService.listMemberIdsByGrade(
        targetGrade,
      );
      return ids.length;
    }
    return 0;
  }

  async adminIssue(
    dto: IssueCouponDto,
    adminUsername: string,
  ): Promise<AdminCouponDetail> {
    if (dto.couponType !== 'EXCHANGE' && !dto.discountValue) {
      throw new BadRequestException('할인값을 입력해 주세요.');
    }
    if (dto.couponType === 'DISCOUNT' && (dto.discountValue ?? 0) > 100) {
      throw new BadRequestException('할인율은 100% 이하로 입력해 주세요.');
    }
    if (dto.issuerType === 'DEALER' && !dto.issuerCompanyId) {
      throw new BadRequestException('딜러사를 선택해 주세요.');
    }
    if (dto.issuerCompanyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: dto.issuerCompanyId },
      });
      if (!company || company.coType !== 'DEALER') {
        throw new BadRequestException('딜러사 정보를 찾을 수 없습니다.');
      }
    }

    const validFrom = parseDateOnly(dto.validFrom);
    const validTo = parseDateOnly(dto.validTo);
    if (validTo < validFrom) {
      throw new BadRequestException('종료일은 시작일 이후여야 합니다.');
    }

    let targetMemberIds: string[];
    if (dto.targetType === 'ALL') {
      const users = await this.prisma.user.findMany({
        where: { role: 'CUSTOMER', withdrawnAt: null },
        select: { id: true },
      });
      targetMemberIds = users.map((u) => u.id);
    } else if (dto.targetType === 'CONDITION') {
      if (!dto.targetGrade) {
        throw new BadRequestException('대상 등급을 선택해 주세요.');
      }
      targetMemberIds = await this.memberGradeRulesService.listMemberIdsByGrade(
        dto.targetGrade,
      );
    } else {
      if (!dto.memberIds || dto.memberIds.length === 0) {
        throw new BadRequestException('대상 회원을 선택해 주세요.');
      }
      const users = await this.prisma.user.findMany({
        where: { id: { in: dto.memberIds }, role: 'CUSTOMER' },
        select: { id: true },
      });
      targetMemberIds = users.map((u) => u.id);
    }
    if (targetMemberIds.length === 0) {
      throw new BadRequestException('발행 대상 회원이 없습니다.');
    }

    const coupon = await this.prisma.$transaction(async (tx) => {
      const created = await tx.coupon.create({
        data: {
          couponNo: '0'.repeat(10),
          name: dto.name,
          couponType: dto.couponType,
          discountValue: dto.discountValue ?? 0,
          issuerType: dto.issuerType,
          issuerCompanyId: dto.issuerCompanyId ?? null,
          targetType: dto.targetType,
          targetGrade: dto.targetType === 'CONDITION' ? dto.targetGrade : null,
          validFrom,
          validTo,
          issuedCount: targetMemberIds.length,
          createdBy: adminUsername,
        },
      });
      const confirmed = await tx.coupon.update({
        where: { id: created.id },
        data: { couponNo: String(created.id).padStart(10, '0') },
      });
      await tx.couponIssuance.createMany({
        data: targetMemberIds.map((memberId) => ({
          couponId: created.id,
          memberId,
        })),
      });
      return confirmed;
    });

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송) — 대상 회원 다수라 개별 실패가 발급 자체에 영향 주지 않게 함
    for (const memberId of targetMemberIds) {
      this.pushService
        .sendToOwner('USER', memberId, { type: 'COUPON_ISSUED' })
        .catch(() => {});
    }

    return this.adminGetDetail(coupon.couponNo);
  }
}
