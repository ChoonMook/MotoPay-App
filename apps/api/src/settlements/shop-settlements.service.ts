// 시공업체 월별 정산 배치 생성·조회·지급처리(AD-STL-04 정산 내역 조회) — 신차패키지(PKG)만 우선 구현
// (2026-08-23 확정, 입찰(BID)은 productCode 해석 규칙이 아직 없어 다음 단계로 미룸). 스케줄러 인프라가 없어
// 관리자가 화면에서 대상월을 지정해 수동 실행하는 방식(2026-08-23 확정)
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import type { UpdateShopSettlementPayoutDto } from './dto/update-shop-settlement-payout.dto';

const HANDOVER_AUTO_CONFIRM_DAYS = 3;

export interface ShopSettlementBatchView {
  id: number;
  shopCode: string;
  shopName: string;
  settlementMonth: string;
  grossAmount: number;
  commissionAmount: number;
  netPayoutAmount: number;
  payoutStatus: string;
  payoutDate: string | null;
  itemCount: number;
}

export interface ShopSettlementItemView {
  id: number;
  reservationNo: string;
  productCode: string | null;
  productName: string | null;
  grossAmount: number;
  commissionType: string;
  commissionAmount: number;
  netAmount: number;
}

export interface GenerateResultView {
  settlementMonth: string;
  processedReservationCount: number;
  batches: ShopSettlementBatchView[];
}

@Injectable()
export class ShopSettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * PKG 정산 배치 생성(수동 실행) — 대상월(settlementMonth, "YYYY-MM")에 인수확인이 완료된 PKG 예약 중
   * 아직 어떤 배치에도 포함되지 않은 건만 골라 시공업체별로 묶는다. 이미 배치가 있는 (업체,월) 조합이면
   * 새로 처리된 건만 더해서 누적하므로 여러 번 실행해도 안전(같은 예약이 중복 집계되지 않음)
   */
  async generate(
    settlementMonth: string,
    adminUsername: string,
  ): Promise<GenerateResultView> {
    const [monthStart, monthEnd] = monthRange(settlementMonth);

    // 인수확인 완료(handoverConfirmedAt) 후보 — 이미 확정된 값이 대상월에 들어오는 건 + 아직 DB에 반영 안
    // 됐지만(3일 자동확정 지연 반영 방식, reservations.service.ts의 resolveHandoverConfirmation과 동일 로직)
    // completedAt+3일이 대상월에 들어오는 건. 후자는 여기서 직접 handoverConfirmedAt을 확정 기록한다
    const alreadyConfirmed = await this.prisma.reservation.findMany({
      where: {
        reservationType: 'PKG',
        status: 'CONFIRMED',
        progressStatus: 'DONE',
        handoverConfirmedAt: { gte: monthStart, lt: monthEnd },
        settlementItems: { none: {} },
      },
    });
    const pendingAutoConfirm = await this.prisma.reservation.findMany({
      where: {
        reservationType: 'PKG',
        status: 'CONFIRMED',
        progressStatus: 'DONE',
        handoverConfirmedAt: null,
        completedAt: { not: null },
        settlementItems: { none: {} },
      },
    });
    const now = new Date();
    const newlyConfirmed: typeof pendingAutoConfirm = [];
    for (const r of pendingAutoConfirm) {
      const autoConfirmAt = new Date(
        r.completedAt!.getTime() + HANDOVER_AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000,
      );
      if (autoConfirmAt > now) continue; // 아직 3일 안 지남 — 이번 실행 대상 아님
      if (autoConfirmAt < monthStart || autoConfirmAt >= monthEnd) continue; // 확정 시점이 대상월 밖
      const updated = await this.prisma.reservation.update({
        where: { id: r.id },
        data: { handoverConfirmedAt: autoConfirmAt },
      });
      newlyConfirmed.push(updated);
    }

    const targets = [...alreadyConfirmed, ...newlyConfirmed];

    // 시공업체별로 (총 정산기준액, 총 수수료, 지급액) 누적 + 상세(items) 준비
    interface PendingItem {
      reservationNo: string;
      productCode: string;
      grossAmount: number;
      commissionType: string;
      commissionAmount: number;
      netAmount: number;
    }
    const byShop = new Map<
      string,
      { grossAmount: number; commissionAmount: number; netPayoutAmount: number; items: PendingItem[] }
    >();

    for (const reservation of targets) {
      const componentGrossAmounts = await this.resolveComponentGrossAmounts(reservation.memberId);
      if (componentGrossAmounts.length === 0) continue; // 신차매핑 차량·구성상품 정보를 못 찾은 예외 케이스는 건너뜀

      const acc = byShop.get(reservation.shopCode) ?? {
        grossAmount: 0,
        commissionAmount: 0,
        netPayoutAmount: 0,
        items: [],
      };
      for (const { componentCode, grossAmount } of componentGrossAmounts) {
        const { commissionType, commissionAmount, netAmount } = await this.resolveCommission(
          componentCode,
          reservation.shopCode,
          grossAmount,
        );
        acc.grossAmount += grossAmount;
        acc.commissionAmount += commissionAmount;
        acc.netPayoutAmount += netAmount;
        acc.items.push({
          reservationNo: reservation.reservationNo,
          productCode: componentCode,
          grossAmount,
          commissionType,
          commissionAmount,
          netAmount,
        });
      }
      byShop.set(reservation.shopCode, acc);
    }

    const batches: ShopSettlementBatchView[] = [];
    for (const [shopCode, acc] of byShop) {
      const batch = await this.prisma.shopSettlementBatch.upsert({
        where: { shopCode_settlementMonth: { shopCode, settlementMonth } },
        create: {
          shopCode,
          settlementMonth,
          grossAmount: acc.grossAmount,
          commissionAmount: acc.commissionAmount,
          netPayoutAmount: acc.netPayoutAmount,
          createdBy: adminUsername,
        },
        update: {
          grossAmount: { increment: acc.grossAmount },
          commissionAmount: { increment: acc.commissionAmount },
          netPayoutAmount: { increment: acc.netPayoutAmount },
          updatedBy: adminUsername,
        },
      });
      await this.prisma.shopSettlementItem.createMany({
        data: acc.items.map((item) => ({ ...item, batchId: batch.id })),
      });
      batches.push(await this.toBatchView(batch.id));
    }

    return {
      settlementMonth,
      processedReservationCount: targets.length,
      batches,
    };
  }

  /** 예약(신차매핑 차량)의 구성상품별 실거래가치 — packageValueAmount 계산과 동일한 방식으로 재조회
   * (ReservationsService.create()와 동일한 "회원의 가장 최근 MAP 차량" 해석 — 회원이 PKG 차량을 2대 이상
   * 보유한 경우 실제 이 예약이 어느 차인지 구분하는 FK가 없어 근사치임, 알려진 한계) */
  private async resolveComponentGrossAmounts(
    memberId: string,
  ): Promise<{ componentCode: string; grossAmount: number }[]> {
    const car = await this.prisma.myCar.findFirst({
      where: { memberId, regType: 'MAP', purchaseVin: { not: null } },
      include: { purchase: { select: { packageCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!car?.purchaseVin || !car.purchase?.packageCode) return [];

    const items = await this.prisma.newCarPurchaseItem.findMany({
      where: { vin: car.purchaseVin },
    });
    if (items.length === 0) return [];

    const detail = await this.productsService.getPackageDetail(car.purchase.packageCode);
    const realPriceByCode = new Map(
      [...detail.basicItems, ...detail.optionItems, ...detail.addItems].map((i) => [
        i.componentCode,
        i.effectivePrice ?? 0,
      ]),
    );
    return items.map((item) => ({
      componentCode: item.componentCode,
      grossAmount: realPriceByCode.get(item.componentCode) ?? 0,
    }));
  }

  /**
   * 구성상품×시공업체 매입가 계산 — 예외(ProductShopCommission)가 있으면 그걸, 없으면 Shop.defaultCommissionRate를
   * 기본값으로 사용. 정액(FIXED)은 그 금액을 지급액(netAmount)으로 직접 확정, 정률(RATE)은 grossAmount에서
   * 그 비율만큼 뗀 나머지를 지급(2026-08-23 확정 — "매입가"는 정액이면 지급액 자체, 정률이면 운영사가 떼는 수수료율).
   * 둘 다 없으면 수수료 0%(전액 지급)로 처리
   */
  private async resolveCommission(
    componentCode: string,
    shopCode: string,
    grossAmount: number,
  ): Promise<{ commissionType: string; commissionAmount: number; netAmount: number }> {
    const exception = await this.prisma.productShopCommission.findUnique({
      where: { productCode_shopCode: { productCode: componentCode, shopCode } },
    });
    if (exception) {
      if (exception.commissionType === 'FIXED') {
        const netAmount = exception.commissionAmount ?? 0;
        return { commissionType: 'FIXED', commissionAmount: grossAmount - netAmount, netAmount };
      }
      const rate = exception.commissionRate === null ? 0 : Number(exception.commissionRate);
      const commissionAmount = Math.round((grossAmount * rate) / 100);
      return { commissionType: 'RATE', commissionAmount, netAmount: grossAmount - commissionAmount };
    }

    const shop = await this.prisma.shop.findUnique({ where: { shopCode } });
    const rate = shop?.defaultCommissionRate === null || shop?.defaultCommissionRate === undefined
      ? 0
      : Number(shop.defaultCommissionRate);
    const commissionAmount = Math.round((grossAmount * rate) / 100);
    return { commissionType: 'RATE', commissionAmount, netAmount: grossAmount - commissionAmount };
  }

  async list(params: { settlementMonth?: string; shopCode?: string }): Promise<ShopSettlementBatchView[]> {
    const batches = await this.prisma.shopSettlementBatch.findMany({
      where: {
        ...(params.settlementMonth ? { settlementMonth: params.settlementMonth } : {}),
        ...(params.shopCode ? { shopCode: params.shopCode } : {}),
      },
      include: { shop: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: [{ settlementMonth: 'desc' }, { shopCode: 'asc' }],
    });
    return batches.map((b) => ({
      id: b.id,
      shopCode: b.shopCode,
      shopName: b.shop.name,
      settlementMonth: b.settlementMonth,
      grossAmount: b.grossAmount,
      commissionAmount: b.commissionAmount,
      netPayoutAmount: b.netPayoutAmount,
      payoutStatus: b.payoutStatus,
      payoutDate: b.payoutDate ? b.payoutDate.toISOString().slice(0, 10) : null,
      itemCount: b._count.items,
    }));
  }

  async getItems(batchId: number): Promise<ShopSettlementItemView[]> {
    const items = await this.prisma.shopSettlementItem.findMany({
      where: { batchId },
      orderBy: { id: 'asc' },
    });
    const productCodes = [...new Set(items.map((i) => i.productCode).filter((c): c is string => !!c))];
    const products = await this.prisma.product.findMany({
      where: { productCode: { in: productCodes } },
      select: { productCode: true, name: true },
    });
    const nameByCode = new Map(products.map((p) => [p.productCode, p.name]));
    return items.map((i) => ({
      id: i.id,
      reservationNo: i.reservationNo,
      productCode: i.productCode,
      productName: i.productCode ? (nameByCode.get(i.productCode) ?? null) : null,
      grossAmount: i.grossAmount,
      commissionType: i.commissionType,
      commissionAmount: i.commissionAmount,
      netAmount: i.netAmount,
    }));
  }

  async updatePayout(
    batchId: number,
    dto: UpdateShopSettlementPayoutDto,
    adminUsername: string,
  ): Promise<ShopSettlementBatchView> {
    const batch = await this.prisma.shopSettlementBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new NotFoundException('정산 배치를 찾을 수 없습니다.');
    }
    await this.prisma.shopSettlementBatch.update({
      where: { id: batchId },
      data: {
        payoutStatus: dto.payoutStatus,
        payoutDate: dto.payoutDate ? new Date(dto.payoutDate) : null,
        updatedBy: adminUsername,
      },
    });
    return this.toBatchView(batchId);
  }

  private async toBatchView(batchId: number): Promise<ShopSettlementBatchView> {
    const batch = await this.prisma.shopSettlementBatch.findUniqueOrThrow({
      where: { id: batchId },
      include: { shop: { select: { name: true } }, _count: { select: { items: true } } },
    });
    return {
      id: batch.id,
      shopCode: batch.shopCode,
      shopName: batch.shop.name,
      settlementMonth: batch.settlementMonth,
      grossAmount: batch.grossAmount,
      commissionAmount: batch.commissionAmount,
      netPayoutAmount: batch.netPayoutAmount,
      payoutStatus: batch.payoutStatus,
      payoutDate: batch.payoutDate ? batch.payoutDate.toISOString().slice(0, 10) : null,
      itemCount: batch._count.items,
    };
  }
}

/** "YYYY-MM" -> [해당월 00:00:00, 다음달 00:00:00) UTC 경계 — DB 저장이 전부 UTC라 그대로 비교 */
function monthRange(settlementMonth: string): [Date, Date] {
  const [y, m] = settlementMonth.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1));
  return [start, end];
}
