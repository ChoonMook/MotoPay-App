// 시공업체 월별 정산 배치 생성·조회·지급처리(AD-STL-04 정산 내역 조회) — 신차패키지(PKG)·입찰(BID) 공통
// (2026-08-23 확정: 박경미 고객 실사례로 BID의 productCode 해석 규칙을 확정. 스케줄러 인프라가 없어
// 관리자가 화면에서 대상월을 지정해 수동 실행하는 방식, 2026-08-23 확정)
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Reservation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import type { UpdateShopSettlementPayoutDto } from './dto/update-shop-settlement-payout.dto';

const HANDOVER_AUTO_CONFIRM_DAYS = 3;

// CommonCodeDetail(CAR_INST) -> CommonCodeDetail(PROD_CAT) 매핑 — customer-app rsvTypes.ts의
// PROD_CAT_BY_INST_CODE와 동일(유리막 코팅만 CAR_INST='CCA'/PROD_CAT='COAT'로 서로 다름). BID 항목의
// productName을 카탈로그 Product.name과 매칭할 때 카테고리를 좁혀 오매칭을 방지하는 용도
const PROD_CAT_BY_INST_CODE: Record<string, string> = {
  TINT: 'TINT',
  PPF: 'PPF',
  BBOX: 'BBOX',
  CCA: 'COAT',
  UCOAT: 'UCOAT',
  CLEAN: 'CLEAN',
};

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
  reservationType: string; // 'PKG' | 'BID'
  serviceDate: string; // "YYYY-MM-DD" — 시공(예약) 일자
  customerName: string;
  carLabel: string | null; // 브랜드+차종(+세부차종명) — 회원의 신차매핑 차량 정보를 못 찾으면 null
  packageName: string | null; // 신차패키지명 — PKG 건만 값 있음, BID는 항상 null
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
   * PKG·BID 정산 배치 생성(수동 실행) — 대상월(settlementMonth, "YYYY-MM")에 인수확인이 완료된 예약 중
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
        reservationType: { in: ['PKG', 'BID'] },
        status: 'CONFIRMED',
        progressStatus: 'DONE',
        handoverConfirmedAt: { gte: monthStart, lt: monthEnd },
        settlementItems: { none: {} },
      },
    });
    const pendingAutoConfirm = await this.prisma.reservation.findMany({
      where: {
        reservationType: { in: ['PKG', 'BID'] },
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
      productCode: string | null;
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
      const componentGrossAmounts =
        reservation.reservationType === 'PKG'
          ? await this.resolveComponentGrossAmounts(reservation.memberId)
          : await this.resolveBidComponentGrossAmounts(reservation);
      if (componentGrossAmounts.length === 0) continue; // 구성상품·응찰 내역을 못 찾은 예외 케이스는 건너뜀

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
          reservation.reservationType,
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
   * 입찰(BID) 예약의 항목별 productCode·기준액 — 박경미 고객 실사례로 확정한 규칙(2026-08-23):
   * 기준액(grossAmount)은 실제 응찰가(BidOfferItem.price/BidPlanItem.offerPrice) 그대로 사용(카탈로그
   * 정가가 아님 — paidAmount와 항상 정확히 일치해야 하므로).
   * - 일반입찰(GENERAL): BidOfferItem에는 상품 연결이 없어, 같은 요청의 BidRequestItem.productName을
   *   같은 카테고리(CAR_INST->PROD_CAT) 안에서 Product.name과 정확히 매칭해 productCode를 역으로 찾는다
   *   (customer-app이 "제품 상세" 판매가를 채울 때 쓰는 것과 동일한 매칭 방식).
   * - 전문가추천(EXPERT): BidPlanItem에 productCode가 이미 직접 저장돼 있으면(카탈로그에서 고른 경우) 그대로 사용.
   * 매칭 실패(자유 입력 상품명, 또는 EXPERT에서 productCode 자체가 null)면 productCode=null로 기록하고
   * 업체 기본 정률로 계산한다(resolveCommission이 null을 그렇게 처리, 2026-08-23 확정)
   */
  private async resolveBidComponentGrossAmounts(
    reservation: Reservation,
  ): Promise<{ componentCode: string | null; grossAmount: number }[]> {
    if (!reservation.requestNo) return [];
    const request = await this.prisma.bidRequest.findUnique({
      where: { requestNo: reservation.requestNo },
    });
    if (!request) return [];

    if (request.reqType === 'EXPERT') {
      if (!request.selectedPlanNo) return [];
      const plan = await this.prisma.bidPlan.findUnique({
        where: { planNo: request.selectedPlanNo },
        include: { items: true },
      });
      if (!plan) return [];
      const results: { componentCode: string | null; grossAmount: number }[] = [];
      for (const item of plan.items) {
        const componentCode =
          item.productCode ?? (await this.matchProductCode(item.productName, item.instCode));
        results.push({ componentCode, grossAmount: item.offerPrice });
      }
      return results;
    }

    // GENERAL
    if (!request.selectedOfferNo) return [];
    const offer = await this.prisma.bidOffer.findUnique({
      where: { offerNo: request.selectedOfferNo },
      include: { items: true },
    });
    if (!offer) return [];
    const requestItems = await this.prisma.bidRequestItem.findMany({
      where: { requestNo: request.requestNo },
    });
    const productNameByInstCode = new Map(requestItems.map((i) => [i.instCode, i.productName]));
    const results: { componentCode: string | null; grossAmount: number }[] = [];
    for (const item of offer.items) {
      const productName = productNameByInstCode.get(item.instCode) ?? null;
      const componentCode = await this.matchProductCode(productName, item.instCode);
      results.push({ componentCode, grossAmount: item.price });
    }
    return results;
  }

  /** 상품명 + 시공항목코드로 카탈로그 상품을 역매칭 — 이름·카테고리가 정확히 일치해야 함(느슨한 매칭 안 함) */
  private async matchProductCode(
    productName: string | null,
    instCode: string,
  ): Promise<string | null> {
    if (!productName) return null;
    const prodCat = PROD_CAT_BY_INST_CODE[instCode];
    if (!prodCat) return null;
    const matched = await this.prisma.product.findFirst({
      where: { name: productName, prodCat },
    });
    return matched?.productCode ?? null;
  }

  /**
   * 구성상품×시공업체 매입가 계산 — 예외(ProductShopCommission)가 있으면 그걸, 없으면 Shop.defaultCommissionRate를
   * 기본값으로 사용. 정액(FIXED)은 그 금액을 지급액(netAmount)으로 직접 확정, 정률(RATE)은 grossAmount에서
   * 그 비율만큼 뗀 나머지를 지급(2026-08-23 확정 — "매입가"는 정액이면 지급액 자체, 정률이면 운영사가 떼는 수수료율).
   * 단, 정액(FIXED) 예외는 신차패키지(PKG) 구성상품 전용 개념이라 예약시공(BID)에는 적용하지 않는다 —
   * BID는 상품별 예외가 있어도 그 예외가 FIXED면 무시하고 정률(RATE) 예외 또는 업체 기본 정률로만 계산한다
   * (2026-08-24 확정: 같은 Product가 ncpApplicable·bidApplicable로 양쪽 채널에 다 노출될 수 있어 productCode+shopCode
   * 만으로는 채널을 구분 못하므로, 여기서 reservationType으로 FIXED 적용 여부를 가른다).
   * componentCode가 null이면(BID 상품 매칭 실패) 예외 조회를 건너뛰고 바로 업체 기본값으로 계산한다.
   * 아무 기준도 없으면 수수료 0%(전액 지급)로 처리
   */
  private async resolveCommission(
    componentCode: string | null,
    shopCode: string,
    grossAmount: number,
    reservationType: string,
  ): Promise<{ commissionType: string; commissionAmount: number; netAmount: number }> {
    const exception = componentCode
      ? await this.prisma.productShopCommission.findUnique({
          where: { productCode_shopCode: { productCode: componentCode, shopCode } },
        })
      : null;
    const applicableException =
      exception && !(reservationType === 'BID' && exception.commissionType === 'FIXED') ? exception : null;
    if (applicableException) {
      if (applicableException.commissionType === 'FIXED') {
        const netAmount = applicableException.commissionAmount ?? 0;
        return { commissionType: 'FIXED', commissionAmount: grossAmount - netAmount, netAmount };
      }
      const rate = applicableException.commissionRate === null ? 0 : Number(applicableException.commissionRate);
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

  /**
   * AD-STL-04 정산 배치 상세 — 예약별로 신차패키지(PKG)/예약시공(BID) 구분·고객명·차종·시공일자·패키지명까지
   * 함께 보여준다(2026-08-24 확정). PKG는 회원의 신차매핑 차량을 조회(2대 이상 보유 시 근사치, 다른 곳과
   * 동일한 알려진 한계), BID는 BidRequest.myCarId로 정확히 그 요청의 차량을 가져온다(FK라 근사치 아님)
   */
  async getItems(batchId: number): Promise<ShopSettlementItemView[]> {
    const items = await this.prisma.shopSettlementItem.findMany({
      where: { batchId },
      orderBy: { id: 'asc' },
    });
    if (items.length === 0) return [];

    const productCodes = [...new Set(items.map((i) => i.productCode).filter((c): c is string => !!c))];
    const reservationNos = [...new Set(items.map((i) => i.reservationNo))];
    const [products, reservations] = await Promise.all([
      this.prisma.product.findMany({
        where: { productCode: { in: productCodes } },
        select: { productCode: true, name: true },
      }),
      this.prisma.reservation.findMany({
        where: { reservationNo: { in: reservationNos } },
        include: { member: { select: { name: true } } },
      }),
    ]);
    const nameByCode = new Map(products.map((p) => [p.productCode, p.name]));

    // PKG 건 — 회원별로 "가장 최근 MAP 차량"을 조회(구성상품 매입가 계산과 동일한 근사 방식)
    const pkgMemberIds = [...new Set(reservations.filter((r) => r.reservationType === 'PKG').map((r) => r.memberId))];
    const pkgCarByMember = new Map<
      string,
      { carBrandCode: string; carModelCode: string; trimName: string | null; packageCode: string | null }
    >();
    for (const memberId of pkgMemberIds) {
      const car = await this.prisma.myCar.findFirst({
        where: { memberId, regType: 'MAP', purchaseVin: { not: null } },
        include: { purchase: { select: { packageCode: true } } },
        orderBy: { createdAt: 'desc' },
      });
      if (car) {
        pkgCarByMember.set(memberId, {
          carBrandCode: car.carBrandCode,
          carModelCode: car.carModelCode,
          trimName: car.trimName,
          packageCode: car.purchase?.packageCode ?? null,
        });
      }
    }

    // BID 건 — BidRequest.myCarId로 그 요청에서 실제로 쓴 차량을 정확히 가져옴(근사치 아님)
    const bidRequestNos = [
      ...new Set(reservations.filter((r) => r.reservationType === 'BID' && r.requestNo).map((r) => r.requestNo!)),
    ];
    const bidRequests = await this.prisma.bidRequest.findMany({
      where: { requestNo: { in: bidRequestNos } },
      select: { requestNo: true, myCarId: true },
    });
    const myCarIdByRequestNo = new Map(bidRequests.map((r) => [r.requestNo, r.myCarId]));
    const bidCarIds = [...new Set(bidRequests.map((r) => r.myCarId).filter((id): id is number => id !== null))];
    const bidCars = await this.prisma.myCar.findMany({ where: { id: { in: bidCarIds } } });
    const bidCarById = new Map(bidCars.map((c) => [c.id, c]));

    // 차종 라벨(브랜드·모델명)·패키지명(Product.name) 조회 — PKG/BID 양쪽 차량코드를 모아 한 번에
    const brandCodes = new Set<string>();
    const modelCodes = new Set<string>();
    for (const c of pkgCarByMember.values()) {
      brandCodes.add(c.carBrandCode);
      modelCodes.add(c.carModelCode);
    }
    for (const c of bidCarById.values()) {
      brandCodes.add(c.carBrandCode);
      modelCodes.add(c.carModelCode);
    }
    const packageCodes = [...new Set([...pkgCarByMember.values()].map((c) => c.packageCode).filter((c): c is string => !!c))];
    const [brandDetails, modelDetails, packages] = await Promise.all([
      this.prisma.commonCodeDetail.findMany({ where: { code: 'CAR_BRAND', detailCode: { in: [...brandCodes] } } }),
      this.prisma.commonCodeDetail.findMany({ where: { code: 'CAR_MODEL', detailCode: { in: [...modelCodes] } } }),
      this.prisma.product.findMany({ where: { productCode: { in: packageCodes } }, select: { productCode: true, name: true } }),
    ]);
    const brandNameByCode = new Map(brandDetails.map((d) => [d.detailCode, d.detailName]));
    const modelNameByCode = new Map(modelDetails.map((d) => [d.detailCode, d.detailName]));
    const packageNameByCode = new Map(packages.map((p) => [p.productCode, p.name]));

    const carLabel = (carBrandCode: string, carModelCode: string, trimName: string | null): string => {
      const brand = brandNameByCode.get(carBrandCode) ?? carBrandCode;
      const model = modelNameByCode.get(carModelCode) ?? carModelCode;
      return trimName ? `${brand} ${model} ${trimName}` : `${brand} ${model}`;
    };

    // 예약별 부가정보(고객명·차종·패키지명 등)를 한 번만 계산해 같은 예약의 여러 항목이 공유하도록 함
    interface ReservationInfo {
      reservationType: string;
      serviceDate: string;
      customerName: string;
      carLabel: string | null;
      packageName: string | null;
    }
    const infoByReservationNo = new Map<string, ReservationInfo>(
      reservations.map((r): [string, ReservationInfo] => {
        if (r.reservationType === 'PKG') {
          const car = pkgCarByMember.get(r.memberId);
          return [
            r.reservationNo,
            {
              reservationType: r.reservationType,
              serviceDate: r.date.toISOString().slice(0, 10),
              customerName: r.member.name,
              carLabel: car ? carLabel(car.carBrandCode, car.carModelCode, car.trimName) : null,
              packageName: car?.packageCode ? (packageNameByCode.get(car.packageCode) ?? null) : null,
            },
          ];
        }
        const carId = r.requestNo ? myCarIdByRequestNo.get(r.requestNo) : null;
        const car = carId ? bidCarById.get(carId) : null;
        return [
          r.reservationNo,
          {
            reservationType: r.reservationType,
            serviceDate: r.date.toISOString().slice(0, 10),
            customerName: r.member.name,
            carLabel: car ? carLabel(car.carBrandCode, car.carModelCode, car.trimName) : null,
            packageName: null,
          },
        ];
      }),
    );

    return items.map((i) => {
      const info = infoByReservationNo.get(i.reservationNo);
      return {
        id: i.id,
        reservationNo: i.reservationNo,
        reservationType: info?.reservationType ?? '-',
        serviceDate: info?.serviceDate ?? '-',
        customerName: info?.customerName ?? '-',
        carLabel: info?.carLabel ?? null,
        packageName: info?.packageName ?? null,
        productCode: i.productCode,
        productName: i.productCode ? (nameByCode.get(i.productCode) ?? null) : null,
        grossAmount: i.grossAmount,
        commissionType: i.commissionType,
        commissionAmount: i.commissionAmount,
        netAmount: i.netAmount,
      };
    });
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
