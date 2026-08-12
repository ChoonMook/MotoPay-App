// 신차 구매 내역(DL-NCPK-01~04) 관리자 CRUD — 딜러 직원·플랫폼 관리자 모두 AdminAccount로 로그인해 이 화면을 쓴다
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { NewCarPurchaseCustomer, NewCarPurchaseItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import type { CreateNewCarPurchaseDto } from './dto/create-new-car-purchase.dto';
import type { UpdateNewCarPurchaseDto } from './dto/update-new-car-purchase.dto';

export interface NewCarPurchaseListItem {
  vin: string;
  dealerCode: string;
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
}

export interface BulkCreateResultRow {
  vin: string;
  success: boolean;
  error?: string;
}

type RowWithItems = NewCarPurchaseCustomer & { selectedItems: NewCarPurchaseItem[] };

@Injectable()
export class NewCarPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  private toListItem(row: RowWithItems): NewCarPurchaseListItem {
    return {
      vin: row.vin,
      dealerCode: row.dealerCode,
      customerName: row.customerName,
      phone: this.phoneCrypto.format(this.phoneCrypto.decrypt(row.phoneEncrypted)),
      carBrandCode: row.carBrandCode,
      carModelCode: row.carModelCode,
      trimName: row.trimName,
      modelYear: row.modelYear,
      packageCode: row.packageCode,
      purchaseDate: row.purchaseDate ? row.purchaseDate.toISOString().slice(0, 10) : null,
      isMapped: row.isMapped,
      mappedAt: row.mappedAt ? row.mappedAt.toISOString() : null,
      confirmed: row.confirmed,
      confirmedAt: row.confirmedAt ? row.confirmedAt.toISOString() : null,
      confirmedBy: row.confirmedBy,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      componentCodes: row.selectedItems.map((i) => i.componentCode),
    };
  }

  async list(params: { keyword?: string; confirmed?: boolean }): Promise<NewCarPurchaseListItem[]> {
    const rows = await this.prisma.newCarPurchaseCustomer.findMany({
      where: {
        ...(params.confirmed !== undefined ? { confirmed: params.confirmed } : {}),
        ...(params.keyword
          ? { OR: [{ customerName: { contains: params.keyword } }, { vin: { contains: params.keyword } }] }
          : {}),
      },
      include: { selectedItems: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toListItem(r));
  }

  async get(vin: string): Promise<NewCarPurchaseListItem> {
    const row = await this.prisma.newCarPurchaseCustomer.findUnique({
      where: { vin },
      include: { selectedItems: true },
    });
    if (!row) {
      throw new NotFoundException('구매 내역을 찾을 수 없습니다.');
    }
    return this.toListItem(row);
  }

  async create(dto: CreateNewCarPurchaseDto, createdBy: string): Promise<NewCarPurchaseListItem> {
    const exists = await this.prisma.newCarPurchaseCustomer.findUnique({ where: { vin: dto.vin } });
    if (exists) {
      throw new ConflictException(`이미 등록된 VIN입니다. (${dto.vin})`);
    }
    const normalized = this.phoneCrypto.normalize(dto.phone);
    await this.prisma.newCarPurchaseCustomer.create({
      data: {
        vin: dto.vin,
        dealerCode: dto.dealerCode,
        customerName: dto.customerName,
        phoneEncrypted: this.phoneCrypto.encrypt(normalized),
        phoneHash: this.phoneCrypto.hash(normalized),
        carBrandCode: dto.carBrandCode,
        carModelCode: dto.carModelCode,
        trimName: dto.trimName,
        modelYear: dto.modelYear,
        packageCode: dto.packageCode,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        createdBy,
        selectedItems:
          dto.componentCodes && dto.componentCodes.length > 0
            ? { create: dto.componentCodes.map((componentCode) => ({ componentCode })) }
            : undefined,
      },
    });
    return this.get(dto.vin);
  }

  /** 엑셀 일괄업로드(DL-NCPK-03) — 행 단위로 개별 성공/실패 처리, 한 행 실패가 나머지 행에 영향 주지 않음 */
  async bulkCreate(rows: CreateNewCarPurchaseDto[], createdBy: string): Promise<BulkCreateResultRow[]> {
    const results: BulkCreateResultRow[] = [];
    for (const row of rows) {
      try {
        await this.create(row, createdBy);
        results.push({ vin: row.vin, success: true });
      } catch (err) {
        results.push({ vin: row.vin, success: false, error: err instanceof Error ? err.message : '등록 실패' });
      }
    }
    return results;
  }

  async update(vin: string, dto: UpdateNewCarPurchaseDto, me: SafeAdminAccount): Promise<NewCarPurchaseListItem> {
    const exists = await this.prisma.newCarPurchaseCustomer.findUnique({ where: { vin } });
    if (!exists) {
      throw new NotFoundException('구매 내역을 찾을 수 없습니다.');
    }
    if (exists.confirmed && me.accountType !== 'ADMIN') {
      throw new ForbiddenException('확정된 구매 내역은 관리자만 수정할 수 있습니다.');
    }

    const { componentCodes, phone, purchaseDate, ...rest } = dto;
    const phoneFields = phone
      ? (() => {
          const normalized = this.phoneCrypto.normalize(phone);
          return { phoneEncrypted: this.phoneCrypto.encrypt(normalized), phoneHash: this.phoneCrypto.hash(normalized) };
        })()
      : {};

    await this.prisma.newCarPurchaseCustomer.update({
      where: { vin },
      data: {
        ...rest,
        ...phoneFields,
        ...(purchaseDate !== undefined ? { purchaseDate: new Date(purchaseDate) } : {}),
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

    return this.get(vin);
  }

  /** 등록→확정 상태 전환(DL-NCPK-04) — 확정 후에는 관리자(accountType=ADMIN)만 수정 가능 */
  async confirm(vin: string, me: SafeAdminAccount): Promise<NewCarPurchaseListItem> {
    const exists = await this.prisma.newCarPurchaseCustomer.findUnique({ where: { vin } });
    if (!exists) {
      throw new NotFoundException('구매 내역을 찾을 수 없습니다.');
    }
    await this.prisma.newCarPurchaseCustomer.update({
      where: { vin },
      data: { confirmed: true, confirmedAt: new Date(), confirmedBy: me.username },
    });
    return this.get(vin);
  }
}
