// Authorization: Bearer <accessToken> 헤더를 검증하는 관리자 전용 passport 전략 — 이름을 'jwt-admin'으로 지정해
// 일반고객용 JwtStrategy('jwt')·파트너용 JwtPartnerStrategy('jwt-partner')와 전략 레지스트리에서 충돌하지 않도록 분리
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminAuthService } from '../admin-auth.service';
import type { JwtAdminPayload, SafeAdminAccount } from '../admin-auth.types';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    configService: ConfigService,
    private readonly adminAuthService: AdminAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ADMIN_ACCESS_SECRET',
      ) as string,
    });
  }

  async validate(payload: JwtAdminPayload): Promise<SafeAdminAccount> {
    const adminAccount = await this.adminAuthService.findSafeAdminAccountById(
      payload.sub,
    );
    if (!adminAccount) {
      throw new UnauthorizedException('존재하지 않는 관리자 계정입니다.');
    }
    return adminAccount;
  }
}
