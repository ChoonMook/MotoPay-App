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

export interface AdminAccountListItem {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  accountType: AdminAccount['accountType'];
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

  private toListItem(account: AdminAccount): AdminAccountListItem {
    return {
      id: account.id,
      username: account.username,
      name: account.name,
      email: account.email,
      phone: account.phoneEncrypted
        ? this.phoneCrypto.decrypt(account.phoneEncrypted)
        : null,
      accountType: account.accountType,
      permGroup: account.permGroup,
      useYn: account.useYn,
      createdBy: account.createdBy,
      updatedBy: account.updatedBy,
      lastLoginAt: account.lastLoginAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async list(): Promise<AdminAccountListItem[]> {
    const accounts = await this.prisma.adminAccount.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return accounts.map((a) => this.toListItem(a));
  }

  /** 계정 추가 화면에서 아이디 입력 직후 중복 여부를 미리 확인하기 위한 조회 */
  async checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
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
        permGroup: dto.permGroup,
        createdBy: actingUsername,
      },
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
        permGroup: dto.permGroup,
        useYn: dto.useYn,
        updatedBy: actingUsername,
      },
    });

    return this.toListItem(updated);
  }
}
