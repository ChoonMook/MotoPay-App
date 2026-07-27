// Authorization: Bearer <accessToken> 헤더를 검증하는 파트너 전용 passport 전략 — 이름을 'jwt-partner'로 지정해
// 일반고객용 JwtStrategy(기본 이름 'jwt')와 전략 레지스트리에서 충돌하지 않도록 분리
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PartnerAuthService } from '../partner-auth.service';
import type { JwtPartnerPayload, SafePartnerUser } from '../partner-auth.types';

@Injectable()
export class JwtPartnerStrategy extends PassportStrategy(
  Strategy,
  'jwt-partner',
) {
  constructor(
    configService: ConfigService,
    private readonly partnerAuthService: PartnerAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_PARTNER_ACCESS_SECRET',
      ) as string,
    });
  }

  async validate(payload: JwtPartnerPayload): Promise<SafePartnerUser> {
    const partnerUser = await this.partnerAuthService.findSafePartnerUserById(
      payload.sub,
    );
    if (!partnerUser) {
      throw new UnauthorizedException('존재하지 않는 파트너 계정입니다.');
    }
    return partnerUser;
  }
}
