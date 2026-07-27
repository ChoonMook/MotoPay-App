// 로그인/회원가입/아이디·비밀번호 찾기 검증과 JWT 발급을 담당
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CarsService } from '../cars/cars.service';
import { maskUsername } from '../common/mask/mask-username';
import { PhoneCryptoService } from '../common/crypto/phone-crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AuthTokens,
  JwtPayload,
  ResetTokenPayload,
  SafeUser,
} from './auth.types';
import type { SignupDto } from './dto/signup.dto';
import { toSafeUser as buildSafeUser } from './to-safe-user';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly phoneCrypto: PhoneCryptoService,
    private readonly carsService: CarsService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<AuthTokens & { user: SafeUser }> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...this.issueTokens(this.toPayload(updated)),
      user: this.toSafeUser(updated),
    };
  }

  async signup(dto: SignupDto): Promise<AuthTokens & { user: SafeUser }> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const normalizedPhone = this.phoneCrypto.normalize(dto.phone);
    // 저장·반환용은 "000-0000-0000" 형식으로 통일, 검색용 해시는 하이픈 유무와 무관하게 항상 정규화된 숫자만 사용
    const phoneEncrypted = this.phoneCrypto.encrypt(
      this.phoneCrypto.format(normalizedPhone),
    );
    const phoneHash = this.phoneCrypto.hash(normalizedPhone);

    const existingPhone = await this.prisma.user.findFirst({
      where: { phoneHash },
    });
    if (existingPhone) {
      throw new ConflictException('이미 가입된 휴대폰번호입니다.');
    }

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          username: dto.username,
          passwordHash,
          name: dto.name,
          email: dto.email,
          phoneEncrypted,
          phoneHash,
          role: 'CUSTOMER', // 회원가입 API는 일반고객 전용 — role은 클라이언트가 지정할 수 없음
          agreedTerms: dto.agreedTerms,
          agreedPrivacy: dto.agreedPrivacy,
          agreedMarketingSms: dto.agreedMarketingSms ?? false,
          agreedMarketingEmail: dto.agreedMarketingEmail ?? false,
          agreedMarketingPush: dto.agreedMarketingPush ?? false,
          lastLoginAt: new Date(), // 가입 직후 자동 로그인 처리하므로 최초 로그인 일시로 기록
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('이미 사용 중인 아이디입니다.');
      }
      throw err;
    }

    // 신차 구매 고객 정보(딜러사 등록분)에 이름+휴대폰이 일치하는 미매핑 건이 있으면 자동 매핑 + 내 차량 정보 등록
    await this.carsService.mapNewCarPurchase(user.id, user.name, phoneHash);

    return {
      ...this.issueTokens(this.toPayload(user)),
      user: this.toSafeUser(user),
    };
  }

  async findSafeUserById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toSafeUser(user) : null;
  }

  /** 아이디 찾기 — 휴대폰번호로 계정을 찾아 마스킹된 아이디를 반환 */
  async findUsernameByPhone(phone: string): Promise<{ username: string }> {
    const user = await this.findUserByPhoneOrThrow(phone);
    return { username: maskUsername(user.username) };
  }

  /** 비밀번호 찾기 1단계 — 휴대폰번호로 계정을 찾아 짧게 유효한 재설정 토큰을 발급 */
  async issuePasswordResetToken(
    phone: string,
  ): Promise<{ resetToken: string }> {
    const user = await this.findUserByPhoneOrThrow(phone);
    const payload: ResetTokenPayload = {
      sub: user.id,
      purpose: 'password-reset',
    };
    const resetToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_RESET_SECRET'),
      expiresIn: Number(this.configService.get<string>('JWT_RESET_EXPIRES_IN')),
    });
    return { resetToken };
  }

  /** 비밀번호 찾기 2단계 — 재설정 토큰을 검증하고 새 비밀번호로 교체 */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    let payload: ResetTokenPayload;
    try {
      payload = this.jwtService.verify<ResetTokenPayload>(resetToken, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        '인증이 만료되었거나 유효하지 않습니다. 처음부터 다시 시도해주세요.',
      );
    }
    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('유효하지 않은 요청입니다.');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });
  }

  private async findUserByPhoneOrThrow(phone: string): Promise<User> {
    const normalizedPhone = this.phoneCrypto.normalize(phone);
    const phoneHash = this.phoneCrypto.hash(normalizedPhone);
    const user = await this.prisma.user.findFirst({ where: { phoneHash } });
    if (!user) {
      throw new NotFoundException(
        '해당 휴대폰번호로 가입된 계정을 찾을 수 없습니다.',
      );
    }
    return user;
  }

  private toPayload(user: User): JwtPayload {
    return { sub: user.id, username: user.username, role: user.role };
  }

  private toSafeUser(user: User): SafeUser {
    return buildSafeUser(user, this.phoneCrypto);
  }

  /** 아이디 중복확인(회원가입 화면의 "중복확인" 버튼용) */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return !user;
  }

  private issueTokens(payload: JwtPayload): AuthTokens {
    // .env 값은 항상 문자열이라 Number()로 실제 숫자(초)로 변환
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: Number(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      ),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: Number(
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      ),
    });
    return { accessToken, refreshToken };
  }
}
