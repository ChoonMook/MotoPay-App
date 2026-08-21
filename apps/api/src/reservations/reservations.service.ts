// 시공 예약 생성/조회/취소/일정변경 — 휴무일·정원·잠금을 검증한 뒤 예약번호를 자동 채번해 등록
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BidRequestItem,
  BidRequestPosition,
  Reservation,
} from '@prisma/client';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { maskPhone } from '../common/mask/mask-phone';
import { saveReservationPhoto } from '../common/storage/reservation-photo-storage';
import { saveReviewPhoto } from '../common/storage/review-photo-storage';
import { PointsService } from '../points/points.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { PushNotificationService } from '../push/push-notification.service';
import type { CompleteReservationDto } from './dto/complete-reservation.dto';
import type { CreateCallLogDto } from './dto/create-call-log.dto';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import {
  formatDateOnly,
  formatTimeOnly,
  parseDateOnly,
  parseTimeOnly,
  resolveDayType,
  todayUtcMidnight,
} from '../common/schedule-date.util';

export interface CreateReservationParams {
  shopCode: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  reservationType: string; // -> CommonCodeDetail(code='RESERVATION_TYPE')
  memberId: string;
  // 신차패키지(PKG) 예약확정 시 고객이 실제 선택한 구성상품 전체(분류별 기본/업그레이드 1건 + 추가옵션들, 가격 포함) —
  // 회원의 신차매핑 차량(MyCar.regType='MAP')에 연결된 NewCarPurchaseItem으로 치환 저장
  selectedItems?: { componentCode: string; price: number }[];
  // 신차패키지(PKG) 예약확정 시 고객이 선택한 썬팅 부위별 농도(패키지에 썬팅이 포함된 경우만) —
  // 같은 방식으로 NewCarPurchaseTintPosition에 치환 저장
  tintPositions?: { position: string; level: string }[];
}

export interface CancelReservationParams {
  reason: string; // -> CommonCodeDetail(code='CANCEL_REASON')
  reasonEtc?: string; // reason이 'ETC'일 때의 자유 입력 텍스트
}

export interface RescheduleReservationParams {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
}

export interface ReservationView
  extends Omit<Reservation, 'date' | 'time' | 'reschedDate' | 'reschedTime'> {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  reschedDate: string | null; // "YYYY-MM-DD" — 활성 일정변경요청이 없으면 null
  reschedTime: string | null; // "HH:mm"
}

function toView(reservation: Reservation): ReservationView {
  const { date, time, reschedDate, reschedTime, ...rest } = reservation;
  return {
    ...rest,
    date: formatDateOnly(date),
    time: formatTimeOnly(time),
    reschedDate: reschedDate ? formatDateOnly(reschedDate) : null,
    reschedTime: reschedTime ? formatTimeOnly(reschedTime) : null,
  };
}

// PT-HOME-01 "오늘의 시공 일정" 카드 응답 — 예약에 서비스(시공항목)·차종 연결 컬럼이 없어
// reservationType(신차패키지/일반입찰)을 서비스명 대용으로, 회원의 대표차량(없으면 최근 등록차량)을 차량정보로 사용(근사치)
export interface TodayReservationView {
  reservationNo: string;
  time: string; // "HH:mm"
  customerName: string;
  reservationType: string; // -> CommonCodeDetail(code='RESERVATION_TYPE')
  progressStatus: string; // -> CommonCodeDetail(code='RESERVATION_PROGRESS')
  carBrandCode: string | null; // -> CommonCodeDetail(code='CAR_BRAND') — 라벨 변환은 프론트(HomeScreen)에서 처리
  carModelCode: string | null; // -> CommonCodeDetail(code='CAR_MODEL')
  trimName: string | null;
}

export interface PackageProgressStats {
  applied: number; // 착수대기
  inProgress: number; // 시공중
  done: number; // 완료
}

// PT-NCPK-01~03 신차패키지 시공관리 — Reservation에는 차량·패키지 연결 컬럼이 없어
// 회원의 신차매핑 차량(MyCar.regType='MAP')을 통해 구매 패키지(NewCarPurchaseCustomer.packageCode)를
// 역추적해 구성상품(ProductBundleItem)을 시공 항목으로 사용(근사치 — 회원이 매핑 차량을 여러 대 갖는 경우는 최근 등록건 기준)
export interface PackageJobItem {
  name: string;
  spec: string | null;
  tag: 'BASIC' | 'OPTION';
  price: number;
  prodCat: string | null; // 상품분류코드 -> CommonCodeDetail(code='PROD_CAT') — 프런트에서 분류명 표기용
}

export interface PackageJobView {
  reservationNo: string;
  date: string;
  time: string;
  customerName: string;
  car: string | null;
  vin: string | null;
  progressStatus: string;
  packageName: string | null;
  categories: string[]; // 시공 항목의 상품분류코드 목록(중복 제거) -> CommonCodeDetail(code='PROD_CAT'), 상세는 시공 상세 화면에서 확인
}

export interface PackageJobDetailView {
  reservationNo: string;
  date: string;
  time: string;
  customerName: string;
  phoneMasked: string;
  phone: string | null; // 해피콜 발신용 실번호("010-1234-5678") — 화면 표시는 phoneMasked만 사용
  car: string | null;
  carPhoto: string | null; // 차종 대표사진(uploads/ 기준 상대경로) — 관리자가 등록해두지 않았으면 null
  vin: string | null;
  progressStatus: string;
  packageName: string | null;
  items: PackageJobItem[];
  tintPositions: { position: string; level: string }[]; // 썬팅 부위별 농도(패키지에 썬팅이 포함된 경우만)
  completionMemo: string | null;
  completedAt: string | null;
  handoverConfirmedAt: string | null; // 고객이 인수확인했거나(또는 completedAt+3일 경과로 자동확정된) 시점 — PT-NCPK-05 인수확인 현황에 사용
  photos: string[]; // uploads/ 기준 상대경로 — 완료 등록 시 첨부한 시공 사진
}

// PT-RSVC-08~10 예약시공(입찰) 시공관리 — Reservation.requestNo -> BidRequest로 연결된 실제 항목/부위 데이터를 그대로 반환
// (PKG와 달리 resolveMemberPackage 같은 역추적 근사치가 아니라 요청 시점 데이터를 직접 사용)
export interface BidJobView {
  reservationNo: string;
  requestNo: string;
  date: string;
  time: string;
  customerName: string;
  phoneMasked: string;
  phone: string | null; // 해피콜 발신용 실번호("010-1234-5678") — 화면 표시는 phoneMasked만 사용
  car: {
    carBrandCode: string;
    carModelCode: string;
    trimName: string | null;
  } | null;
  vin: string | null; // -> BidRequest.myCarId -> MyCar.vin — 대표차량 미등록 회원은 null
  progressStatus: string;
  items: BidRequestItem[];
  positions: BidRequestPosition[];
  // 파트너 일정변경 요청 상태(PT-RSVC-12) — "REQUESTED"(응답 대기)|"REJECTED"(거절됨)|null(활성 요청 없음)
  reschedStatus: string | null;
  reschedDate: string | null; // 파트너가 제안한 새 날짜("YYYY-MM-DD")
  reschedTime: string | null; // 파트너가 제안한 새 시각("HH:mm")
  reschedReason: string | null;
  reschedRejectReason: string | null; // 고객이 거절 시 남긴 사유(선택)
}

// PT-RSVC-11 예약시공 완료건 상세("인수확인 현황") — 시공 항목/차량 등은 목록(BidJobView)에 이미 있어
// 여기서는 완료 등록 시 저장된 사진·메모·인수확인 상태만 추가로 응답
export interface BidJobDetailView {
  reservationNo: string;
  completionMemo: string | null;
  completedAt: string | null;
  handoverConfirmedAt: string | null;
  photos: string[]; // uploads/ 기준 상대경로
}

// CU-RSVC-16/CU-NCPK-10 시공완료·인수확인 — 파트너가 완료 등록한 시공 사진·메모와 실제 구매 패키지 항목을 함께 응답
export interface HandoverDetailView {
  reservationNo: string;
  progressStatus: string;
  car: string | null;
  vin: string | null;
  packageName: string | null;
  items: PackageJobItem[];
  tintPositions: { position: string; level: string }[];
  photos: string[]; // uploads/ 기준 상대경로
  completionMemo: string | null;
  completedAt: string | null;
  handoverConfirmedAt: string | null;
  handoverStatus: 'pending' | 'confirmed';
}

// CU-NCPK-09/CU-RSVC-20 예약확정·예약상세 — 인수확인(getHandoverDetail)과 달리 progressStatus 상관없이
// 언제든 조회 가능한, 예약확정 시점에 저장된 실제 선택 내역(시공 항목·제품·가격, 썬팅 부위별 농도)
export interface PackageSelectionView {
  car: string | null;
  vin: string | null;
  packageName: string | null;
  items: PackageJobItem[];
  tintPositions: { position: string; level: string }[];
}

// CU-RSVC-17 후기 — 예약 1건당 1건만 작성 가능
export interface ReviewView {
  rating: number;
  content: string;
  photos: string[]; // uploads/ 기준 상대경로
  createdAt: string;
}

// PT-RSVC-03 해피콜(고객 확인 전화) 이력 1건
export interface CallLogView {
  id: number;
  result: string; // -> CommonCodeDetail(code='CALL_RESULT')
  memo: string | null;
  createdAt: string;
}

// AD-NCPK-07 관리자 신차패키지 시공현황 — 전체 업체(shopCode 무관) 대상, 조회 전용(수정 없음)
export interface AdminPackageReservationListItem {
  reservationNo: string;
  customerName: string;
  car: string | null;
  vin: string | null;
  packageName: string | null;
  dealerCompanyId: number | null;
  dealerName: string | null;
  shopName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: string; // -> CommonCodeDetail(code='RESERVATION_STATUS')
  progressStatus: string; // -> CommonCodeDetail(code='RESERVATION_PROGRESS')
  createdAt: string; // ISO
}

export interface AdminPackageReservationDetail {
  reservationNo: string;
  customerName: string;
  phoneMasked: string;
  car: string | null;
  vin: string | null;
  dealerName: string | null;
  shopName: string;
  date: string;
  time: string;
  status: string;
  progressStatus: string;
  packageName: string | null;
  items: PackageJobItem[];
  tintPositions: { position: string; level: string }[];
  cancelReason: string | null;
  cancelReasonEtc: string | null;
  completionMemo: string | null;
  completedAt: string | null;
  handoverConfirmedAt: string | null;
  photos: string[];
}

const HANDOVER_AUTO_CONFIRM_DAYS = 3;

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly phoneCrypto: PhoneCryptoService,
    private readonly pointsService: PointsService,
    private readonly pushService: PushNotificationService,
  ) {}

  async create(params: CreateReservationParams): Promise<ReservationView> {
    const {
      shopCode,
      date,
      time,
      reservationType,
      memberId,
      selectedItems,
      tintPositions,
    } = params;
    const targetDate = parseDateOnly(date);
    const targetTime = parseTimeOnly(time);

    const holiday = await this.prisma.shopHoliday.findUnique({
      where: { shopCode_holidayDate: { shopCode, holidayDate: targetDate } },
    });
    if (holiday) {
      throw new BadRequestException('휴무일에는 예약할 수 없습니다.');
    }

    const dayType = resolveDayType(targetDate);
    const [template, override, reservedCount] = await Promise.all([
      this.prisma.shopTimeSlot.findUnique({
        where: {
          shopCode_dayType_time: { shopCode, dayType, time: targetTime },
        },
      }),
      this.prisma.shopDailySlot.findUnique({
        where: {
          shopCode_date_time: { shopCode, date: targetDate, time: targetTime },
        },
      }),
      this.prisma.reservation.count({
        where: {
          shopCode,
          date: targetDate,
          time: targetTime,
          status: 'CONFIRMED',
        },
      }),
    ]);

    if (override?.isLocked) {
      throw new BadRequestException('잠금 처리된 시간대입니다.');
    }
    const capacity = override?.capacity ?? template?.capacity;
    if (capacity === undefined || capacity === null) {
      throw new BadRequestException('예약 가능한 시간대가 아닙니다.');
    }
    if (reservedCount >= capacity) {
      throw new BadRequestException('예약 가능 인원이 마감되었습니다.');
    }

    const reservation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.reservation.create({
        data: {
          reservationNo: '0'.repeat(10),
          shopCode,
          date: targetDate,
          time: targetTime,
          seq: reservedCount + 1,
          reservationType,
          memberId,
        },
      });
      const confirmed = await tx.reservation.update({
        where: { id: created.id },
        data: { reservationNo: String(created.id).padStart(10, '0') },
      });

      // 신차패키지 예약확정 시 고객이 최종 선택한 구성상품 전체(기본/업그레이드+추가옵션, 가격 포함)와
      // 썬팅 부위별 농도를 회원의 신차매핑 차량에 연결된 구매건(NewCarPurchaseCustomer)에 치환 저장(delete-then-create)
      const hasSelectedItems =
        reservationType === 'PKG' && !!selectedItems?.length;
      const hasTintPositions =
        reservationType === 'PKG' && !!tintPositions?.length;
      if (hasSelectedItems || hasTintPositions) {
        const car = await tx.myCar.findFirst({
          where: { memberId, regType: 'MAP', purchaseVin: { not: null } },
          orderBy: { createdAt: 'desc' },
        });
        if (car?.purchaseVin) {
          const vin = car.purchaseVin;
          if (hasSelectedItems) {
            await tx.newCarPurchaseItem.deleteMany({ where: { vin } });
            await tx.newCarPurchaseItem.createMany({
              data: selectedItems.map((item) => ({
                vin,
                componentCode: item.componentCode,
                price: item.price,
              })),
            });
          }
          if (hasTintPositions) {
            await tx.newCarPurchaseTintPosition.deleteMany({ where: { vin } });
            await tx.newCarPurchaseTintPosition.createMany({
              data: tintPositions.map((t) => ({
                vin,
                position: t.position,
                level: t.level,
              })),
            });
          }
        }
      }

      return confirmed;
    });

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송) — 실패해도 예약 생성 자체는 이미 완료된 상태
    this.pushService
      .sendToOwner('USER', reservation.memberId, {
        type: 'RSV_CONFIRMED',
        vars: { date, time },
        data: { reservationNo: reservation.reservationNo, reservationType: reservation.reservationType },
      })
      .catch(() => {});
    this.pushService
      .sendToShopPartners(shopCode, {
        type: 'RSV_NEW',
        vars: { date, time },
        data: { reservationNo: reservation.reservationNo, reservationType: reservation.reservationType },
      })
      .catch(() => {});

    return toView(reservation);
  }

  async listMine(memberId: string): Promise<ReservationView[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { memberId },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });
    return reservations.map(toView);
  }

  /**
   * 예약 취소 — 확정(CONFIRMED) 상태·시공 시작 전(progressStatus='APPLIED')·이미 지나지 않은 예약만 취소 가능.
   * 취소 사유·일시를 함께 저장하고 상태를 CANCELLED로 전환(슬롯 정원 계산에서 자동 제외됨 —
   * create()의 정원 카운트가 status:'CONFIRMED' 조건이라 취소 즉시 해당 시간대가 다시 비어짐).
   */
  async cancel(
    memberId: string,
    id: number,
    params: CancelReservationParams,
  ): Promise<ReservationView> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        '이미 취소되었거나 취소할 수 없는 예약입니다.',
      );
    }
    if (reservation.progressStatus !== 'APPLIED') {
      throw new BadRequestException('시공이 시작된 예약은 취소할 수 없습니다.');
    }
    if (reservation.date < todayUtcMidnight()) {
      throw new BadRequestException('이미 지난 예약은 취소할 수 없습니다.');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: params.reason,
        cancelReasonEtc: params.reasonEtc ?? null,
        cancelledAt: new Date(),
      },
    });
    return toView(updated);
  }

  /** 새 일시가 휴무일·정원·잠금 조건을 만족하는지 검증(고객 일정변경/파트너 일정변경요청·수락이 공유) — 통과 시 그 시간대의 현재 예약 수를 반환 */
  private async validateSlot(
    shopCode: string,
    targetDate: Date,
    targetTime: Date,
    excludeReservationId?: number,
  ): Promise<number> {
    if (targetDate <= todayUtcMidnight()) {
      throw new BadRequestException('오늘 이후 날짜로만 변경할 수 있습니다.');
    }

    const holiday = await this.prisma.shopHoliday.findUnique({
      where: { shopCode_holidayDate: { shopCode, holidayDate: targetDate } },
    });
    if (holiday) {
      throw new BadRequestException('휴무일로는 변경할 수 없습니다.');
    }

    const dayType = resolveDayType(targetDate);
    const [template, override, reservedCount] = await Promise.all([
      this.prisma.shopTimeSlot.findUnique({
        where: {
          shopCode_dayType_time: { shopCode, dayType, time: targetTime },
        },
      }),
      this.prisma.shopDailySlot.findUnique({
        where: {
          shopCode_date_time: { shopCode, date: targetDate, time: targetTime },
        },
      }),
      this.prisma.reservation.count({
        where: {
          shopCode,
          date: targetDate,
          time: targetTime,
          status: 'CONFIRMED',
          ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
        },
      }),
    ]);

    if (override?.isLocked) {
      throw new BadRequestException('잠금 처리된 시간대입니다.');
    }
    const capacity = override?.capacity ?? template?.capacity;
    if (capacity === undefined || capacity === null) {
      throw new BadRequestException('예약 가능한 시간대가 아닙니다.');
    }
    if (reservedCount >= capacity) {
      throw new BadRequestException('예약 가능 인원이 마감되었습니다.');
    }
    return reservedCount;
  }

  /**
   * 일정 변경(고객 직접 변경) — 확정(CONFIRMED) 상태·시공 시작 전(progressStatus='APPLIED')만 가능,
   * 새 일시도 휴무일·정원·잠금을 create()와 동일하게 검증.
   * 같은 행의 date/time을 갱신하는 방식이라 기존 시간대는 정원 계산에서 자동으로 빠짐(별도 해제 처리 불필요).
   */
  async reschedule(
    memberId: string,
    id: number,
    params: RescheduleReservationParams,
  ): Promise<ReservationView> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException('취소되었거나 변경할 수 없는 예약입니다.');
    }
    if (reservation.progressStatus !== 'APPLIED') {
      throw new BadRequestException(
        '시공이 시작된 예약은 일정을 변경할 수 없습니다.',
      );
    }
    if (reservation.date < todayUtcMidnight()) {
      throw new BadRequestException(
        '이미 지난 예약은 일정을 변경할 수 없습니다.',
      );
    }

    const targetDate = parseDateOnly(params.date);
    const targetTime = parseTimeOnly(params.time);
    const reservedCount = await this.validateSlot(
      reservation.shopCode,
      targetDate,
      targetTime,
      id,
    );

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { date: targetDate, time: targetTime, seq: reservedCount + 1 },
    });
    return toView(updated);
  }

  /**
   * 파트너 일정변경 요청(PT-RSVC-12) — 확정(CONFIRMED)·시공 시작 전(APPLIED)인 예약에 한해, 파트너가 제안하는
   * 새 일시가 실제로 예약 가능한지 요청 시점에 미리 검증해둔다(고객이 수락할 때 다시 한번 검증).
   * 이미 진행중인 요청이 있어도 최신 요청으로 덮어씀(이력 보관 없음).
   */
  async requestResched(
    shopCode: string,
    reservationNo: string,
    dto: { date: string; time: string; reason: string },
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
    });
    if (!reservation || reservation.shopCode !== shopCode) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException('취소된 예약은 일정을 변경할 수 없습니다.');
    }
    if (reservation.progressStatus !== 'APPLIED') {
      throw new BadRequestException(
        '시공이 시작된 예약은 일정을 변경할 수 없습니다.',
      );
    }

    const targetDate = parseDateOnly(dto.date);
    const targetTime = parseTimeOnly(dto.time);
    await this.validateSlot(shopCode, targetDate, targetTime, reservation.id);

    await this.prisma.reservation.update({
      where: { reservationNo },
      data: {
        reschedStatus: 'REQUESTED',
        reschedDate: targetDate,
        reschedTime: targetTime,
        reschedReason: dto.reason,
        reschedRequestedAt: new Date(),
        reschedRejectReason: null,
        reschedRespondedAt: null,
      },
    });

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송)
    this.pushService
      .sendToOwner('USER', reservation.memberId, {
        type: 'RSV_RESCHED_REQUESTED',
        vars: { date: formatDateOnly(targetDate), time: formatTimeOnly(targetTime) },
        data: {
          reservationNo,
          reservationType: reservation.reservationType,
          ...(reservation.requestNo ? { requestNo: reservation.requestNo } : {}),
        },
      })
      .catch(() => {});
  }

  /**
   * 고객이 파트너의 일정변경 요청을 수락(CU-RSVC-21) — 수락 시점에 슬롯을 다시 검증(요청 이후 휴무일 지정 등으로
   * 바뀌었을 수 있음). 수락되면 실제 date/time을 갱신하고 요청 관련 필드는 전부 초기화한다.
   */
  async acceptResched(memberId: string, id: number): Promise<ReservationView> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.reschedStatus !== 'REQUESTED') {
      throw new BadRequestException('응답할 일정변경 요청이 없습니다.');
    }
    const targetDate = reservation.reschedDate!;
    const targetTime = reservation.reschedTime!;
    const reservedCount = await this.validateSlot(
      reservation.shopCode,
      targetDate,
      targetTime,
      id,
    );

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        date: targetDate,
        time: targetTime,
        seq: reservedCount + 1,
        reschedStatus: null,
        reschedDate: null,
        reschedTime: null,
        reschedReason: null,
        reschedRequestedAt: null,
        reschedRejectReason: null,
        reschedRespondedAt: null,
      },
    });

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송)
    this.pushService
      .sendToShopPartners(reservation.shopCode, {
        type: 'RSV_RESCHED_ACCEPTED',
        vars: { date: formatDateOnly(targetDate), time: formatTimeOnly(targetTime) },
        data: {
          reservationNo: reservation.reservationNo,
          reservationType: reservation.reservationType,
          ...(reservation.requestNo ? { requestNo: reservation.requestNo } : {}),
        },
      })
      .catch(() => {});

    return toView(updated);
  }

  /** 고객이 파트너의 일정변경 요청을 거절(CU-RSVC-21) — 기존 일정은 그대로 유지, 거절 사유(선택)만 기록 */
  async rejectResched(
    memberId: string,
    id: number,
    reason?: string,
  ): Promise<ReservationView> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.reschedStatus !== 'REQUESTED') {
      throw new BadRequestException('응답할 일정변경 요청이 없습니다.');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        reschedStatus: 'REJECTED',
        reschedRejectReason: reason ?? null,
        reschedRespondedAt: new Date(),
      },
    });

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송)
    this.pushService
      .sendToShopPartners(reservation.shopCode, {
        type: 'RSV_RESCHED_REJECTED',
        data: {
          reservationNo: reservation.reservationNo,
          reservationType: reservation.reservationType,
          ...(reservation.requestNo ? { requestNo: reservation.requestNo } : {}),
        },
      })
      .catch(() => {});

    return toView(updated);
  }

  /**
   * 결제 확정(CU-RSVC-14) — 업체/추천안 선정으로 예약이 이미 생성된 뒤, 결제 화면에서 "결제하기"를 눌렀을 때
   * 쿠폰/포인트/결제수단/최종 결제금액을 기록. 확정(CONFIRMED) 상태에서만 가능하고, 이미 결제가 확정된 예약은
   * 재결제할 수 없음(paidAt으로 판단). 쿠폰은 아직 별도 시스템이 없어(Reservation과 연결된 Coupon 테이블 없음)
   * 이 시점의 스냅샷만 저장하지만, 포인트는 실제 PointHistory·User.pointBalance를 사용(2026-08-18)해서
   * pointsUsed>0이면 잔액을 실제로 차감한다(잔액 부족 시 결제 자체가 실패).
   */
  async confirmPayment(
    memberId: string,
    id: number,
    dto: ConfirmPaymentDto,
  ): Promise<ReservationView> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException('결제할 수 없는 예약입니다.');
    }
    if (reservation.paidAt) {
      throw new BadRequestException('이미 결제가 확정된 예약입니다.');
    }

    if (dto.pointsUsed && dto.pointsUsed > 0) {
      await this.pointsService.useMyPoints(
        memberId,
        dto.pointsUsed,
        `예약결제 사용(${reservation.reservationNo})`,
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        paymentMethod: dto.paymentMethod,
        couponName: dto.couponName ?? null,
        couponDiscount: dto.couponDiscount ?? null,
        pointsUsed: dto.pointsUsed ?? 0,
        paidAmount: dto.paidAmount,
        paidAt: new Date(),
      },
    });
    return toView(updated);
  }

  // ── 파트너 홈(PT-HOME-01) ────────────────────────────────────

  async listTodayForShop(shopCode: string): Promise<TodayReservationView[]> {
    const today = todayUtcMidnight();
    const reservations = await this.prisma.reservation.findMany({
      where: { shopCode, date: today, status: 'CONFIRMED' },
      include: {
        member: {
          include: {
            cars: {
              orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
              take: 1,
            },
          },
        },
      },
      orderBy: { time: 'asc' },
    });

    return reservations.map((r) => {
      const car = r.member.cars[0] ?? null;
      return {
        reservationNo: r.reservationNo,
        time: formatTimeOnly(r.time),
        customerName: r.member.name,
        reservationType: r.reservationType,
        progressStatus: r.progressStatus,
        carBrandCode: car?.carBrandCode ?? null,
        carModelCode: car?.carModelCode ?? null,
        trimName: car?.trimName ?? null,
      };
    });
  }

  async updateProgress(
    shopCode: string,
    reservationNo: string,
    progressStatus: string,
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
    });
    if (!reservation || reservation.shopCode !== shopCode) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException(
        '취소된 예약은 진행상태를 변경할 수 없습니다.',
      );
    }
    await this.prisma.reservation.update({
      where: { reservationNo },
      data: { progressStatus },
    });
  }

  /** 해피콜(고객 확인 전화) 이력 등록(PT-RSVC-03) — 소유권 검증은 updateProgress와 동일 */
  async addCallLog(
    shopCode: string,
    reservationNo: string,
    dto: CreateCallLogDto,
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
    });
    if (!reservation || reservation.shopCode !== shopCode) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    await this.prisma.reservationCallLog.create({
      data: { reservationNo, result: dto.result, memo: dto.memo },
    });
  }

  /** 해피콜 이력 목록(최신순) — 소유권 검증은 updateProgress와 동일 */
  async listCallLogs(
    shopCode: string,
    reservationNo: string,
  ): Promise<CallLogView[]> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
    });
    if (!reservation || reservation.shopCode !== shopCode) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    const logs = await this.prisma.reservationCallLog.findMany({
      where: { reservationNo },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => ({
      id: log.id,
      result: log.result,
      memo: log.memo,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  /**
   * 시공 완료 등록(PT-NCPK-04) — 시공중 상태에서만 가능. 시공 사진을 저장하고 작업 메모와 함께
   * progressStatus를 DONE으로 전환. 사진은 고객 인수확인 화면에 그대로 노출되는 자료라 3~10장 범위를 서버에서도 검증(DTO).
   */
  async completeReservation(
    shopCode: string,
    reservationNo: string,
    dto: CompleteReservationDto,
  ): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
    });
    if (!reservation || reservation.shopCode !== shopCode) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    if (reservation.status !== 'CONFIRMED') {
      throw new BadRequestException('취소된 예약은 완료 처리할 수 없습니다.');
    }
    if (reservation.progressStatus !== 'IN_PROGRESS') {
      throw new BadRequestException(
        '시공중 상태에서만 완료 처리할 수 있습니다.',
      );
    }

    const photoPaths = await Promise.all(
      dto.photos.map((photo) => saveReservationPhoto(photo)),
    );

    await this.prisma.$transaction([
      this.prisma.reservationPhoto.createMany({
        data: photoPaths.map((photoPath, index) => ({
          reservationNo,
          photoPath,
          sortOrder: index,
        })),
      }),
      this.prisma.reservation.update({
        where: { reservationNo },
        data: {
          progressStatus: 'DONE',
          completionMemo: dto.memo?.trim() || null,
          completedAt: new Date(),
        },
      }),
    ]);

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송)
    this.pushService
      .sendToOwner('USER', reservation.memberId, {
        type: 'RSV_COMPLETED',
        data: {
          reservationNo,
          reservationType: reservation.reservationType,
          ...(reservation.requestNo ? { requestNo: reservation.requestNo } : {}),
        },
      })
      .catch(() => {});
  }

  async getPackageStats(shopCode: string): Promise<PackageProgressStats> {
    const grouped = await this.prisma.reservation.groupBy({
      by: ['progressStatus'],
      where: { shopCode, reservationType: 'PKG', status: 'CONFIRMED' },
      _count: { _all: true },
    });
    const countOf = (status: string) =>
      grouped.find((g) => g.progressStatus === status)?._count._all ?? 0;
    return {
      applied: countOf('APPLIED'),
      inProgress: countOf('IN_PROGRESS'),
      done: countOf('DONE'),
    };
  }

  // ── 파트너 신차패키지 시공관리(PT-NCPK-01~03) ──────────────────

  async listPackagesForShop(shopCode: string): Promise<PackageJobView[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { shopCode, reservationType: 'PKG', status: 'CONFIRMED' },
      include: { member: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    return Promise.all(
      reservations.map(async (r) => {
        const { car, packageName, items } = await this.resolveMemberPackage(
          r.memberId,
        );
        const categories = [
          ...new Set(
            items.map((i) => i.prodCat).filter((c): c is string => c !== null),
          ),
        ];
        return {
          reservationNo: r.reservationNo,
          date: formatDateOnly(r.date),
          time: formatTimeOnly(r.time),
          customerName: r.member.name,
          car: car?.name ?? null,
          vin: car?.vin ?? null,
          progressStatus: r.progressStatus,
          packageName,
          categories,
        };
      }),
    );
  }

  // ── 파트너 예약시공(입찰) 시공관리(PT-RSVC-08~10) ──────────────────

  async listBidJobsForShop(shopCode: string): Promise<BidJobView[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { shopCode, reservationType: 'BID', status: 'CONFIRMED' },
      include: {
        member: true,
        request: {
          include: {
            items: true,
            positions: true,
            myCar: {
              select: {
                carBrandCode: true,
                carModelCode: true,
                trimName: true,
                vin: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // 예약관리 홈·시공대기목록 모두 최신 등록건이 맨 위(2026-08-14 사용자 확인)
    });

    return reservations.map((r) => {
      const phone = r.member.phoneEncrypted
        ? this.phoneCrypto.decrypt(r.member.phoneEncrypted)
        : null;
      return {
        reservationNo: r.reservationNo,
        requestNo: r.requestNo!,
        date: formatDateOnly(r.date),
        time: formatTimeOnly(r.time),
        customerName: r.member.name,
        phoneMasked: phone ? maskPhone(phone) : '-',
        phone,
        car: r.request?.myCar
          ? {
              carBrandCode: r.request.myCar.carBrandCode,
              carModelCode: r.request.myCar.carModelCode,
              trimName: r.request.myCar.trimName,
            }
          : null,
        vin: r.request?.myCar?.vin ?? null,
        progressStatus: r.progressStatus,
        items: r.request?.items ?? [],
        positions: r.request?.positions ?? [],
        reschedStatus: r.reschedStatus,
        reschedDate: r.reschedDate ? formatDateOnly(r.reschedDate) : null,
        reschedTime: r.reschedTime ? formatTimeOnly(r.reschedTime) : null,
        reschedReason: r.reschedReason,
        reschedRejectReason: r.reschedRejectReason,
      };
    });
  }

  /** 예약시공(입찰) 완료건 상세(PT-RSVC-11) — 완료 등록 시 저장된 사진·메모·인수확인 상태 */
  async getBidJobDetail(
    shopCode: string,
    reservationNo: string,
  ): Promise<BidJobDetailView> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
    });
    if (
      !reservation ||
      reservation.shopCode !== shopCode ||
      reservation.reservationType !== 'BID'
    ) {
      throw new NotFoundException('예약시공 예약을 찾을 수 없습니다.');
    }

    const [photos, handoverConfirmedAt] = await Promise.all([
      this.prisma.reservationPhoto.findMany({
        where: { reservationNo },
        orderBy: { sortOrder: 'asc' },
      }),
      this.resolveHandoverConfirmation(reservation),
    ]);

    return {
      reservationNo: reservation.reservationNo,
      completionMemo: reservation.completionMemo,
      completedAt: reservation.completedAt?.toISOString() ?? null,
      handoverConfirmedAt: handoverConfirmedAt?.toISOString() ?? null,
      photos: photos.map((p) => p.photoPath),
    };
  }

  async getPackageJobDetail(
    shopCode: string,
    reservationNo: string,
  ): Promise<PackageJobDetailView> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
      include: { member: true },
    });
    if (
      !reservation ||
      reservation.shopCode !== shopCode ||
      reservation.reservationType !== 'PKG'
    ) {
      throw new NotFoundException('신차패키지 예약을 찾을 수 없습니다.');
    }

    const [
      { car, packageName, items, tintPositions },
      photos,
      handoverConfirmedAt,
    ] = await Promise.all([
      this.resolveMemberPackage(reservation.memberId),
      this.prisma.reservationPhoto.findMany({
        where: { reservationNo },
        orderBy: { sortOrder: 'asc' },
      }),
      this.resolveHandoverConfirmation(reservation),
    ]);
    const phone = reservation.member.phoneEncrypted
      ? this.phoneCrypto.decrypt(reservation.member.phoneEncrypted)
      : null;

    return {
      reservationNo: reservation.reservationNo,
      date: formatDateOnly(reservation.date),
      time: formatTimeOnly(reservation.time),
      customerName: reservation.member.name,
      phoneMasked: phone ? maskPhone(phone) : '-',
      phone,
      car: car?.name ?? null,
      carPhoto: car?.photo ?? null,
      vin: car?.vin ?? null,
      progressStatus: reservation.progressStatus,
      packageName,
      items,
      tintPositions,
      completionMemo: reservation.completionMemo,
      completedAt: reservation.completedAt?.toISOString() ?? null,
      handoverConfirmedAt: handoverConfirmedAt?.toISOString() ?? null,
      photos: photos.map((p) => p.photoPath),
    };
  }

  // ── 관리자 신차패키지 시공현황(AD-NCPK-07) ──────────────────

  async adminListPackages(params: {
    keyword?: string;
    status?: string;
    progressStatus?: string;
    dealerCompanyId?: number;
  }): Promise<AdminPackageReservationListItem[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: {
        reservationType: 'PKG',
        ...(params.status ? { status: params.status } : {}),
        ...(params.progressStatus
          ? { progressStatus: params.progressStatus }
          : {}),
        ...(params.keyword
          ? {
              OR: [
                { reservationNo: { contains: params.keyword } },
                { member: { name: { contains: params.keyword } } },
              ],
            }
          : {}),
      },
      include: { member: true, shop: true },
      orderBy: { createdAt: 'desc' },
    });

    const items = await Promise.all(
      reservations.map(async (r) => {
        const { car, packageName, dealerCompanyId, dealerName } =
          await this.resolveMemberPackage(r.memberId);
        return {
          reservationNo: r.reservationNo,
          customerName: r.member.name,
          car: car?.name ?? null,
          vin: car?.vin ?? null,
          packageName,
          dealerCompanyId,
          dealerName,
          shopName: r.shop.name,
          date: formatDateOnly(r.date),
          time: formatTimeOnly(r.time),
          status: r.status,
          progressStatus: r.progressStatus,
          createdAt: r.createdAt.toISOString(),
        };
      }),
    );

    // 딜러사 필터는 목록 화면과 동일하게 resolveMemberPackage가 고른 "최근 등록 매핑 차량" 기준으로 판단
    // (DB 레벨에서 회원의 매핑 차량 전체를 대상으로 걸면, 여러 대를 가진 회원의 경우 화면에 표시되는 차량과
    // 다른 차량의 딜러사로도 매칭되는 오류가 있어 조회 후 필터링으로 변경)
    return params.dealerCompanyId
      ? items.filter((i) => i.dealerCompanyId === params.dealerCompanyId)
      : items;
  }

  async adminGetPackageDetail(
    reservationNo: string,
  ): Promise<AdminPackageReservationDetail> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationNo },
      include: { member: true, shop: true },
    });
    if (!reservation || reservation.reservationType !== 'PKG') {
      throw new NotFoundException('신차패키지 예약을 찾을 수 없습니다.');
    }

    const [
      { car, packageName, dealerName, items, tintPositions },
      photos,
      handoverConfirmedAt,
    ] = await Promise.all([
      this.resolveMemberPackage(reservation.memberId),
      this.prisma.reservationPhoto.findMany({
        where: { reservationNo },
        orderBy: { sortOrder: 'asc' },
      }),
      this.resolveHandoverConfirmation(reservation),
    ]);
    const phone = reservation.member.phoneEncrypted
      ? this.phoneCrypto.decrypt(reservation.member.phoneEncrypted)
      : null;

    return {
      reservationNo: reservation.reservationNo,
      customerName: reservation.member.name,
      phoneMasked: phone ? maskPhone(phone) : '-',
      car: car?.name ?? null,
      vin: car?.vin ?? null,
      dealerName,
      shopName: reservation.shop.name,
      date: formatDateOnly(reservation.date),
      time: formatTimeOnly(reservation.time),
      status: reservation.status,
      progressStatus: reservation.progressStatus,
      packageName,
      items,
      tintPositions,
      cancelReason: reservation.cancelReason,
      cancelReasonEtc: reservation.cancelReasonEtc,
      completionMemo: reservation.completionMemo,
      completedAt: reservation.completedAt?.toISOString() ?? null,
      handoverConfirmedAt: handoverConfirmedAt?.toISOString() ?? null,
      photos: photos.map((p) => p.photoPath),
    };
  }

  private async resolveMemberPackage(memberId: string): Promise<{
    car: { name: string; vin: string | null; photo: string | null } | null;
    packageName: string | null;
    dealerCompanyId: number | null; // -> Company.id(coType='DEALER')
    dealerName: string | null; // 신차 구매 딜러사명 -> NewCarPurchaseCustomer.dealerCompanyId -> Company.name
    items: PackageJobItem[];
    tintPositions: { position: string; level: string }[];
  }> {
    const car = await this.prisma.myCar.findFirst({
      where: { memberId, regType: 'MAP', purchaseVin: { not: null } },
      include: {
        purchase: {
          include: { selectedItems: true, tintPositions: true, dealer: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!car) {
      return {
        car: null,
        packageName: null,
        dealerCompanyId: null,
        dealerName: null,
        items: [],
        tintPositions: [],
      };
    }
    const dealerCompanyId = car.purchase?.dealerCompanyId ?? null;
    const dealerName = car.purchase?.dealer.name ?? null;

    // 차량브랜드+차종 라벨로 표기(PT-NCPK-01~03) — trimName은 자유텍스트(예: "E 200")라 브랜드가 안 드러나므로
    // CommonCodeDetail(CAR_BRAND/CAR_MODEL)에서 실제 이름을 조회해 조합. 코드에 대응하는 상세가 없으면 코드값 그대로 표기.
    // trimName이 있으면 "벤츠 E-Class E200"처럼 뒤에 붙여 세부차종명까지 표기(apps/customer-app·partner-app의
    // 다른 carLabel 조합 로직과 동일 규칙)
    const [brandDetail, modelDetail] = await Promise.all([
      this.prisma.commonCodeDetail.findUnique({
        where: {
          code_detailCode: { code: 'CAR_BRAND', detailCode: car.carBrandCode },
        },
      }),
      this.prisma.commonCodeDetail.findUnique({
        where: {
          code_detailCode: { code: 'CAR_MODEL', detailCode: car.carModelCode },
        },
      }),
    ]);
    const brandModelLabel = `${brandDetail?.detailName ?? car.carBrandCode} ${modelDetail?.detailName ?? car.carModelCode}`;
    const carView = {
      name: car.trimName ? `${brandModelLabel} ${car.trimName}` : brandModelLabel,
      vin: car.vin,
      photo: modelDetail?.ref2 ?? null, // 차종 대표사진(AD-CTLG-02에서 관리자가 등록) — uploads/ 기준 상대경로
    };
    const packageCode = car.purchase?.packageCode;
    if (!packageCode) {
      return {
        car: carView,
        packageName: null,
        dealerCompanyId,
        dealerName,
        items: [],
        tintPositions: [],
      };
    }

    // 예약확정(POST /reservations) 시점에 저장된 실제 선택 항목 전체(분류별 기본/업그레이드 1건 + 추가옵션들)
    const selectedItems = car.purchase?.selectedItems ?? [];
    const tintPositions = (car.purchase?.tintPositions ?? []).map((t) => ({
      position: t.position,
      level: t.level,
    }));

    try {
      const detail = await this.productsService.getPackageDetail(packageCode);
      const toItem = (
        bundleItem: (typeof detail.basicItems)[number],
        tag: PackageJobItem['tag'],
      ): PackageJobItem => ({
        name: bundleItem.product?.name ?? bundleItem.componentCode,
        spec: bundleItem.product?.description ?? null,
        tag,
        price: 0,
        prodCat: bundleItem.product?.prodCat ?? null,
      });

      let items: PackageJobItem[];
      if (selectedItems.length > 0) {
        const bundleByCode = new Map(
          [...detail.basicItems, ...detail.optionItems, ...detail.addItems].map(
            (i) => [i.componentCode, i],
          ),
        );
        const upgradeOrAddCodes = new Set([
          ...detail.optionItems.map((i) => i.componentCode),
          ...detail.addItems.map((i) => i.componentCode),
        ]);
        items = selectedItems.map((s) => {
          const bundleItem = bundleByCode.get(s.componentCode);
          return {
            name: bundleItem?.product?.name ?? s.componentCode,
            spec: bundleItem?.product?.description ?? null,
            tag: upgradeOrAddCodes.has(s.componentCode) ? 'OPTION' : 'BASIC',
            price: s.price,
            prodCat: bundleItem?.product?.prodCat ?? null,
          };
        });
      } else {
        // 레거시 폴백: 예약확정 시 선택 정보를 저장하지 않은 구매건은 기존처럼 기본상품 전체만 표시
        items = detail.basicItems.map((i) => toItem(i, 'BASIC'));
      }

      return {
        car: carView,
        packageName: detail.package.name,
        dealerCompanyId,
        dealerName,
        items,
        tintPositions,
      };
    } catch {
      // 매핑된 패키지 상품이 삭제·비활성화된 경우 등 — 차량 정보만 있고 시공 항목은 빈 목록으로 응답
      return {
        car: carView,
        packageName: null,
        dealerCompanyId,
        dealerName,
        items: [],
        tintPositions: [],
      };
    }
  }

  async getHandoverDetail(
    memberId: string,
    id: number,
  ): Promise<HandoverDetailView> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.progressStatus !== 'DONE') {
      throw new BadRequestException('아직 시공이 완료되지 않은 예약입니다.');
    }

    const [{ car, packageName, items, tintPositions }, photos, handoverConfirmedAt] =
      await Promise.all([
        this.resolveMemberPackage(memberId),
        this.prisma.reservationPhoto.findMany({
          where: { reservationNo: reservation.reservationNo },
          orderBy: { sortOrder: 'asc' },
        }),
        this.resolveHandoverConfirmation(reservation),
      ]);

    return {
      reservationNo: reservation.reservationNo,
      progressStatus: reservation.progressStatus,
      car: car?.name ?? null,
      vin: car?.vin ?? null,
      packageName,
      items,
      tintPositions,
      photos: photos.map((p) => p.photoPath),
      completionMemo: reservation.completionMemo,
      completedAt: reservation.completedAt?.toISOString() ?? null,
      handoverConfirmedAt: handoverConfirmedAt?.toISOString() ?? null,
      handoverStatus: handoverConfirmedAt ? 'confirmed' : 'pending',
    };
  }

  /**
   * CU-NCPK-09/CU-RSVC-20 예약확정·예약상세 — 예약확정 시점에 저장된 실제 선택 내역(시공 항목·제품·가격,
   * 썬팅 부위별 농도)을 progressStatus 상관없이 조회. getHandoverDetail과 달리 시공완료 전에도 호출 가능
   */
  async getPackageSelection(
    memberId: string,
    id: number,
  ): Promise<PackageSelectionView> {
    await this.findOwnedOrThrow(memberId, id);
    const { car, packageName, items, tintPositions } =
      await this.resolveMemberPackage(memberId);
    return {
      car: car?.name ?? null,
      vin: car?.vin ?? null,
      packageName,
      items,
      tintPositions,
    };
  }

  async confirmHandover(memberId: string, id: number): Promise<void> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.progressStatus !== 'DONE') {
      throw new BadRequestException('아직 시공이 완료되지 않은 예약입니다.');
    }
    if (await this.resolveHandoverConfirmation(reservation)) {
      throw new BadRequestException('이미 인수확인이 완료된 예약입니다.');
    }
    await this.prisma.reservation.update({
      where: { id },
      data: { handoverConfirmedAt: new Date() },
    });

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송)
    this.pushService
      .sendToShopPartners(reservation.shopCode, {
        type: 'RSV_HANDOVER_CONFIRMED',
        data: {
          reservationNo: reservation.reservationNo,
          reservationType: reservation.reservationType,
          ...(reservation.requestNo ? { requestNo: reservation.requestNo } : {}),
        },
      })
      .catch(() => {});
  }

  async getReview(memberId: string, id: number): Promise<ReviewView | null> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    const review = await this.prisma.review.findUnique({
      where: { reservationNo: reservation.reservationNo },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!review) return null;
    return {
      rating: review.rating,
      content: review.content,
      photos: review.photos.map((p) => p.photoPath),
      createdAt: review.createdAt.toISOString(),
    };
  }

  async createReview(
    memberId: string,
    id: number,
    dto: CreateReviewDto,
  ): Promise<ReviewView> {
    const reservation = await this.findOwnedOrThrow(memberId, id);
    if (reservation.progressStatus !== 'DONE') {
      throw new BadRequestException(
        '시공완료 후에만 후기를 작성할 수 있습니다.',
      );
    }
    const existing = await this.prisma.review.findUnique({
      where: { reservationNo: reservation.reservationNo },
    });
    if (existing) {
      throw new BadRequestException('이미 후기를 작성한 예약입니다.');
    }
    const photoPaths = await Promise.all(
      (dto.photos ?? []).map((p) => saveReviewPhoto(p)),
    );
    const review = await this.prisma.review.create({
      data: {
        reservationNo: reservation.reservationNo,
        memberId,
        shopCode: reservation.shopCode,
        rating: dto.rating,
        content: dto.content,
        photos: {
          create: photoPaths.map((photoPath, i) => ({
            photoPath,
            sortOrder: i,
          })),
        },
      },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
    return {
      rating: review.rating,
      content: review.content,
      photos: review.photos.map((p) => p.photoPath),
      createdAt: review.createdAt.toISOString(),
    };
  }

  /**
   * 인수확인 시점 계산 — 고객이 직접 확인했으면 그 시점을 그대로 반환.
   * 아직 확인하지 않았어도 완료일로부터 3일이 지났으면 그 3일째 시점으로 자동 확정 처리하고 저장한다
   * (실서비스라면 배치·스케줄러로 처리할 일이지만, 별도 스케줄러 인프라가 없어 조회 시점에 지연 확정하는 방식으로 대신함).
   */
  private async resolveHandoverConfirmation(
    reservation: Reservation,
  ): Promise<Date | null> {
    if (reservation.handoverConfirmedAt) return reservation.handoverConfirmedAt;
    if (!reservation.completedAt) return null;
    const autoConfirmAt = new Date(
      reservation.completedAt.getTime() +
        HANDOVER_AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000,
    );
    if (new Date() < autoConfirmAt) return null;
    const updated = await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: { handoverConfirmedAt: autoConfirmAt },
    });
    return updated.handoverConfirmedAt;
  }

  private async findOwnedOrThrow(
    memberId: string,
    id: number,
  ): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    // 존재하지 않는 id와 남의 예약을 구분해서 응답하면 다른 회원의 예약 id 존재 여부가 노출되므로 동일하게 404 처리
    if (!reservation || reservation.memberId !== memberId) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    return reservation;
  }
}
