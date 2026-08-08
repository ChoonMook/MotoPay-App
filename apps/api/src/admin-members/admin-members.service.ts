// 고객 회원 관리(AD-MBR-02 고객 회원 목록) — role='CUSTOMER'인 User만 대상으로 목록/상세 조회, 탈퇴 처리
import { Injectable, NotFoundException } from '@nestjs/common';
import type { User, UserRole } from '@prisma/client';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminMemberListItem {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  email: string | null;
  carCount: number;
  withdrawnAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface AdminMemberCar {
  id: number;
  regType: string;
  carBrandCode: string;
  carModelCode: string;
  trimName: string | null;
  modelYear: string | null;
  plateNumber: string | null;
  isDefault: boolean;
}

export interface AdminMemberPackage {
  vin: string;
  packageCode: string;
  packageName: string | null;
  carBrandCode: string;
  carModelCode: string;
  trimName: string;
  isMapped: boolean;
  mappedAt: Date | null;
  createdAt: Date;
}

export interface AdminMemberDetail extends AdminMemberListItem {
  cars: AdminMemberCar[];
  packages: AdminMemberPackage[];
}

const CUSTOMER_ROLE: UserRole = 'CUSTOMER';

@Injectable()
export class AdminMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  private toListItem(
    user: User & { _count: { cars: number } },
  ): AdminMemberListItem {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phoneEncrypted
        ? this.phoneCrypto.decrypt(user.phoneEncrypted)
        : null,
      email: user.email,
      carCount: user._count.cars,
      withdrawnAt: user.withdrawnAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async list(): Promise<AdminMemberListItem[]> {
    const users = await this.prisma.user.findMany({
      where: { role: CUSTOMER_ROLE },
      include: { _count: { select: { cars: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.toListItem(u));
  }

  async detail(id: string): Promise<AdminMemberDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { cars: true } },
        cars: { orderBy: { isDefault: 'desc' } },
        carPurchases: {
          where: { packageCode: { not: null } },
          include: { package: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user || user.role !== CUSTOMER_ROLE) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    return {
      ...this.toListItem(user),
      cars: user.cars.map((c) => ({
        id: c.id,
        regType: c.regType,
        carBrandCode: c.carBrandCode,
        carModelCode: c.carModelCode,
        trimName: c.trimName,
        modelYear: c.modelYear,
        plateNumber: c.plateNumber,
        isDefault: c.isDefault,
      })),
      packages: user.carPurchases.map((p) => ({
        vin: p.vin,
        packageCode: p.packageCode as string,
        packageName: p.package?.name ?? null,
        carBrandCode: p.carBrandCode,
        carModelCode: p.carModelCode,
        trimName: p.trimName,
        isMapped: p.isMapped,
        mappedAt: p.mappedAt,
        createdAt: p.createdAt,
      })),
    };
  }

  async setWithdrawn(id: string, withdrawn: boolean): Promise<AdminMemberListItem> {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists || exists.role !== CUSTOMER_ROLE) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { withdrawnAt: withdrawn ? new Date() : null },
      include: { _count: { select: { cars: true } } },
    });
    return this.toListItem(updated);
  }
}
