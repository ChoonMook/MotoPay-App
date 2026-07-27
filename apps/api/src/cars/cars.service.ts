// 신차 구매 고객 정보 <-> 회원 자동 매핑, 내 차량 정보 관리
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MyCar } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMyCarDto } from './dto/create-my-car.dto';
import type { UpdateMyCarDto } from './dto/update-my-car.dto';

// 신차매핑(MAP) 차량이 연결된 패키지 상품코드 -> Product.productCode(prodType='PKG')를
// NewCarPurchaseCustomer.packageCode에서 조인해 얹은 뷰 — 수기등록(MANUAL)은 항상 null
export interface MyCarView extends MyCar {
  packageCode: string | null;
}

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 내 차량 목록 조회 — 대표차량이 먼저 오도록 정렬 */
  async listMyCars(userId: string): Promise<MyCarView[]> {
    const cars = await this.prisma.myCar.findMany({
      where: { memberId: userId },
      include: { purchase: { select: { packageCode: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return cars.map(({ purchase, ...car }) => ({
      ...car,
      packageCode: purchase?.packageCode ?? null,
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

  /**
   * 회원가입 직후 호출 — 이름+휴대폰 해시로 미매핑된 신차 구매 정보를 찾아
   * 매핑 처리(NewCarPurchaseCustomer)하고 내 차량 정보(MyCar)에 자동 등록.
   * 매칭되는 구매 정보가 없으면 아무 일도 하지 않음.
   */
  async mapNewCarPurchase(
    userId: string,
    name: string,
    phoneHash: string,
  ): Promise<void> {
    const purchase = await this.prisma.newCarPurchaseCustomer.findFirst({
      where: { phoneHash, customerName: name, isMapped: false },
    });
    if (!purchase) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.newCarPurchaseCustomer.update({
        where: { vin: purchase.vin },
        data: { isMapped: true, mappedAt: new Date(), memberId: userId },
      }),
      this.prisma.myCar.create({
        data: {
          memberId: userId,
          regType: 'MAP',
          purchaseVin: purchase.vin,
          dealerCode: purchase.dealerCode,
          carBrandCode: purchase.carBrandCode,
          carModelCode: purchase.carModelCode,
          trimName: purchase.trimName,
          modelYear: purchase.modelYear,
          vin: purchase.vin,
          isDefault: true, // 가입 직후 자동 매핑되는 첫 차량이라 대표차량으로 지정
        },
      }),
    ]);
  }
}
