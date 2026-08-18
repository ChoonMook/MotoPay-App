// 회원 등급 기준 설정(AD-PNT-07) — GOLD/SILVER/BRONZE 3개 고정 등급의 설정값 조회/수정.
// 회원 등급을 실제로 계산하는 로직은 이 서비스가 담당(AdminMembersService·CouponsService·고객용 회원등급혜택
// 화면(CU-PNT-07)이 공유)하지만, User에 grade 컬럼으로 저장하지는 않고 조회 시점에 항상 다시 계산한다.
import { Injectable, NotFoundException } from '@nestjs/common';
import type { MemberGradeRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateMemberGradeRuleDto } from './dto/update-member-grade-rule.dto';

export interface MemberGradeRuleView {
  gradeCode: string;
  minSpendAmount: number;
  discountRate: number;
  voucherAmount: number;
  updatedBy: string | null;
  updatedAt: string;
}

function toView(rule: MemberGradeRule): MemberGradeRuleView {
  return {
    gradeCode: rule.gradeCode,
    minSpendAmount: rule.minSpendAmount,
    discountRate: rule.discountRate,
    voucherAmount: rule.voucherAmount,
    updatedBy: rule.updatedBy,
    updatedAt: rule.updatedAt.toISOString(),
  };
}

const GRADE_SPEND_WINDOW_DAYS = 90;

@Injectable()
export class MemberGradeRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MemberGradeRuleView[]> {
    const rows = await this.prisma.memberGradeRule.findMany({
      orderBy: { minSpendAmount: 'desc' },
    });
    return rows.map(toView);
  }

  async update(
    gradeCode: string,
    dto: UpdateMemberGradeRuleDto,
    adminUsername: string,
  ): Promise<MemberGradeRuleView> {
    const exists = await this.prisma.memberGradeRule.findUnique({
      where: { gradeCode },
    });
    if (!exists) {
      throw new NotFoundException('등급 설정을 찾을 수 없습니다.');
    }
    const updated = await this.prisma.memberGradeRule.update({
      where: { gradeCode },
      data: { ...dto, updatedBy: adminUsername },
    });
    return toView(updated);
  }

  /** 회원별 최근 3개월(90일) 결제확정 예약 결제금액 합계 조회(취소 건 제외) — 회원 등급 산정 근거 */
  private async resolveSpendMap(
    memberIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (memberIds.length === 0) {
      return map;
    }
    const cutoff = new Date(
      Date.now() - GRADE_SPEND_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const grouped = await this.prisma.reservation.groupBy({
      by: ['memberId'],
      where: {
        memberId: { in: memberIds },
        status: 'CONFIRMED',
        paidAt: { gte: cutoff },
      },
      _sum: { paidAmount: true },
    });
    for (const g of grouped) {
      map.set(g.memberId, g._sum.paidAmount ?? 0);
    }
    return map;
  }

  /**
   * 최근 3개월 결제금액 합계를 MemberGradeRule 기준금액과 비교해 등급 산정(기준 미달이면 null).
   * AdminMembersService(AD-MBR-02 등급 컬럼)·CouponsService(AD-CPN-02 조건별 발행 대상 산정)가 공유.
   */
  async computeGrades(
    memberIds: string[],
  ): Promise<Map<string, string | null>> {
    const [spendMap, rules] = await Promise.all([
      this.resolveSpendMap(memberIds),
      this.prisma.memberGradeRule.findMany({
        orderBy: { minSpendAmount: 'desc' },
      }),
    ]);
    const gradeMap = new Map<string, string | null>();
    for (const memberId of memberIds) {
      const spend = spendMap.get(memberId) ?? 0;
      const matched = rules.find((r) => spend >= r.minSpendAmount);
      gradeMap.set(memberId, matched?.gradeCode ?? null);
    }
    return gradeMap;
  }

  /** 특정 등급에 해당하는 활동회원(탈퇴 제외) id 목록 — 쿠폰 조건별 발행(AD-CPN-02) 대상 산정용 */
  async listMemberIdsByGrade(gradeCode: string): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER', withdrawnAt: null },
      select: { id: true },
    });
    const gradeMap = await this.computeGrades(users.map((u) => u.id));
    return users.filter((u) => gradeMap.get(u.id) === gradeCode).map((u) => u.id);
  }

  /** 회원 등급 혜택(CU-PNT-07) — 현재 등급·최근 3개월 실적·다음 등급까지 필요 금액·등급별 혜택 전체 목록 */
  async getMyGradeInfo(memberId: string): Promise<{
    grade: string | null;
    recentSpend: number;
    currentThreshold: number;
    nextGrade: string | null;
    nextThreshold: number | null;
    tiers: MemberGradeRuleView[];
  }> {
    const [spendMap, rules] = await Promise.all([
      this.resolveSpendMap([memberId]),
      this.prisma.memberGradeRule.findMany({
        orderBy: { minSpendAmount: 'desc' },
      }),
    ]);
    const spend = spendMap.get(memberId) ?? 0;
    // rules는 minSpendAmount 내림차순(GOLD, SILVER, BRONZE 순) — 실적이 처음으로 기준을 만족하는 등급이 현재 등급
    const currentIndex = rules.findIndex((r) => spend >= r.minSpendAmount);
    const current = currentIndex >= 0 ? rules[currentIndex] : null;
    const next =
      currentIndex > 0
        ? rules[currentIndex - 1] // 한 단계 위 등급
        : currentIndex === -1
          ? (rules[rules.length - 1] ?? null) // 최하위 등급 미달 -> 최하위 등급이 다음 목표
          : null; // 이미 최고 등급

    return {
      grade: current?.gradeCode ?? null,
      recentSpend: spend,
      currentThreshold: current?.minSpendAmount ?? 0,
      nextGrade: next?.gradeCode ?? null,
      nextThreshold: next?.minSpendAmount ?? null,
      tiers: rules.map(toView),
    };
  }
}
