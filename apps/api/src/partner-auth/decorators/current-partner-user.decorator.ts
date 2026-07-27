// JwtPartnerAuthGuard 통과 후 req.user(JwtPartnerStrategy.validate 반환값)를 꺼내는 헬퍼 데코레이터
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SafePartnerUser } from '../partner-auth.types';

export const CurrentPartnerUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SafePartnerUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: SafePartnerUser }>();
    return request.user;
  },
);
