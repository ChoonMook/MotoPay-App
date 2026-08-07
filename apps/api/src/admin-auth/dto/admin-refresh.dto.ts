// POST /admin-auth/refresh 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminRefreshDto {
  @ApiProperty({ description: '로그인 시 발급받은 refreshToken' })
  @IsString()
  refreshToken: string;
}
