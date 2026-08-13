// 신차 구매 내역(DL-NCPK-01~04) 관리자 CRUD — 딜러 직원·플랫폼 관리자 모두 AdminAccount로 로그인해 이 화면을 쓴다
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  NewCarPurchaseCustomer,
  NewCarPurchaseItem,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { CarsService } from '../cars/cars.service';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import type { CreateNewCarPurchaseDto } from './dto/create-new-car-purchase.dto';
import type { UpdateNewCarPurchaseDto } from './dto/update-new-car-purchase.dto';

export interface NewCarPurchaseListItem {
  vin: string;
  dealerCompanyId: number;
  customerName: string;
  phone: string; // 복호화된 평문(관리자 화면 표시용)
  carBrandCode: string;
  carModelCode: string;
  trimName: string;
  modelYear: string | null;
  packageCode: string | null;
  purchaseDate: string | null;
  isMapped: boolean;
  mappedAt: string | null;
  confirmed: boolean;
  confirmedAt: string | null;
  confirmedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  componentCodes: string[];
  // 신차패키지 시공 예약 사용 여부(옛 AD-NCPK-06 "발급 현황"을 이 화면에 편입, 2026-08-13) — 매핑된 회원의
  // 신차패키지(PKG) 예약 중 취소되지 않은 가장 최근 건을 근거로 판단(Reservation에 VIN 연결 컬럼이 없어
  // memberId 기준 역추적 — resolveMemberPackage와 동일한 근사치 방식, 회원이 매핑 차량을 여러 대 갖는 경우는
  // 구분 불가). usedDate는 시공 방문일(Reservation.date)이 아니라 "예약을 등록한 날짜"(Reservation.createdAt,
  // 업그레이드·추가옵션 추가 결제가 발생한 시점 — 2026-08-13 사용자 확정)
  used: boolean;
  usedDate: string | null;
  usedShopName: string | null;
}

export interface BulkCreateResultRow {
  vin: string;
  success: boolean;
  error?: string;
}

type RowWithItems = NewCarPurchaseCustomer & {
  selectedItems: NewCarPurchaseItem[];
};

@Injectable()
export class NewCarPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneCrypto: PhoneCryptoService,
    private readonly carsService: CarsService,
  ) {}

  private toListItem(
    row: RowWithItems,
    usage?: { registeredAt: Date; shopName: string },
  ): NewCarPurchaseListItem {
    return {
      vin: row.vin,
      dealerCompanyId: row.dealerCompanyId,
      customerName: row.customerName,
      phone: this.phoneCrypto.format(
        this.phoneCrypto.decrypt(row.phoneEncrypted),
      ),
      carBrandCode: row.carBrandCode,
      carModelCode: row.carModelCode,
      trimName: row.trimName,
      modelYear: row.modelYear,
      packageCode: row.packageCode,
      purchaseDate: row.purchaseDate
        ? row.purchaseDate.toISOString().slice(0, 10)
        : null,
      isMapped: row.isMapped,
      mappedAt: row.mappedAt ? row.mappedAt.toISOString() : null,
      confirmed: row.confirmed,
      confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
      confirmedBy: row.confirmedBy,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      componentCodes: row.selectedItems.map((i) => i.componentCode),
      used: !!usage,
      usedDate: usage ? usage.registeredAt.toISOString().slice(0, 10) : null,
      usedShopName: usage?.shopName ?? null,
    };
  }

  /** 매핑된 회원별 신차패키지(PKG) 예약 사용 이력(취소 제외, 등록일 기준 가장 최근 건) 일괄 조회 — N+1 방지용 배치 조회 */
  private async resolveLatestPkgReservations(
    memberIds: string[],
  ): Promise<Map<string, { registeredAt: Date; shopName: string }>> {
    const map = new Map<string, { registeredAt: Date; shopName: string }>();
    if (memberIds.length === 0) {
      return map;
    }
    const reservations = await this.prisma.reservation.findMany({
      where: {
        memberId: { in: memberIds },
        reservationType: 'PKG',
        status: 'CONFIRMED',
      },
      orderBy: { createdAt: 'desc' },
      include: { shop: { select: { name: true } } },
    });
    for (const r of reservations) {
      if (!map.has(r.memberId)) {
        map.set(r.memberId, {
          registeredAt: r.createdAt,
          shopName: r.shop.name,
        });
      }
    }
    return map;
  }

  async list(params: {
    keyword?: string;
    confirmed?: boolean;
  }): Promise<NewCarPurchaseListItem[]> {
    const rows = await this.prisma.newCarPurchaseCustomer.findMany({
      where: {
        ...(params.confirmed !== undefined
          ? { confirmed: params.confirmed }
          : {}),
        ...(params.keyword
          ? {
              OR: [
                { customerName: { contains: params.keyword } },
                { vin: { contains: params.keyword } },
              ],
            }
          : {}),
      },
      include: { selectedItems: true },
      orderBy: { createdAt: 'desc' },
    });
    const memberIds = [
      ...new Set(
        rows.map((r) => r.memberId).filter((id): id is string => id !== null),
      ),
    ];
    const usageMap = await this.resolveLatestPkgReservations(memberIds);
    return rows.map((r) =>
      this.toListItem(r, r.memberId ? usageMap.get(r.memberId) : undefined),
    );
  }

  async get(vin: string): Promise<NewCarPurchaseListItem> {
    const row = await this.prisma.newCarPurchaseCustomer.findUnique({
      where: { vin },
      include: { selectedItems: true },
    });
    if (!row) {
      throw new NotFoundException('구매 내역을 찾을 수 없습니다.');
    }
    const usageMap = row.memberId
      ? await this.resolveLatestPkgReservations([row.memberId])
      : new Map<string, { registeredAt: Date; shopName: string }>();
    return this.toListItem(
      row,
      row.memberId ? usageMap.get(row.memberId) : undefined,
    );
  }

  async create(
    dto: CreateNewCarPurchaseDto,
    createdBy: string,
  ): Promise<NewCarPurchaseListItem> {
    const exists = await this.prisma.newCarPurchaseCustomer.findUnique({
      where: { vin: dto.vin },
    });
    if (exists) {
      throw new ConflictException(`이미 등록된 VIN입니다. (${dto.vin})`);
    }
    const normalized = this.phoneCrypto.normalize(dto.phone);
    const phoneHash = this.phoneCrypto.hash(normalized);
    await this.prisma.newCarPurchaseCustomer.create({
      data: {
        vin: dto.vin,
        dealerCompanyId: dto.dealerCompanyId,
        customerName: dto.customerName,
        phoneEncrypted: this.phoneCrypto.encrypt(normalized),
        phoneHash,
        carBrandCode: dto.carBrandCode,
        carModelCode: dto.carModelCode,
        trimName: dto.trimName,
        modelYear: dto.modelYear,
        packageCode: dto.packageCode,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        createdBy,
        selectedItems:
          dto.componentCodes && dto.componentCodes.length > 0
            ? {
                create: dto.componentCodes.map((componentCode) => ({
                  componentCode,
                })),
              }
            : undefined,
      },
    });
    // 이름+휴대폰이 일치하는 이미 가입된 회원이 있으면 등록 즉시 매핑(반대 방향은 AuthService.signup 참고)
    await this.carsService.mapExistingCustomerToPurchase(
      dto.vin,
      dto.customerName,
      phoneHash,
    );
    return this.get(dto.vin);
  }

  /** 엑셀 일괄업로드(DL-NCPK-03) — 행 단위로 개별 성공/실패 처리, 한 행 실패가 나머지 행에 영향 주지 않음 */
  async bulkCreate(
    rows: CreateNewCarPurchaseDto[],
    createdBy: string,
  ): Promise<BulkCreateResultRow[]> {
    const results: BulkCreateResultRow[] = [];
    for (const row of rows) {
      try {
        await this.create(row, createdBy);
        results.push({ vin: row.vin, success: true });
      } catch (err) {
        results.push({
          vin: row.vin,
          success: false,
          error: err instanceof Error ? err.message : '등록 실패',
        });
      }
    }
    return results;
  }

  async update(
    vin: string,
    dto: UpdateNewCarPurchaseDto,
    me: SafeAdminAccount,
  ): Promise<NewCarPurchaseListItem> {
    const exists = await this.prisma.newCarPurchaseCustomer.findUnique({
      where: { vin },
    });
    if (!exists) {
      throw new NotFoundException('구매 내역을 찾을 수 없습니다.');
    }
    if (exists.confirmed && me.accountType !== 'ADMIN') {
      throw new ForbiddenException(
        '확정된 구매 내역은 관리자만 수정할 수 있습니다.',
      );
    }

    const { componentCodes, phone, purchaseDate, ...rest } = dto;
    const newPhoneHash = phone
      ? this.phoneCrypto.hash(this.phoneCrypto.normalize(phone))
      : undefined;
    const phoneFields = phone
      ? {
          phoneEncrypted: this.phoneCrypto.encrypt(
            this.phoneCrypto.normalize(phone),
          ),
          phoneHash: newPhoneHash,
        }
      : {};

    await this.prisma.newCarPurchaseCustomer.update({
      where: { vin },
      data: {
        ...rest,
        ...phoneFields,
        ...(purchaseDate !== undefined
          ? { purchaseDate: new Date(purchaseDate) }
          : {}),
        updatedBy: me.username,
      },
    });

    if (componentCodes !== undefined) {
      await this.prisma.newCarPurchaseItem.deleteMany({ where: { vin } });
      if (componentCodes.length > 0) {
        await this.prisma.newCarPurchaseItem.createMany({
          data: componentCodes.map((componentCode) => ({ vin, componentCode })),
        });
      }
    }

    // 아직 미매핑 상태면 수정 후 값(이름·휴대폰 오타 정정 등) 기준으로 다시 매핑 시도 — create()와 동일한 이유
    if (!exists.isMapped) {
      await this.carsService.mapExistingCustomerToPurchase(
        vin,
        dto.customerName ?? exists.customerName,
        newPhoneHash ?? exists.phoneHash,
      );
    }

    return this.get(vin);
  }

  /** 등록→확정 상태 전환(DL-NCPK-04) — 확정 후에는 관리자(accountType=ADMIN)만 수정 가능 */
  async confirm(
    vin: string,
    me: SafeAdminAccount,
  ): Promise<NewCarPurchaseListItem> {
    const exists = await this.prisma.newCarPurchaseCustomer.findUnique({
      where: { vin },
    });
    if (!exists) {
      throw new NotFoundException('구매 내역을 찾을 수 없습니다.');
    }
    await this.prisma.newCarPurchaseCustomer.update({
      where: { vin },
      data: {
        confirmed: true,
        confirmedAt: new Date(),
        confirmedBy: me.username,
      },
    });
    return this.get(vin);
  }
}
