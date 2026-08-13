// 관리자 계정 관리(AD-SYS-04 사용자 계정 관리) — 운영사 소속 플랫폼관리자(운영사 직원) 계정 등록·수정·비활성화.
// 업체(딜러사·시공업체·공급업체) 소속 계정은 AD-CO-05에서 별도 관리(이 서비스의 대상이 아님)
import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { AdminAccount } from '@prisma/client';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import type { UpdateAdminAccountDto } from './dto/update-admin-account.dto';

const SALT_ROUNDS = 10;

type AdminAccountWithCompany = AdminAccount & {
  company: { name: string } | null;
};

export interface AdminAccountListItem {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  accountType: AdminAccount['accountType'];
  companyId: number | null;
  companyName: string | null;
  permGroup: string;
  useYn: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(12);
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[bytes[i] % chars.length];
  return out;
}

@Injectable()
export class AdminAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  private toListItem(account: AdminAccountWithCompany): AdminAccountListItem {
    return {
      id: account.id,
      username: account.username,
      name: account.name,
      email: account.email,
      phone: account.phoneEncrypted
        ? this.phoneCrypto.decrypt(account.phoneEncrypted)
        : null,
      accountType: account.accountType,
      companyId: account.companyId,
      companyName: account.company?.name ?? null,
      permGroup: account.permGroup,
      useYn: account.useYn,
      createdBy: account.createdBy,
      updatedBy: account.updatedBy,
      lastLoginAt: account.lastLoginAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * accountType='ADMIN'(운영사 직원)은 소속업체가 없어야 하고, DEALER·SUPPLIER는 반드시 같은 업체구분(coType)의
   * Company에 매핑돼야 한다 — AD-SYS-04 계정 추가/수정 양쪽에서 공통으로 검증
   */
  private async resolveCompanyId(
    accountType: string,
    companyId: number | null | undefined,
  ): Promise<number | null> {
    if (accountType === 'ADMIN') {
      return null;
    }
    if (!companyId) {
      throw new BadRequestException(
        '딜러사·공급업체 소속 계정은 소속업체를 선택해야 합니다.',
      );
    }
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new BadRequestException('선택한 소속업체를 찾을 수 없습니다.');
    }
    if (company.coType !== accountType) {
      throw new BadRequestException(
        '선택한 소속업체의 업체구분이 사용자유형과 일치하지 않습니다.',
      );
    }
    return companyId;
  }

  async list(): Promise<AdminAccountListItem[]> {
    const accounts = await this.prisma.adminAccount.findMany({
      orderBy: { createdAt: 'asc' },
      include: { company: { select: { name: true } } },
    });
    return accounts.map((a) => this.toListItem(a));
  }

  /** 계정 추가 화면에서 아이디 입력 직후 중복 여부를 미리 확인하기 위한 조회 */
  async checkUsernameAvailable(
    username: string,
  ): Promise<{ available: boolean }> {
    const trimmed = username?.trim();
    if (!trimmed) {
      throw new BadRequestException('아이디를 입력해주세요.');
    }
    const exists = await this.prisma.adminAccount.findUnique({
      where: { username: trimmed },
    });
    return { available: !exists };
  }

  /** 계정 추가 — 임시 비밀번호를 서버에서 생성해 해시만 저장하고, 평문은 이번 응답에만 1회 담아 돌려준다 */
  async create(
    dto: CreateAdminAccountDto,
    actingUsername: string,
  ): Promise<{ account: AdminAccountListItem; tempPassword: string }> {
    const exists = await this.prisma.adminAccount.findUnique({
      where: { username: dto.username },
    });
    if (exists) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }

    const companyId = await this.resolveCompanyId(
      dto.accountType,
      dto.companyId,
    );

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    let phoneEncrypted: string | undefined;
    let phoneHash: string | undefined;
    if (dto.phone) {
      const normalized = this.phoneCrypto.normalize(dto.phone);
      phoneEncrypted = this.phoneCrypto.encrypt(
        this.phoneCrypto.format(normalized),
      );
      phoneHash = this.phoneCrypto.hash(normalized);
    }

    const created = await this.prisma.adminAccount.create({
      data: {
        username: dto.username,
        passwordHash,
        name: dto.name,
        email: dto.email,
        phoneEncrypted,
        phoneHash,
        accountType: dto.accountType,
        companyId,
        permGroup: dto.permGroup,
        createdBy: actingUsername,
      },
      include: { company: { select: { name: true } } },
    });

    return { account: this.toListItem(created), tempPassword };
  }

  async update(
    id: string,
    dto: UpdateAdminAccountDto,
    actingUsername: string,
  ): Promise<AdminAccountListItem> {
    const exists = await this.prisma.adminAccount.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('관리자 계정을 찾을 수 없습니다.');
    }

    // 사용자유형 또는 소속업체 중 하나라도 이번 요청에서 바뀌면 둘의 조합을 다시 검증(그 외엔 기존 매핑 유지)
    let companyId: number | null | undefined;
    if (dto.accountType !== undefined || dto.companyId !== undefined) {
      const effectiveAccountType = dto.accountType ?? exists.accountType;
      const effectiveCompanyId =
        dto.companyId !== undefined ? dto.companyId : exists.companyId;
      companyId = await this.resolveCompanyId(
        effectiveAccountType,
        effectiveCompanyId,
      );
    }

    let phoneEncrypted: string | undefined;
    let phoneHash: string | undefined;
    if (dto.phone) {
      const normalized = this.phoneCrypto.normalize(dto.phone);
      phoneEncrypted = this.phoneCrypto.encrypt(
        this.phoneCrypto.format(normalized),
      );
      phoneHash = this.phoneCrypto.hash(normalized);
    }

    const updated = await this.prisma.adminAccount.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phoneEncrypted,
        phoneHash,
        accountType: dto.accountType,
        companyId,
        permGroup: dto.permGroup,
        useYn: dto.useYn,
        updatedBy: actingUsername,
      },
      include: { company: { select: { name: true } } },
    });

    return this.toListItem(updated);
  }
}
