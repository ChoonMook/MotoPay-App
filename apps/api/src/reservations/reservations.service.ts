// 시공 예약 생성/조회/취소/일정변경 — 휴무일·정원·잠금을 검증한 뒤 예약번호를 자동 채번해 등록
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Reservation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  formatDateOnly,
  formatTimeOnly,
  parseDateOnly,
  parseTimeOnly,
  resolveDayType,
} from '../common/schedule-date.util';

export interface CreateReservationParams {
  shopCode: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  reservationType: string; // -> CommonCodeDetail(code='RESERVATION_TYPE')
  memberId: string;
}

export interface CancelReservationParams {
  reason: string; // -> CommonCodeDetail(code='CANCEL_REASON')
  reasonEtc?: string; // reason이 'ETC'일 때의 자유 입력 텍스트
}

export interface RescheduleReservationParams {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
}

/** 오늘(UTC 자정 기준) — 예약 date 컬럼이 @db.Date(UTC 자정 저장)라 동일 기준으로 비교 */
function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export interface ReservationView extends Omit<Reservation, 'date' | 'time'> {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
}

function toView(reservation: Reservation): ReservationView {
  const { date, time, ...rest } = reservation;
  return { ...rest, date: formatDateOnly(date), time: formatTimeOnly(time) };
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateReservationParams): Promise<ReservationView> {
    const { shopCode, date, time, reservationType, memberId } = params;
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
      return tx.reservation.update({
        where: { id: created.id },
        data: { reservationNo: String(created.id).padStart(10, '0') },
      });
    });

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
   * 예약 취소 — 확정(CONFIRMED) 상태만 취소 가능, 이미 지난 예약은 취소 불가.
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

  /**
   * 일정 변경 — 확정(CONFIRMED) 상태만 가능, 새 일시도 휴무일·정원·잠금을 create()와 동일하게 검증.
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
    if (reservation.date < todayUtcMidnight()) {
      throw new BadRequestException(
        '이미 지난 예약은 일정을 변경할 수 없습니다.',
      );
    }

    const { shopCode } = reservation;
    const targetDate = parseDateOnly(params.date);
    const targetTime = parseTimeOnly(params.time);
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
          id: { not: id },
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

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { date: targetDate, time: targetTime, seq: reservedCount + 1 },
    });
    return toView(updated);
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
