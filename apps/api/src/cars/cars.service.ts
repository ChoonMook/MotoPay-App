// 신차 구매 고객 정보 <-> 회원 자동 매핑, 내 차량 정보 관리
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MyCar, NewCarPurchaseCustomer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push/push-notification.service';
import type { CreateMyCarDto } from './dto/create-my-car.dto';
import type { UpdateMyCarDto } from './dto/update-my-car.dto';

// 신차매핑(MAP) 차량이 연결된 패키지 상품코드 -> Product.productCode(prodType='PKG')를
// NewCarPurchaseCustomer.packageCode/mappedAt에서 조인해 얹은 뷰 — 수기등록(MANUAL)은 항상 null.
// mappedAt은 홈 화면이 "이 패키지에 대해 예약이 이미 있는지"를 판단할 때(예약 생성시점과 비교) 필요
export interface MyCarView extends MyCar {
  packageCode: string | null;
  mappedAt: string | null;
  dealerCompanyName: string | null;
}

@Injectable()
export class CarsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
  ) {}

  /** 내 차량 목록 조회 — 대표차량이 먼저 오도록 정렬 */
  async listMyCars(userId: string): Promise<MyCarView[]> {
    const cars = await this.prisma.myCar.findMany({
      where: { memberId: userId },
      include: {
        purchase: { select: { packageCode: true, mappedAt: true } },
        dealer: { select: { name: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return cars.map(({ purchase, dealer, ...car }) => ({
      ...car,
      packageCode: purchase?.packageCode ?? null,
      mappedAt: purchase?.mappedAt?.toISOString() ?? null,
      dealerCompanyName: dealer?.name ?? null,
    }));
  }

  /** 수기등록 — 딜러사 신차 매핑이 아니라 고객이 직접 차량 정보를 입력 */
  async createManualCar(userId: string, dto: CreateMyCarDto): Promise<MyCar> {
    const existingCount = await this.prisma.myCar.count({
      where: { memberId: userId },
    });

    return this.prisma.myCar.create({
      data: {
        memberId: userId,
        regType: 'MANUAL',
        carBrandCode: dto.carBrandCode,
        carModelCode: dto.carModelCode,
        trimName: dto.trimName,
        modelYear: dto.modelYear,
        plateNumber: dto.plateNumber,
        vin: dto.vin,
        isDefault: existingCount === 0, // 첫 차량이면 자동으로 대표차량
      },
    });
  }

  /**
   * 차량 수정 — 수기등록(regType='MANUAL')은 전체 필드 수정 가능.
   * 신차매핑(regType='MAP')은 딜러사 등록 정보(브랜드·차종·트림·연식·VIN)는 보존하되,
   * 출고 시점엔 번호판이 없을 수 있어 차량번호(plateNumber)만 예외적으로 수정 가능.
   */
  async updateCar(
    userId: string,
    carId: number,
    dto: UpdateMyCarDto,
  ): Promise<MyCar> {
    const car = await this.findOwnedCarOrThrow(userId, carId);

    if (car.regType !== 'MANUAL') {
      const { plateNumber, ...rest } = dto;
      const attemptsOtherFields = Object.values(rest).some(
        (value) => value !== undefined,
      );
      if (attemptsOtherFields) {
        throw new ForbiddenException(
          '신차매핑된 차량은 차량번호만 수정할 수 있습니다.',
        );
      }
      return this.prisma.myCar.update({
        where: { id: carId },
        data: { plateNumber },
      });
    }

    return this.prisma.myCar.update({
      where: { id: carId },
      data: dto,
    });
  }

  /**
   * 수기등록 차량 삭제 — 신차매핑(regType='MAP') 차량은 삭제 불가.
   * 삭제한 차량이 대표차량이었으면, 남은 차량 중 가장 먼저 등록된 차량을 새 대표차량으로 지정.
   */
  async deleteManualCar(userId: string, carId: number): Promise<void> {
    const car = await this.findOwnedCarOrThrow(userId, carId);
    if (car.regType !== 'MANUAL') {
      throw new ForbiddenException('신차매핑된 차량은 삭제할 수 없습니다.');
    }

    await this.prisma.myCar.delete({ where: { id: carId } });

    if (car.isDefault) {
      const next = await this.prisma.myCar.findFirst({
        where: { memberId: userId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.myCar.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  }

  /** 대표차량 지정 — 신차매핑/수기등록 구분 없이 가능 */
  async setDefaultCar(userId: string, carId: number): Promise<MyCar> {
    await this.findOwnedCarOrThrow(userId, carId);

    const [, updated] = await this.prisma.$transaction([
      this.prisma.myCar.updateMany({
        where: { memberId: userId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.myCar.update({
        where: { id: carId },
        data: { isDefault: true },
      }),
    ]);
    return updated;
  }

  private async findOwnedCarOrThrow(
    userId: string,
    carId: number,
  ): Promise<MyCar> {
    const car = await this.prisma.myCar.findUnique({ where: { id: carId } });
    // 존재하지 않는 id와 남의 차량을 구분해서 응답하면 다른 회원의 차량 id 존재 여부가 노출되므로 동일하게 404 처리
    if (!car || car.memberId !== userId) {
      throw new NotFoundException('차량 정보를 찾을 수 없습니다.');
    }
    return car;
  }

  /** 매핑 실행 공통 로직 — NewCarPurchaseCustomer.isMapped/mappedAt/memberId 갱신 + 내 차량 정보(MyCar, MAP)를 생성.
   * 이미 다른 차량을 보유한 회원일 수 있어(관리자 등록 시점 매핑) 대표차량 여부는 항상 true가 아니라 보유 차량 수로 판단.
   * 단, 신차패키지(packageCode)가 있는 매핑은 첫 차량이 아니어도 항상 대표차량으로 승격한다(2026-08-23 확정) —
   * 홈 화면의 "신차패키지 도착" 배너(HomeScreen.tsx CU-HOME-01)가 대표차량의 packageCode만 보고 노출 여부를
   * 판단하므로, 그렇게 하지 않으면 회원이 수동으로 대표차량을 바꿔야만 새로 도착한 패키지 배너가 뜨는 문제가 생김 */
  private async applyMapping(
    purchase: NewCarPurchaseCustomer,
    userId: string,
  ): Promise<void> {
    const existingCount = await this.prisma.myCar.count({
      where: { memberId: userId },
    });
    const shouldBeDefault = existingCount === 0 || !!purchase.packageCode;
    await this.prisma.$transaction([
      ...(shouldBeDefault && existingCount > 0
        ? [
            this.prisma.myCar.updateMany({
              where: { memberId: userId, isDefault: true },
              data: { isDefault: false },
            }),
          ]
        : []),
      this.prisma.newCarPurchaseCustomer.update({
        where: { vin: purchase.vin },
        data: { isMapped: true, mappedAt: new Date(), memberId: userId },
      }),
      this.prisma.myCar.create({
        data: {
          memberId: userId,
          regType: 'MAP',
          purchaseVin: purchase.vin,
          dealerCompanyId: purchase.dealerCompanyId,
          carBrandCode: purchase.carBrandCode,
          carModelCode: purchase.carModelCode,
          trimName: purchase.trimName,
          modelYear: purchase.modelYear,
          vin: purchase.vin,
          isDefault: shouldBeDefault,
        },
      }),
    ]);

    // 서비스 필수 알림(마케팅 동의 여부와 무관하게 발송) — 실패해도 매핑 자체는 이미 완료된 상태
    this.pushService
      .sendToOwner('USER', userId, { type: 'NCPK_MAPPED' })
      .catch(() => {});
  }

  /**
   * 회원가입 직후 호출 — 이름+휴대폰 해시로 미매핑된 신차 구매 정보를 찾아
   * 매핑 처리(NewCarPurchaseCustomer)하고 내 차량 정보(MyCar)에 자동 등록.
   * 매칭되는 구매 정보가 없으면 아무 일도 하지 않고 false를 반환(가입완료 화면의 매핑 안내 배지 노출 여부에 사용)
   */
  async mapNewCarPurchase(
    userId: string,
    name: string,
    phoneHash: string,
  ): Promise<boolean> {
    const purchase = await this.prisma.newCarPurchaseCustomer.findFirst({
      where: { phoneHash, customerName: name, isMapped: false },
    });
    if (!purchase) {
      return false;
    }
    await this.applyMapping(purchase, userId);
    return true;
  }

  /**
   * 신차 구매 정보 등록 직후(admin-app DL-NCPK-01~03) 호출 — 이름+휴대폰 해시가 일치하는 이미 가입된 회원이
   * 있으면 그 자리에서 바로 매핑 처리. 없으면 아무 일도 하지 않고 false를 반환(가입은 이후에 이 정보로 자동 매핑됨)
   */
  async mapExistingCustomerToPurchase(
    vin: string,
    customerName: string,
    phoneHash: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { phoneHash, name: customerName },
    });
    if (!user) {
      return false;
    }
    const purchase = await this.prisma.newCarPurchaseCustomer.findUnique({
      where: { vin },
    });
    if (!purchase || purchase.isMapped) {
      return false;
    }
    await this.applyMapping(purchase, user.id);
    return true;
  }
}
