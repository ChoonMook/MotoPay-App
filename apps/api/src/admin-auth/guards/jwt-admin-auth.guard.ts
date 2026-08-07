// 보호된 관리자 라우트에 @UseGuards(JwtAdminAuthGuard)로 부착
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAdminAuthGuard extends AuthGuard('jwt-admin') {}
