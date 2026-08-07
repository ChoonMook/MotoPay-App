// JwtAdminAuthGuard 통과 후 req.user(JwtAdminStrategy.validate 반환값)를 꺼내는 헬퍼 데코레이터
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SafeAdminAccount } from '../admin-auth.types';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SafeAdminAccount => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: SafeAdminAccount }>();
    return request.user;
  },
);
