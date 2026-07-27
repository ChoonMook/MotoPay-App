// POST /partner-auth/login 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class PartnerLoginDto {
  @ApiProperty({ example: 'shopowner01', description: '아이디' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: 'Initial1234!', description: '비밀번호' })
  @IsString()
  @MinLength(1)
  password: string;
}
