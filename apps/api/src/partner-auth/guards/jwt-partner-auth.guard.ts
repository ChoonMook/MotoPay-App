// 보호된 파트너 라우트에 @UseGuards(JwtPartnerAuthGuard)로 부착
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtPartnerAuthGuard extends AuthGuard('jwt-partner') {}
