// 관리자(admin-app) 로그인/토큰 재발급 — User(일반고객)/PartnerUser(시공업체)와 완전히 분리된 별도 인증 realm
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminAuthTokens,
  JwtAdminPayload,
  SafeAdminAccount,
} from './admin-auth.types';
import { toSafeAdminAccount } from './to-safe-admin-account';
import type { UpdateAdminMeDto } from './dto/update-admin-me.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<AdminAuthTokens & { adminAccount: SafeAdminAccount }> {
    const adminAccount = await this.prisma.adminAccount.findUnique({
      where: { username },
    });
    if (!adminAccount || !adminAccount.useYn) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      adminAccount.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const updated = await this.prisma.adminAccount.update({
      where: { id: adminAccount.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...this.issueTokens({
        sub: updated.id,
        username: updated.username,
        type: 'admin',
      }),
      adminAccount: toSafeAdminAccount(updated, this.phoneCrypto),
    };
  }

  /** 내 정보 수정 — 이메일·휴대폰번호·비밀번호(선택) 중 전달된 값만 갱신 */
  async updateMe(
    adminId: string,
    dto: UpdateAdminMeDto,
  ): Promise<SafeAdminAccount> {
    let phoneEncrypted: string | undefined;
    let phoneHash: string | undefined;
    if (dto.phone) {
      const normalized = this.phoneCrypto.normalize(dto.phone);
      phoneEncrypted = this.phoneCrypto.encrypt(
        this.phoneCrypto.format(normalized),
      );
      phoneHash = this.phoneCrypto.hash(normalized);
    }

    const passwordHash = dto.newPassword
      ? await bcrypt.hash(dto.newPassword, SALT_ROUNDS)
      : undefined;

    const updated = await this.prisma.adminAccount.update({
      where: { id: adminId },
      data: {
        email: dto.email,
        phoneEncrypted,
        phoneHash,
        passwordHash,
      },
    });

    return toSafeAdminAccount(updated, this.phoneCrypto);
  }

  async findSafeAdminAccountById(id: string): Promise<SafeAdminAccount | null> {
    const adminAccount = await this.prisma.adminAccount.findUnique({
      where: { id },
    });
    if (!adminAccount || !adminAccount.useYn) return null;
    return toSafeAdminAccount(adminAccount, this.phoneCrypto);
  }

  /** accessToken 만료 시 refreshToken으로 access/refresh 토큰을 재발급(rotation) — refreshToken도 만료·무효면 재로그인 필요 */
  async refresh(refreshToken: string): Promise<AdminAuthTokens> {
    let payload: JwtAdminPayload;
    try {
      payload = this.jwtService.verify<JwtAdminPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_ADMIN_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        '로그인이 만료되었습니다. 다시 로그인해주세요.',
      );
    }

    const adminAccount = await this.prisma.adminAccount.findUnique({
      where: { id: payload.sub },
    });
    if (!adminAccount || !adminAccount.useYn) {
      throw new UnauthorizedException(
        '로그인이 만료되었습니다. 다시 로그인해주세요.',
      );
    }

    return this.issueTokens({
      sub: adminAccount.id,
      username: adminAccount.username,
      type: 'admin',
    });
  }

  private issueTokens(payload: JwtAdminPayload): AdminAuthTokens {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ADMIN_ACCESS_SECRET'),
      expiresIn: Number(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      ),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ADMIN_REFRESH_SECRET'),
      expiresIn: Number(
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      ),
    });
    return { accessToken, refreshToken };
  }
}
