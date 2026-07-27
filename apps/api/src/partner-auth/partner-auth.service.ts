// 파트너(시공업체) 로그인/비밀번호 변경 — User(일반고객)와 완전히 분리된 별도 인증 realm
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import type { PartnerChangePasswordDto } from './dto/partner-change-password.dto';
import type {
  JwtPartnerPayload,
  PartnerAuthTokens,
  SafePartnerUser,
} from './partner-auth.types';
import { toSafePartnerUser } from './to-safe-partner-user';

const SALT_ROUNDS = 10;

@Injectable()
export class PartnerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly phoneCrypto: PhoneCryptoService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<PartnerAuthTokens & { partnerUser: SafePartnerUser }> {
    const partnerUser = await this.prisma.partnerUser.findUnique({
      where: { username },
      include: { shop: { select: { name: true } } },
    });
    if (!partnerUser || !partnerUser.useYn) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      partnerUser.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const updated = await this.prisma.partnerUser.update({
      where: { id: partnerUser.id },
      data: { lastLoginAt: new Date() },
      include: { shop: { select: { name: true } } },
    });

    return {
      ...this.issueTokens({
        sub: updated.id,
        username: updated.username,
        type: 'partner',
      }),
      partnerUser: toSafePartnerUser(updated, this.phoneCrypto),
    };
  }

  async findSafePartnerUserById(id: string): Promise<SafePartnerUser | null> {
    const partnerUser = await this.prisma.partnerUser.findUnique({
      where: { id },
      include: { shop: { select: { name: true } } },
    });
    return partnerUser
      ? toSafePartnerUser(partnerUser, this.phoneCrypto)
      : null;
  }

  async changePassword(
    partnerUserId: string,
    dto: PartnerChangePasswordDto,
  ): Promise<void> {
    const partnerUser = await this.prisma.partnerUser.findUnique({
      where: { id: partnerUserId },
    });
    if (!partnerUser) {
      throw new NotFoundException('파트너 계정을 찾을 수 없습니다.');
    }

    const currentMatches = await bcrypt.compare(
      dto.currentPassword,
      partnerUser.passwordHash,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.partnerUser.update({
      where: { id: partnerUserId },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  private issueTokens(payload: JwtPartnerPayload): PartnerAuthTokens {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_PARTNER_ACCESS_SECRET'),
      expiresIn: Number(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      ),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_PARTNER_REFRESH_SECRET'),
      expiresIn: Number(
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      ),
    });
    return { accessToken, refreshToken };
  }
}
