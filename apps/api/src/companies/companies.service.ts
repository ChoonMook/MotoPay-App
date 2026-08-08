// 업체 관리(AD-CO-02 업체 등록/AD-CO-03 업체 목록/AD-CO-04 업체 상세) — 딜러사·시공업체·공급업체 통합 관리.
// 시공업체(coType='SHOP')는 신규 등록 시 이 서비스가 새 Shop 레코드까지 함께 생성해 shopCode로 연결한다(운영
// 데이터는 Shop에 그대로 유지, 이 테이블은 사업자 정보·상태만 관리). 딜러사·공급업체는 아직 별도 운영 테이블이
// 없어 이 테이블이 유일한 레코드다. 업체 상세에서 매장(Shop) 정보 수정은 ShopsService를 그대로 재사용하고,
// 소속 사용자(PartnerUser) 계정 추가·수정·삭제는 이 서비스에서 shopCode 범위로 직접 관리한다.
import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Company, PartnerUser } from '@prisma/client';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShopsService, type ShopDetail } from '../shops/shops.service';
import {
  ShopScheduleService,
  type DailyScheduleView,
} from '../shops/shop-schedule.service';
import type { UpdateShopDto } from '../shops/dto/update-shop.dto';
import type { UploadShopPhotoDto } from '../shops/dto/upload-shop-photo.dto';
import type { CreateCompanyDto } from './dto/create-company.dto';
import type { UpdateCompanyDto } from './dto/update-company.dto';
import type { CreatePartnerUserDto } from './dto/create-partner-user.dto';
import type { UpdatePartnerUserDto } from './dto/update-partner-user.dto';
import type { TimeSlotInputDto } from './dto/replace-company-time-slots.dto';
import type { UpsertCompanyDailySlotDto } from './dto/upsert-company-daily-slot.dto';

const SALT_ROUNDS = 10;

export interface CompanyListItem {
  id: number;
  coType: string;
  name: string;
  businessRegNo: string;
  representativeName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  shopCode: string | null;
  useYn: boolean;
  suspendReason: string | null;
  createdAt: Date;
}

export interface PartnerUserListItem {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  useYn: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[bytes[i] % chars.length];
  return out;
}

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopsService: ShopsService,
    private readonly shopScheduleService: ShopScheduleService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  private toListItem(company: Company): CompanyListItem {
    return {
      id: company.id,
      coType: company.coType,
      name: company.name,
      businessRegNo: company.businessRegNo,
      representativeName: company.representativeName,
      contactName: company.contactName,
      contactPhone: company.contactPhone,
      shopCode: company.shopCode,
      useYn: company.useYn,
      suspendReason: company.suspendReason,
      createdAt: company.createdAt,
    };
  }

  private toPartnerUserListItem(user: PartnerUser): PartnerUserListItem {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phoneEncrypted ? this.phoneCrypto.decrypt(user.phoneEncrypted) : null,
      useYn: user.useYn,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async list(): Promise<CompanyListItem[]> {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return companies.map((c) => this.toListItem(c));
  }

  /** 신규 업체 등록 — coType='SHOP'이면 새 Shop 레코드까지 함께 생성해 shopCode로 연결한다 */
  async create(dto: CreateCompanyDto): Promise<CompanyListItem> {
    if (dto.coType === 'SHOP') {
      const created = await this.prisma.$transaction(async (tx) => {
        // Shop.shopCode(pk 성격의 unique)는 자동 채번(id 기반) 전까지 임시값이 필요 — Product.productCode와
        // 동일한 2단계 채번 방식(prisma/seed-shops.ts 참고): 생성 → id 기반 10자리 0-padding으로 즉시 업데이트
        const placeholder = await tx.shop.create({ data: { name: dto.name, shopCode: '0'.repeat(10) } });
        const shop = await tx.shop.update({
          where: { id: placeholder.id },
          data: { shopCode: String(placeholder.id).padStart(10, '0') },
        });
        return tx.company.create({
          data: {
            coType: dto.coType,
            name: dto.name,
            businessRegNo: dto.businessRegNo,
            representativeName: dto.representativeName,
            contactName: dto.contactName,
            contactPhone: dto.contactPhone,
            shopCode: shop.shopCode,
          },
        });
      });
      return this.toListItem(created);
    }

    const created = await this.prisma.company.create({
      data: {
        coType: dto.coType,
        name: dto.name,
        businessRegNo: dto.businessRegNo,
        representativeName: dto.representativeName,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
      },
    });
    return this.toListItem(created);
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<CompanyListItem> {
    const exists = await this.prisma.company.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('업체를 찾을 수 없습니다.');
    }
    if (dto.useYn === false && !dto.suspendReason && !exists.suspendReason) {
      throw new BadRequestException('사용중지 시 중지 사유를 입력해야 합니다.');
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        name: dto.name,
        businessRegNo: dto.businessRegNo,
        representativeName: dto.representativeName,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        useYn: dto.useYn,
        suspendReason: dto.useYn === true ? null : dto.suspendReason,
      },
    });
    return this.toListItem(updated);
  }

  /** coType='SHOP'인 업체만 매장·소속계정 관리 대상 — 아니면 400 */
  private async requireShopCompany(companyId: number): Promise<Company & { shopCode: string }> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('업체를 찾을 수 없습니다.');
    }
    if (company.coType !== 'SHOP' || !company.shopCode) {
      throw new BadRequestException('시공업체 타입 업체만 매장·계정 정보를 관리할 수 있습니다.');
    }
    return company as Company & { shopCode: string };
  }

  async getShop(companyId: number): Promise<ShopDetail> {
    const company = await this.requireShopCompany(companyId);
    return this.shopsService.getDetail(company.shopCode);
  }

  async updateShop(companyId: number, dto: UpdateShopDto): Promise<ShopDetail> {
    const company = await this.requireShopCompany(companyId);
    return this.shopsService.updateMyShop(company.shopCode, dto);
  }

  async listPartnerUsers(companyId: number): Promise<PartnerUserListItem[]> {
    const company = await this.requireShopCompany(companyId);
    const users = await this.prisma.partnerUser.findMany({
      where: { shopCode: company.shopCode },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => this.toPartnerUserListItem(u));
  }

  /** 사용자 계정 추가 화면에서 아이디 입력 직후 중복 여부를 미리 확인하기 위한 조회(전역 유니크) */
  async checkPartnerUsernameAvailable(username: string): Promise<{ available: boolean }> {
    const trimmed = username?.trim();
    if (!trimmed) {
      throw new BadRequestException('아이디를 입력해주세요.');
    }
    const exists = await this.prisma.partnerUser.findUnique({ where: { username: trimmed } });
    return { available: !exists };
  }

  async createPartnerUser(
    companyId: number,
    dto: CreatePartnerUserDto,
  ): Promise<{ user: PartnerUserListItem; tempPassword: string }> {
    const company = await this.requireShopCompany(companyId);

    const exists = await this.prisma.partnerUser.findUnique({ where: { username: dto.username } });
    if (exists) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
    const normalized = this.phoneCrypto.normalize(dto.phone);
    const phoneEncrypted = this.phoneCrypto.encrypt(this.phoneCrypto.format(normalized));
    const phoneHash = this.phoneCrypto.hash(normalized);

    const created = await this.prisma.partnerUser.create({
      data: {
        username: dto.username,
        passwordHash,
        name: dto.name,
        email: dto.email,
        phoneEncrypted,
        phoneHash,
        shopCode: company.shopCode,
        mustChangePassword: true,
      },
    });
    return { user: this.toPartnerUserListItem(created), tempPassword };
  }

  private async requirePartnerUserInCompany(companyId: number, userId: string) {
    const company = await this.requireShopCompany(companyId);
    const user = await this.prisma.partnerUser.findUnique({ where: { id: userId } });
    if (!user || user.shopCode !== company.shopCode) {
      throw new NotFoundException('소속 사용자 계정을 찾을 수 없습니다.');
    }
    return user;
  }

  async updatePartnerUser(
    companyId: number,
    userId: string,
    dto: UpdatePartnerUserDto,
  ): Promise<PartnerUserListItem> {
    await this.requirePartnerUserInCompany(companyId, userId);

    let phoneEncrypted: string | undefined;
    let phoneHash: string | undefined;
    if (dto.phone) {
      const normalized = this.phoneCrypto.normalize(dto.phone);
      phoneEncrypted = this.phoneCrypto.encrypt(this.phoneCrypto.format(normalized));
      phoneHash = this.phoneCrypto.hash(normalized);
    }

    const updated = await this.prisma.partnerUser.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        phoneEncrypted,
        phoneHash,
        useYn: dto.useYn,
      },
    });
    return this.toPartnerUserListItem(updated);
  }

  async deletePartnerUser(companyId: number, userId: string): Promise<void> {
    await this.requirePartnerUserInCompany(companyId, userId);
    await this.prisma.partnerUser.delete({ where: { id: userId } });
  }

  // ── 매장 사진 ──────────────────────────────────────────────

  async uploadShopPhoto(companyId: number, dto: UploadShopPhotoDto): Promise<ShopDetail> {
    const company = await this.requireShopCompany(companyId);
    return this.shopsService.uploadPhoto(company.shopCode, dto);
  }

  async deleteShopPhoto(companyId: number, photoId: number): Promise<ShopDetail> {
    const company = await this.requireShopCompany(companyId);
    return this.shopsService.deletePhoto(company.shopCode, photoId);
  }

  // ── 휴무일 ──────────────────────────────────────────────

  async listHolidays(companyId: number, year: number, month: number): Promise<string[]> {
    const company = await this.requireShopCompany(companyId);
    return this.shopScheduleService.listHolidays(company.shopCode, year, month);
  }

  async addHolidays(companyId: number, dates: string[]): Promise<void> {
    const company = await this.requireShopCompany(companyId);
    await this.shopScheduleService.addHolidays(company.shopCode, dates);
  }

  async removeHoliday(companyId: number, date: string): Promise<void> {
    const company = await this.requireShopCompany(companyId);
    await this.shopScheduleService.removeHoliday(company.shopCode, date);
  }

  // ── 예약가능 시간대 템플릿 ──────────────────────────────────

  async getTimeSlots(companyId: number, dayType: string): Promise<{ time: string; capacity: number }[]> {
    const company = await this.requireShopCompany(companyId);
    return this.shopScheduleService.getTimeSlots(company.shopCode, dayType);
  }

  async replaceTimeSlots(companyId: number, dayType: string, slots: TimeSlotInputDto[]): Promise<void> {
    const company = await this.requireShopCompany(companyId);
    await this.shopScheduleService.replaceTimeSlots(company.shopCode, dayType, slots);
  }

  // ── 일자별 스케줄(템플릿+오버라이드+예약 병합 조회, 정원·잠금 오버라이드 수정) ──

  async getDailySchedule(companyId: number, date: string): Promise<DailyScheduleView> {
    const company = await this.requireShopCompany(companyId);
    return this.shopScheduleService.getDailySchedule(company.shopCode, date);
  }

  async upsertDailySlot(companyId: number, dto: UpsertCompanyDailySlotDto): Promise<void> {
    const company = await this.requireShopCompany(companyId);
    await this.shopScheduleService.upsertDailySlot(company.shopCode, dto);
  }
}
