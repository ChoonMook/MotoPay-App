// 예약시공(입찰) 요청 생성/내 요청 목록 조회/취소, 업체의 입찰 제출/고객의 업체 선택까지 다룸(결제·예약 생성은 이후 단계 범위)
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BidRequest,
  BidRequestItem,
  BidRequestPosition,
  BidOfferItem,
  BidPlanItem,
  BidPlanPosition,
  MyCar,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShopScheduleService } from '../shops/shop-schedule.service';
import {
  formatDateOnly,
  formatTimeOnly,
  parseDateOnly,
  parseTimeOnly,
  todayUtcMidnight,
} from '../common/schedule-date.util';
import type { CreateBidRequestDto } from './dto/create-bid-request.dto';
import type { CancelBidRequestDto } from './dto/cancel-bid-request.dto';
import type { SubmitBidOfferDto } from './dto/submit-bid-offer.dto';
import type { SubmitBidPlanDto } from './dto/submit-bid-plan.dto';

const BID_DEADLINE_DAYS = 1; // 입찰 마감 기한 정책 미정 상태의 임시 상수 — createdAt + N일

type CarSnapshot = Pick<MyCar, 'carBrandCode' | 'carModelCode' | 'trimName'>;
const CAR_SELECT = {
  carBrandCode: true,
  carModelCode: true,
  trimName: true,
} as const;

export interface BidRequestView extends Omit<BidRequest, 'desiredDate'> {
  desiredDate: string; // "YYYY-MM-DD"
  items: BidRequestItem[];
  positions: BidRequestPosition[];
  // 요청 시점 대표차량 스냅샷(브랜드/차종 코드는 프론트에서 CommonCodeDetail(CAR_BRAND/CAR_MODEL) 조회로 라벨 변환)
  car: CarSnapshot | null;
}

type BidRequestWithChildren = BidRequest & {
  items: BidRequestItem[];
  positions: BidRequestPosition[];
  myCar: CarSnapshot | null;
};

function toView(row: BidRequestWithChildren): BidRequestView {
  const { desiredDate, myCar, ...rest } = row;
  return { ...rest, desiredDate: formatDateOnly(desiredDate), car: myCar };
}

// 입찰의뢰받은 업체(파트너앱) 관점의 요청 뷰 — 고객 뷰(BidRequestView)와 달리 요청자 이름을 노출.
// car는 고객 뷰와 동일하게 브랜드·차종 코드 그대로 반환(파트너앱이 CommonCodeDetail(CAR_BRAND/CAR_MODEL) 조회로
// "벤츠 E-Class"처럼 라벨 변환 — 고객앱과 동일한 표시 방식을 맞추기 위함, trimName만으로는 브랜드·모델명이 드러나지 않음)
export interface ShopBidRequestView {
  requestNo: string;
  customerName: string;
  reqType: string;
  car: CarSnapshot | null;
  items: BidRequestItem[];
  positions: BidRequestPosition[];
  radiusKm: number;
  minRating: number | null;
  budget: number | null;
  note: string | null;
  desiredDate: string;
  bidDeadline: string;
  status: string;
  // 고객이 최종 선택한 응찰번호(GENERAL, 없으면 null) — 파트너앱이 자기 응찰(myOffer.offerNo)과 비교해 낙찰 여부를 판단
  selectedOfferNo: string | null;
  // 고객이 최종 선택한 추천번호(EXPERT, 없으면 null) — 파트너앱이 자기 추천안(myPlan.planNo)과 비교해 낙찰 여부를 판단
  selectedPlanNo: string | null;
  // 내 업체가 이 요청에 이미 제출한 입찰(없으면 null) — 요청이 OPEN인 동안은 재제출(수정) 가능
  myOffer: {
    offerNo: string;
    items: BidOfferItem[];
    scheduledDate: string;
    scheduledTime: string;
    memo: string | null;
  } | null;
  // 내 업체가 이 요청에 이미 제출한 추천안(없으면 null) — 요청이 OPEN인 동안은 재제출(수정) 가능
  myPlan: {
    planNo: string;
    items: BidPlanItem[];
    positions: BidPlanPosition[];
    scheduledDate: string;
    scheduledTime: string;
    reason: string;
  } | null;
}

// 고객이 보는 응찰(입찰) 뷰 — 항목별 견적을 그대로 노출(원본 디자인의 "항목별 견적 투명 공개" 컨셉)
export interface BidOfferView {
  offerNo: string;
  shopCode: string;
  shopName: string;
  items: BidOfferItem[];
  scheduledDate: string; // "YYYY-MM-DD" — 요청의 희망일과 다를 수 있음(파트너가 다른 날짜로 응찰한 경우)
  scheduledTime: string; // "HH:mm"
  memo: string | null;
  createdAt: string;
}

// 고객이 보는 추천안(EXPERT) 뷰
export interface BidPlanView {
  planNo: string;
  shopCode: string;
  shopName: string;
  items: BidPlanItem[];
  positions: BidPlanPosition[];
  scheduledDate: string; // "YYYY-MM-DD" — 요청의 희망일과 다를 수 있음(파트너가 다른 날짜로 추천한 경우)
  scheduledTime: string; // "HH:mm"
  reason: string;
  createdAt: string;
}

@Injectable()
export class BidRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopScheduleService: ShopScheduleService,
  ) {}

  async create(
    memberId: string,
    dto: CreateBidRequestDto,
  ): Promise<BidRequestView> {
    const items = dto.items ?? [];
    // 부위·농도는 일반입찰 + 썬팅(틴팅) 선택 시에만 의미가 있음 — 전문가추천은 애초에 이 화면을 거치지 않으므로 항상 무시
    const positions = dto.reqType === 'GENERAL' ? (dto.positions ?? []) : [];

    if (items.length === 0) {
      throw new BadRequestException(
        dto.reqType === 'GENERAL'
          ? '시공 항목을 1개 이상 선택해주세요.'
          : '관심 카테고리를 1개 이상 선택해주세요.',
      );
    }
    if (dto.reqType === 'EXPERT' && !dto.budget) {
      throw new BadRequestException('희망 예산을 입력해주세요.');
    }
    if (
      positions.length > 0 &&
      !items.some((item) => item.instCode === 'TINT')
    ) {
      throw new BadRequestException(
        '썬팅(틴팅)을 선택하지 않으면 부위·농도를 지정할 수 없습니다.',
      );
    }

    const desiredDate = parseDateOnly(dto.desiredDate);
    if (desiredDate < todayUtcMidnight()) {
      throw new BadRequestException('희망 시공일은 오늘 이후로 선택해주세요.');
    }

    const myCar = await this.prisma.myCar.findFirst({
      where: { memberId, isDefault: true },
    });

    const bidDeadline = new Date(
      Date.now() + BID_DEADLINE_DAYS * 24 * 60 * 60 * 1000,
    );

    const created = await this.prisma.$transaction(async (tx) => {
      // 조건을 바꿔 다시 등록하는 경우 — 이미 응찰(업체 입찰/추천안)이 붙은 이전 OPEN 요청이 있으면 등록 자체를
      // 막고(업체가 이미 작업 중일 수 있어 조용히 취소하면 안 됨), 응찰이 하나도 없는 이전 OPEN 요청은 자동
      // 취소하고 새 요청을 등록한다. 취소사유는 사용자가 직접 고른 게 아니라 시스템이 자동으로 정한 것이라
      // "추후 재요청"(RE_REQUEST)을 그대로 쓰지 않고 기타(ETC) + 안내문구로 구분해서 기록한다(2026-08-14 사용자 확정)
      // findMany로 전부 확인 — 한 회원이 OPEN 요청을 동시에 여러 건 갖고 있을 수도 있어(findFirst로 하나만
      // 보면 다른 요청에 붙은 응찰을 놓칠 수 있음) 전체를 검사하고 전부 취소한다
      const openRequests = await tx.bidRequest.findMany({
        where: { memberId, status: 'OPEN' },
        include: { _count: { select: { offers: true, plans: true } } },
      });
      const hasOffers = openRequests.some(
        (r) => r._count.offers > 0 || r._count.plans > 0,
      );
      if (hasOffers) {
        throw new BadRequestException(
          '이미 응찰한 업체가 있는 진행중인 요청이 있어 새로 등록할 수 없습니다. 기존 요청을 확인해주세요.',
        );
      }
      if (openRequests.length > 0) {
        await tx.bidRequest.updateMany({
          where: { id: { in: openRequests.map((r) => r.id) } },
          data: {
            status: 'CANCELLED',
            cancelReason: 'ETC',
            cancelReasonNote: '고객 재요청',
          },
        });
      }

      const req = await tx.bidRequest.create({
        data: {
          requestNo: '0'.repeat(10),
          memberId,
          myCarId: myCar?.id ?? null,
          reqType: dto.reqType,
          desiredDate,
          radiusKm: dto.radiusKm,
          minRating: dto.minRating,
          budget: dto.reqType === 'EXPERT' ? dto.budget : null,
          note: dto.reqType === 'EXPERT' ? dto.note : null,
          bidDeadline,
        },
      });
      const requestNo = String(req.id).padStart(10, '0');
      await tx.bidRequest.update({
        where: { id: req.id },
        data: { requestNo },
      });

      await tx.bidRequestItem.createMany({
        data: items.map((item) => ({
          requestNo,
          instCode: item.instCode,
          productName:
            dto.reqType === 'GENERAL' ? (item.productName ?? null) : null,
        })),
      });
      if (positions.length) {
        await tx.bidRequestPosition.createMany({
          data: positions.map((pos) => ({
            requestNo,
            position: pos.position,
            level: pos.level,
          })),
        });
      }

      // 입찰의뢰 발송 — 요청 항목(instCode) 중 하나라도 지원하는 업체 전체에 발송(반경은 회원 좌표 부재로 미사용)
      const instCodes = [...new Set(items.map((item) => item.instCode))];
      const matchedShops = await tx.shopInstCategory.findMany({
        where: { instCode: { in: instCodes }, shop: { useYn: true } },
        select: { shopCode: true },
        distinct: ['shopCode'],
      });
      if (matchedShops.length) {
        await tx.bidInvitation.createMany({
          data: matchedShops.map((s) => ({ requestNo, shopCode: s.shopCode })),
        });
      }

      return tx.bidRequest.findUniqueOrThrow({
        where: { requestNo },
        include: {
          items: true,
          positions: true,
          myCar: { select: CAR_SELECT },
        },
      });
    });

    return toView(created);
  }

  async listMine(memberId: string): Promise<BidRequestView[]> {
    const rows = await this.prisma.bidRequest.findMany({
      where: { memberId },
      include: { items: true, positions: true, myCar: { select: CAR_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toView);
  }

  /** 요청 취소 — 아직 입찰/추천안이 붙지 않는 OPEN 상태만 가능(수정 대신 취소 후 재요청 방식) */
  async cancel(
    memberId: string,
    id: number,
    dto: CancelBidRequestDto,
  ): Promise<BidRequestView> {
    const existing = await this.prisma.bidRequest.findUnique({ where: { id } });
    if (!existing || existing.memberId !== memberId) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }
    if (existing.status !== 'OPEN') {
      throw new BadRequestException('입찰중인 요청만 취소할 수 있습니다.');
    }
    if (dto.cancelReason === 'ETC' && !dto.cancelReasonNote?.trim()) {
      throw new BadRequestException('기타 사유를 입력해주세요.');
    }

    const updated = await this.prisma.bidRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: dto.cancelReason,
        cancelReasonNote:
          dto.cancelReason === 'ETC' ? (dto.cancelReasonNote ?? null) : null,
      },
      include: { items: true, positions: true, myCar: { select: CAR_SELECT } },
    });
    return toView(updated);
  }

  /** 내 업체(파트너앱)로 입찰의뢰가 온 요청 목록 — 고객이 취소(CANCELLED)한 요청은 제외 */
  async listInvitedForShop(shopCode: string): Promise<ShopBidRequestView[]> {
    const invitations = await this.prisma.bidInvitation.findMany({
      where: { shopCode, request: { status: { not: 'CANCELLED' } } },
      include: {
        request: {
          include: {
            items: true,
            positions: true,
            myCar: { select: CAR_SELECT },
            member: { select: { name: true } },
            offers: { where: { shopCode }, include: { items: true } },
            plans: {
              where: { shopCode },
              include: { items: true, positions: true },
            },
          },
        },
      },
      orderBy: { request: { createdAt: 'desc' } },
    });

    return invitations.map(({ request: r }) => {
      const myOffer = r.offers[0];
      const myPlan = r.plans[0];
      return {
        requestNo: r.requestNo,
        customerName: r.member.name,
        reqType: r.reqType,
        car: r.myCar,
        items: r.items,
        positions: r.positions,
        radiusKm: r.radiusKm,
        minRating: r.minRating,
        budget: r.budget,
        note: r.note,
        desiredDate: formatDateOnly(r.desiredDate),
        bidDeadline: r.bidDeadline.toISOString(),
        status: r.status,
        selectedOfferNo: r.selectedOfferNo,
        selectedPlanNo: r.selectedPlanNo,
        myOffer: myOffer
          ? {
              offerNo: myOffer.offerNo,
              items: myOffer.items,
              scheduledDate: formatDateOnly(myOffer.scheduledDate ?? r.desiredDate),
              scheduledTime: formatTimeOnly(myOffer.scheduledTime),
              memo: myOffer.memo,
            }
          : null,
        myPlan: myPlan
          ? {
              planNo: myPlan.planNo,
              items: myPlan.items,
              positions: myPlan.positions,
              scheduledDate: formatDateOnly(myPlan.scheduledDate ?? r.desiredDate),
              scheduledTime: formatTimeOnly(myPlan.scheduledTime),
              reason: myPlan.reason,
            }
          : null,
      };
    });
  }

  /**
   * 업체(파트너앱)의 입찰 제출 — 의뢰받은 요청에 한해, 고객이 아직 업체를 선택하지 않은(OPEN) 동안은
   * 이미 제출한 입찰도 다시 제출해 항목별 견적·시공 예정 시각·메모를 수정할 수 있음(선택 이후에는 status 체크에서 막힘)
   */
  async submitOffer(
    shopCode: string,
    requestNo: string,
    dto: SubmitBidOfferDto,
  ): Promise<void> {
    const invitation = await this.prisma.bidInvitation.findUnique({
      where: { requestNo_shopCode: { requestNo, shopCode } },
    });
    if (!invitation) {
      throw new ForbiddenException(
        '입찰의뢰를 받은 요청만 참여할 수 있습니다.',
      );
    }

    const request = await this.prisma.bidRequest.findUnique({
      where: { requestNo },
      include: { items: true },
    });
    if (!request) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }
    if (request.status !== 'OPEN') {
      throw new BadRequestException(
        '입찰중인 요청만 참여(수정)할 수 있습니다.',
      );
    }

    const existing = await this.prisma.bidOffer.findUnique({
      where: { requestNo_shopCode: { requestNo, shopCode } },
    });

    const requestInstCodes = new Set(
      request.items.map((item) => item.instCode),
    );
    const dtoInstCodes = new Set<string>(
      dto.items.map((item) => item.instCode),
    );
    const sameSet =
      requestInstCodes.size === dtoInstCodes.size &&
      [...requestInstCodes].every((code) => dtoInstCodes.has(code));
    if (!sameSet) {
      throw new BadRequestException('요청한 시공 항목과 일치하지 않습니다.');
    }

    // 희망일에 슬롯이 없으면 파트너가 다른 날짜를 지정해 응찰할 수 있음 — 생략 시 요청의 희망일 그대로 사용
    const scheduledDate = dto.scheduledDate
      ? parseDateOnly(dto.scheduledDate)
      : request.desiredDate;
    if (scheduledDate < todayUtcMidnight()) {
      throw new BadRequestException('시공 예정일은 오늘 이후로 선택해주세요.');
    }
    const schedule = await this.shopScheduleService.getDailySchedule(
      shopCode,
      formatDateOnly(scheduledDate),
    );
    if (schedule.isHoliday) {
      throw new BadRequestException('선택한 날짜는 업체 휴무일입니다.');
    }
    const slot = schedule.slots.find((s) => s.time === dto.scheduledTime);
    if (
      !slot ||
      slot.capacity === null ||
      slot.isLocked ||
      slot.reservedCount >= slot.capacity
    ) {
      throw new BadRequestException(
        '선택한 시간은 예약 가능한 시간이 아닙니다.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      let offerNo: string;
      if (existing) {
        offerNo = existing.offerNo;
        await tx.bidOffer.update({
          where: { offerNo },
          data: {
            scheduledDate,
            scheduledTime: parseTimeOnly(dto.scheduledTime),
            memo: dto.memo,
          },
        });
        await tx.bidOfferItem.deleteMany({ where: { offerNo } });
      } else {
        const offer = await tx.bidOffer.create({
          data: {
            offerNo: '0'.repeat(10),
            requestNo,
            shopCode,
            scheduledDate,
            scheduledTime: parseTimeOnly(dto.scheduledTime),
            memo: dto.memo,
          },
        });
        offerNo = String(offer.id).padStart(10, '0');
        await tx.bidOffer.update({
          where: { id: offer.id },
          data: { offerNo },
        });
      }
      await tx.bidOfferItem.createMany({
        data: dto.items.map((item) => ({
          offerNo,
          instCode: item.instCode,
          price: item.price,
        })),
      });
    });
  }

  /**
   * 업체(파트너앱)의 추천안 제출(전문가추천 전용) — submitOffer와 동일한 초대·상태·항목집합 검증 재사용,
   * 추가로 관심 카테고리에 TINT가 없으면 부위/농도를 지정할 수 없도록 검증. 요청이 OPEN인 동안은 재제출(수정) 가능.
   */
  async submitPlan(
    shopCode: string,
    requestNo: string,
    dto: SubmitBidPlanDto,
  ): Promise<void> {
    const invitation = await this.prisma.bidInvitation.findUnique({
      where: { requestNo_shopCode: { requestNo, shopCode } },
    });
    if (!invitation) {
      throw new ForbiddenException(
        '입찰의뢰를 받은 요청만 참여할 수 있습니다.',
      );
    }

    const request = await this.prisma.bidRequest.findUnique({
      where: { requestNo },
      include: { items: true },
    });
    if (!request) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }
    if (request.reqType !== 'EXPERT') {
      throw new BadRequestException(
        '전문가추천 요청에만 추천안을 제출할 수 있습니다.',
      );
    }
    if (request.status !== 'OPEN') {
      throw new BadRequestException(
        '입찰중인 요청만 참여(수정)할 수 있습니다.',
      );
    }

    const existing = await this.prisma.bidPlan.findUnique({
      where: { requestNo_shopCode: { requestNo, shopCode } },
    });

    const requestInstCodes = new Set(
      request.items.map((item) => item.instCode),
    );
    const dtoInstCodes = new Set<string>(
      dto.items.map((item) => item.instCode),
    );
    const sameSet =
      requestInstCodes.size === dtoInstCodes.size &&
      [...requestInstCodes].every((code) => dtoInstCodes.has(code));
    if (!sameSet) {
      throw new BadRequestException(
        '요청한 관심 카테고리와 일치하지 않습니다.',
      );
    }
    const positions = dto.positions ?? [];
    if (
      positions.length > 0 &&
      !dto.items.some((item) => item.instCode === 'TINT')
    ) {
      throw new BadRequestException(
        '썬팅(틴팅)을 포함하지 않으면 부위·농도를 지정할 수 없습니다.',
      );
    }

    // 희망일에 슬롯이 없으면 파트너가 다른 날짜를 지정해 추천할 수 있음 — 생략 시 요청의 희망일 그대로 사용
    const scheduledDate = dto.scheduledDate
      ? parseDateOnly(dto.scheduledDate)
      : request.desiredDate;
    if (scheduledDate < todayUtcMidnight()) {
      throw new BadRequestException('시공 예정일은 오늘 이후로 선택해주세요.');
    }
    const schedule = await this.shopScheduleService.getDailySchedule(
      shopCode,
      formatDateOnly(scheduledDate),
    );
    if (schedule.isHoliday) {
      throw new BadRequestException('선택한 날짜는 업체 휴무일입니다.');
    }
    const slot = schedule.slots.find((s) => s.time === dto.scheduledTime);
    if (
      !slot ||
      slot.capacity === null ||
      slot.isLocked ||
      slot.reservedCount >= slot.capacity
    ) {
      throw new BadRequestException(
        '선택한 시간은 예약 가능한 시간이 아닙니다.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      let planNo: string;
      if (existing) {
        planNo = existing.planNo;
        await tx.bidPlan.update({
          where: { planNo },
          data: {
            scheduledDate,
            scheduledTime: parseTimeOnly(dto.scheduledTime),
            reason: dto.reason,
          },
        });
        await tx.bidPlanItem.deleteMany({ where: { planNo } });
        await tx.bidPlanPosition.deleteMany({ where: { planNo } });
      } else {
        const plan = await tx.bidPlan.create({
          data: {
            planNo: '0'.repeat(10),
            requestNo,
            shopCode,
            scheduledDate,
            scheduledTime: parseTimeOnly(dto.scheduledTime),
            reason: dto.reason,
          },
        });
        planNo = String(plan.id).padStart(10, '0');
        await tx.bidPlan.update({ where: { id: plan.id }, data: { planNo } });
      }
      await tx.bidPlanItem.createMany({
        data: dto.items.map((item) => ({
          planNo,
          instCode: item.instCode,
          productCode: item.productCode,
          productName: item.productName,
          retailPrice: item.retailPrice,
          offerPrice: item.offerPrice,
        })),
      });
      if (positions.length) {
        await tx.bidPlanPosition.createMany({
          data: positions.map((pos) => ({
            planNo,
            position: pos.position,
            level: pos.level,
          })),
        });
      }
    });
  }

  /** 고객이 보는 특정 요청의 입찰 목록(비교화면) */
  async listOffersForRequest(
    memberId: string,
    id: number,
  ): Promise<BidOfferView[]> {
    const request = await this.prisma.bidRequest.findUnique({ where: { id } });
    if (!request || request.memberId !== memberId) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }

    const offers = await this.prisma.bidOffer.findMany({
      where: { requestNo: request.requestNo },
      include: { items: true, shop: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return offers.map((o) => ({
      offerNo: o.offerNo,
      shopCode: o.shopCode,
      shopName: o.shop.name,
      items: o.items,
      scheduledDate: formatDateOnly(o.scheduledDate ?? request.desiredDate),
      scheduledTime: formatTimeOnly(o.scheduledTime),
      memo: o.memo,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  /** 고객이 보는 특정 요청의 추천안 목록(비교화면, 전문가추천 전용) */
  async listPlansForRequest(
    memberId: string,
    id: number,
  ): Promise<BidPlanView[]> {
    const request = await this.prisma.bidRequest.findUnique({ where: { id } });
    if (!request || request.memberId !== memberId) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }

    const plans = await this.prisma.bidPlan.findMany({
      where: { requestNo: request.requestNo },
      include: {
        items: true,
        positions: true,
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return plans.map((p) => ({
      planNo: p.planNo,
      shopCode: p.shopCode,
      shopName: p.shop.name,
      items: p.items,
      positions: p.positions,
      scheduledDate: formatDateOnly(p.scheduledDate ?? request.desiredDate),
      scheduledTime: formatTimeOnly(p.scheduledTime),
      reason: p.reason,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * 고객의 업체 선택 — OPEN 상태에서만 가능, 선택 즉시 SELECTED로 전환하면서 같은 트랜잭션 안에서
   * 실제 시공건(Reservation, reservationType='BID')을 생성해 파트너앱 "시공 대기 목록"에 노출시킴.
   * 알려진 단순화: 선택 시점에 슬롯이 다른 확정 예약으로 이미 꽉 찼는지는 재검증하지 않음(입찰 제출 시점에 검증됨).
   */
  async selectOffer(
    memberId: string,
    id: number,
    offerNo: string,
  ): Promise<BidRequestView> {
    const request = await this.prisma.bidRequest.findUnique({ where: { id } });
    if (!request || request.memberId !== memberId) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }
    if (request.status !== 'OPEN') {
      throw new BadRequestException(
        '입찰중인 요청만 업체를 선택할 수 있습니다.',
      );
    }
    const offer = await this.prisma.bidOffer.findUnique({ where: { offerNo } });
    if (!offer || offer.requestNo !== request.requestNo) {
      throw new NotFoundException('해당 요청의 입찰이 아닙니다.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.bidRequest.update({
        where: { id },
        data: { status: 'SELECTED', selectedOfferNo: offerNo },
        include: {
          items: true,
          positions: true,
          myCar: { select: CAR_SELECT },
        },
      });

      // 응찰 시 파트너가 희망일과 다른 날짜를 지정했을 수 있어(scheduledDate) 실제 예약은 그 날짜로 생성
      const offerDate = offer.scheduledDate ?? request.desiredDate;
      const reservedCount = await tx.reservation.count({
        where: {
          shopCode: offer.shopCode,
          date: offerDate,
          time: offer.scheduledTime,
          status: 'CONFIRMED',
        },
      });
      const created = await tx.reservation.create({
        data: {
          reservationNo: '0'.repeat(10),
          shopCode: offer.shopCode,
          date: offerDate,
          time: offer.scheduledTime,
          seq: reservedCount + 1,
          reservationType: 'BID',
          memberId,
          requestNo: request.requestNo,
        },
      });
      await tx.reservation.update({
        where: { id: created.id },
        data: { reservationNo: String(created.id).padStart(10, '0') },
      });

      return req;
    });
    return toView(updated);
  }

  /**
   * 고객의 추천안 선택(전문가추천 전용) — selectOffer와 동일하게 하나의 트랜잭션 안에서
   * status:'SELECTED', selectedPlanNo 업데이트 + Reservation(reservationType='BID') 생성.
   */
  async selectPlan(
    memberId: string,
    id: number,
    planNo: string,
  ): Promise<BidRequestView> {
    const request = await this.prisma.bidRequest.findUnique({ where: { id } });
    if (!request || request.memberId !== memberId) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }
    if (request.status !== 'OPEN') {
      throw new BadRequestException(
        '입찰중인 요청만 업체를 선택할 수 있습니다.',
      );
    }
    const plan = await this.prisma.bidPlan.findUnique({ where: { planNo } });
    if (!plan || plan.requestNo !== request.requestNo) {
      throw new NotFoundException('해당 요청의 추천안이 아닙니다.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.bidRequest.update({
        where: { id },
        data: { status: 'SELECTED', selectedPlanNo: planNo },
        include: {
          items: true,
          positions: true,
          myCar: { select: CAR_SELECT },
        },
      });

      // 추천 시 파트너가 희망일과 다른 날짜를 지정했을 수 있어(scheduledDate) 실제 예약은 그 날짜로 생성
      const planDate = plan.scheduledDate ?? request.desiredDate;
      const reservedCount = await tx.reservation.count({
        where: {
          shopCode: plan.shopCode,
          date: planDate,
          time: plan.scheduledTime,
          status: 'CONFIRMED',
        },
      });
      const created = await tx.reservation.create({
        data: {
          reservationNo: '0'.repeat(10),
          shopCode: plan.shopCode,
          date: planDate,
          time: plan.scheduledTime,
          seq: reservedCount + 1,
          reservationType: 'BID',
          memberId,
          requestNo: request.requestNo,
        },
      });
      await tx.reservation.update({
        where: { id: created.id },
        data: { reservationNo: String(created.id).padStart(10, '0') },
      });

      return req;
    });
    return toView(updated);
  }
}
