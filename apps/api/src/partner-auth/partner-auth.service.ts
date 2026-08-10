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
import type { PartnerUser } from '@prisma/client';
import { maskUsername } from '../common/mask/mask-username';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import type { PartnerChangePasswordDto } from './dto/partner-change-password.dto';
import type {
  JwtPartnerPayload,
  PartnerAuthTokens,
  PartnerResetTokenPayload,
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

    // 소속 업체(Company)가 관리자 승인을 받아야 정상 로그인 가능 — 미승인이면 계정 자체는 유효해도 로그인 차단
    const company = await this.prisma.company.findUnique({
      where: { shopCode: partnerUser.shopCode },
      select: { approved: true },
    });
    if (!company || !company.approved) {
      throw new UnauthorizedException(
        '소속 업체가 아직 승인되지 않았습니다. 관리자에게 문의해주세요.',
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

  /** accessToken 만료 시 refreshToken으로 access/refresh 토큰을 재발급(rotation) — refreshToken도 만료·무효면 재로그인 필요 */
  async refresh(refreshToken: string): Promise<PartnerAuthTokens> {
    let payload: JwtPartnerPayload;
    try {
      payload = this.jwtService.verify<JwtPartnerPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_PARTNER_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        '로그인이 만료되었습니다. 다시 로그인해주세요.',
      );
    }

    const partnerUser = await this.prisma.partnerUser.findUnique({
      where: { id: payload.sub },
    });
    if (!partnerUser || !partnerUser.useYn) {
      throw new UnauthorizedException(
        '로그인이 만료되었습니다. 다시 로그인해주세요.',
      );
    }

    return this.issueTokens({
      sub: partnerUser.id,
      username: partnerUser.username,
      type: 'partner',
    });
  }

  /** 아이디 찾기 — 휴대폰번호로 계정을 찾아 마스킹된 아이디를 반환 */
  async findUsernameByPhone(phone: string): Promise<{ username: string }> {
    const partnerUser = await this.findPartnerUserByPhoneOrThrow(phone);
    return { username: maskUsername(partnerUser.username) };
  }

  /** 비밀번호 찾기 1단계 — 아이디+휴대폰번호가 같은 계정을 가리킬 때만 짧게 유효한 재설정 토큰을 발급 */
  async issuePasswordResetToken(
    username: string,
    phone: string,
  ): Promise<{ resetToken: string }> {
    const normalizedPhone = this.phoneCrypto.normalize(phone);
    const phoneHash = this.phoneCrypto.hash(normalizedPhone);
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { username, phoneHash },
    });
    if (!partnerUser || !partnerUser.useYn) {
      throw new NotFoundException(
        '아이디와 휴대폰번호가 일치하는 계정을 찾을 수 없습니다.',
      );
    }

    const payload: PartnerResetTokenPayload = {
      sub: partnerUser.id,
      purpose: 'password-reset',
    };
    const resetToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_PARTNER_RESET_SECRET'),
      expiresIn: Number(this.configService.get<string>('JWT_RESET_EXPIRES_IN')),
    });
    return { resetToken };
  }

  /** 비밀번호 찾기 2단계 — 재설정 토큰을 검증하고 새 비밀번호로 교체(최초 로그인 강제 변경 상태도 함께 해제) */
  async resetPasswordWithToken(
    resetToken: string,
    newPassword: string,
  ): Promise<void> {
    let payload: PartnerResetTokenPayload;
    try {
      payload = this.jwtService.verify<PartnerResetTokenPayload>(resetToken, {
        secret: this.configService.get<string>('JWT_PARTNER_RESET_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        '인증이 만료되었거나 유효하지 않습니다. 처음부터 다시 시도해주세요.',
      );
    }
    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('유효하지 않은 요청입니다.');
    }

    const partnerUser = await this.prisma.partnerUser.findUnique({
      where: { id: payload.sub },
    });
    if (!partnerUser) {
      throw new NotFoundException('파트너 계정을 찾을 수 없습니다.');
    }

    const isSameAsCurrent = await bcrypt.compare(newPassword, partnerUser.passwordHash);
    if (isSameAsCurrent) {
      throw new BadRequestException('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.partnerUser.update({
      where: { id: payload.sub },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  private async findPartnerUserByPhoneOrThrow(
    phone: string,
  ): Promise<PartnerUser> {
    const normalizedPhone = this.phoneCrypto.normalize(phone);
    const phoneHash = this.phoneCrypto.hash(normalizedPhone);
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { phoneHash },
    });
    if (!partnerUser || !partnerUser.useYn) {
      throw new NotFoundException(
        '해당 휴대폰번호로 등록된 파트너 계정을 찾을 수 없습니다.',
      );
    }
    return partnerUser;
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
