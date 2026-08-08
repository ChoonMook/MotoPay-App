// POST /admin/companies/:id/partner-users 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class CreatePartnerUserDto {
  @ApiProperty({ example: 'shop01', description: '아이디' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'shop01@motopay.co.kr' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: '010-1234-5678' })
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 휴대폰번호 형식이 아닙니다.',
  })
  phone: string;
}
