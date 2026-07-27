// JwtAuthGuard 통과 후 req.user(JwtStrategy.validate 반환값)를 꺼내는 헬퍼 데코레이터
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SafeUser } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SafeUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: SafeUser }>();
    return request.user;
  },
);
