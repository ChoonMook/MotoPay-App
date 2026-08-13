// 시공업체 스케줄 관리 — 휴무일/예약가능 시간대 템플릿/일자별 정원 오버라이드 조회·수정
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  formatDateOnly,
  formatTimeOnly,
  parseDateOnly,
  parseTimeOnly,
  resolveDayType,
} from '../common/schedule-date.util';

export interface TimeSlotInput {
  time: string; // "HH:mm"
  capacity: number;
}

export interface DailySlotView {
  time: string; // "HH:mm"
  capacity: number | null; // 이 시간대의 예약 가능 대수 — 템플릿에 없는 시간대면 null
  isLocked: boolean;
  reservedCount: number;
  reservations: {
    reservationNo: string;
    seq: number;
    reservationType: string;
    customerName: string;
  }[];
}

export interface DailyScheduleView {
  date: string; // "YYYY-MM-DD"
  isHoliday: boolean;
  slots: DailySlotView[];
}

export interface MonthlyScheduleDay {
  date: string; // "YYYY-MM-DD"
  reservedCount: number; // 그 날짜의 확정(CONFIRMED) 예약 건수
  isHoliday: boolean;
  isLocked: boolean; // 그 날짜에 잠금 처리된 시간대가 하나라도 있으면 true
}

@Injectable()
export class ShopScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 휴무일 ──────────────────────────────────────────────

  async listHolidays(
    shopCode: string,
    year: number,
    month: number,
  ): Promise<string[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const rows = await this.prisma.shopHoliday.findMany({
      where: { shopCode, holidayDate: { gte: start, lt: end } },
      orderBy: { holidayDate: 'asc' },
    });
    return rows.map((r) => formatDateOnly(r.holidayDate));
  }

  async addHolidays(shopCode: string, dates: string[]): Promise<void> {
    await this.prisma.shopHoliday.createMany({
      data: dates.map((date) => ({
        shopCode,
        holidayDate: parseDateOnly(date),
      })),
      skipDuplicates: true,
    });
  }

  async removeHoliday(shopCode: string, date: string): Promise<void> {
    const holidayDate = parseDateOnly(date);
    const existing = await this.prisma.shopHoliday.findUnique({
      where: { shopCode_holidayDate: { shopCode, holidayDate } },
    });
    if (!existing) {
      throw new NotFoundException('휴무일로 등록되지 않은 날짜입니다.');
    }
    await this.prisma.shopHoliday.delete({
      where: { shopCode_holidayDate: { shopCode, holidayDate } },
    });
  }

  // ── 예약가능 시간대 템플릿 ──────────────────────────────────

  async getTimeSlots(
    shopCode: string,
    dayType: string,
  ): Promise<{ time: string; capacity: number }[]> {
    const rows = await this.prisma.shopTimeSlot.findMany({
      where: { shopCode, dayType },
      orderBy: { time: 'asc' },
    });
    return rows.map((r) => ({
      time: formatTimeOnly(r.time),
      capacity: r.capacity,
    }));
  }

  // 화면의 "저장" 버튼과 동일한 의미 — 해당 요일구분의 시간대 목록을 통째로 교체
  async replaceTimeSlots(
    shopCode: string,
    dayType: string,
    slots: TimeSlotInput[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.shopTimeSlot.deleteMany({ where: { shopCode, dayType } }),
      this.prisma.shopTimeSlot.createMany({
        data: slots.map((s) => ({
          shopCode,
          dayType,
          time: parseTimeOnly(s.time),
          capacity: s.capacity,
        })),
      }),
    ]);
  }

  // ── 일자별 스케줄(템플릿 + 오버라이드 + 예약 병합 조회) ──────────

  async getDailySchedule(
    shopCode: string,
    date: string,
  ): Promise<DailyScheduleView> {
    const targetDate = parseDateOnly(date);
    const dayType = resolveDayType(targetDate);

    const [holiday, template, overrides, reservations] = await Promise.all([
      this.prisma.shopHoliday.findUnique({
        where: { shopCode_holidayDate: { shopCode, holidayDate: targetDate } },
      }),
      this.prisma.shopTimeSlot.findMany({
        where: { shopCode, dayType },
        orderBy: { time: 'asc' },
      }),
      this.prisma.shopDailySlot.findMany({
        where: { shopCode, date: targetDate },
      }),
      this.prisma.reservation.findMany({
        where: { shopCode, date: targetDate, status: 'CONFIRMED' },
        include: { member: true },
        orderBy: [{ time: 'asc' }, { seq: 'asc' }],
      }),
    ]);

    const overrideByTime = new Map(
      overrides.map((o) => [formatTimeOnly(o.time), o]),
    );
    const reservationsByTime = new Map<string, typeof reservations>();
    for (const r of reservations) {
      const key = formatTimeOnly(r.time);
      const list = reservationsByTime.get(key) ?? [];
      list.push(r);
      reservationsByTime.set(key, list);
    }

    // 템플릿에 있는 시간대 + 오버라이드만 있고 템플릿엔 없는 시간대(예: 임시 추가) 모두 포함
    const times = new Set<string>([
      ...template.map((t) => formatTimeOnly(t.time)),
      ...overrides.map((o) => formatTimeOnly(o.time)),
    ]);

    const slots: DailySlotView[] = [...times].sort().map((time) => {
      const templateSlot = template.find(
        (t) => formatTimeOnly(t.time) === time,
      );
      const override = overrideByTime.get(time);
      const slotReservations = reservationsByTime.get(time) ?? [];
      return {
        time,
        capacity: override?.capacity ?? templateSlot?.capacity ?? null,
        isLocked: override?.isLocked ?? false,
        reservedCount: slotReservations.length,
        reservations: slotReservations.map((r) => ({
          reservationNo: r.reservationNo,
          seq: r.seq,
          reservationType: r.reservationType,
          customerName: r.member.name,
        })),
      };
    });

    return { date, isHoliday: !!holiday, slots };
  }

  // 화면3의 스테퍼(정원)·토글(잠금)에 대응 — 지정한 값만 부분 수정
  async upsertDailySlot(
    shopCode: string,
    params: {
      date: string;
      time: string;
      capacity?: number;
      isLocked?: boolean;
    },
  ): Promise<void> {
    const { date, time, capacity, isLocked } = params;
    const targetDate = parseDateOnly(date);
    const targetTime = parseTimeOnly(time);

    if (capacity !== undefined && capacity < 0) {
      throw new BadRequestException('예약 가능 대수는 0 이상이어야 합니다.');
    }

    if (capacity !== undefined) {
      const reservedCount = await this.prisma.reservation.count({
        where: {
          shopCode,
          date: targetDate,
          time: targetTime,
          status: 'CONFIRMED',
        },
      });
      if (capacity < reservedCount) {
        throw new BadRequestException(
          `이미 예약된 인원(${reservedCount}명)보다 정원을 적게 설정할 수 없습니다.`,
        );
      }
    }

    // 주의: Prisma 7 + @prisma/adapter-mariadb 조합에서 DateTime을 포함한 3필드 복합키(@@id)에 대한
    // update()/upsert()가 아무 에러 없이 반영되지 않는 버그가 실측 확인됨(re-read해도 값이 그대로임).
    // 같은 파일의 다른 메서드들이 이미 쓰고 있는 updateMany(필터 기반) 방식으로 우회 — 대상 행이 없으면 새로 생성.
    const updateData = {
      ...(capacity !== undefined ? { capacity } : {}),
      ...(isLocked !== undefined ? { isLocked } : {}),
    };
    const { count } = await this.prisma.shopDailySlot.updateMany({
      where: { shopCode, date: targetDate, time: targetTime },
      data: updateData,
    });
    if (count === 0) {
      await this.prisma.shopDailySlot.create({
        data: {
          shopCode,
          date: targetDate,
          time: targetTime,
          capacity: capacity ?? null,
          isLocked: isLocked ?? false,
        },
      });
    }
  }

  // ── 월간 요약(화면1 캘린더의 일자별 배지) ──────────────────────

  async getMonthlySummary(
    shopCode: string,
    year: number,
    month: number,
  ): Promise<MonthlyScheduleDay[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [reservationCounts, holidays, lockedSlots] = await Promise.all([
      this.prisma.reservation.groupBy({
        by: ['date'],
        where: { shopCode, status: 'CONFIRMED', date: { gte: start, lt: end } },
        _count: { _all: true },
      }),
      this.prisma.shopHoliday.findMany({
        where: { shopCode, holidayDate: { gte: start, lt: end } },
      }),
      this.prisma.shopDailySlot.findMany({
        where: { shopCode, isLocked: true, date: { gte: start, lt: end } },
      }),
    ]);

    const countByDate = new Map(
      reservationCounts.map((r) => [formatDateOnly(r.date), r._count._all]),
    );
    const holidaySet = new Set(
      holidays.map((h) => formatDateOnly(h.holidayDate)),
    );
    const lockedSet = new Set(lockedSlots.map((s) => formatDateOnly(s.date)));

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const days: MonthlyScheduleDay[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = formatDateOnly(new Date(Date.UTC(year, month - 1, d)));
      days.push({
        date,
        reservedCount: countByDate.get(date) ?? 0,
        isHoliday: holidaySet.has(date),
        isLocked: lockedSet.has(date),
      });
    }
    return days;
  }
}
