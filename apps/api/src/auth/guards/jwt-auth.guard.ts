// 보호된 라우트에 @UseGuards(JwtAuthGuard)로 부착
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
