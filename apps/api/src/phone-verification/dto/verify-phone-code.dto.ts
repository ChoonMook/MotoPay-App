// POST /phone-verification/verify-code 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { PhoneVerifyPurpose } from '@prisma/client';

export class VerifyPhoneCodeDto {
  @ApiProperty({ example: '010-1234-5678', description: '휴대폰번호(하이픈 있어도/없어도 됨)' })
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 휴대폰번호 형식이 아닙니다.',
  })
  phone: string;

  @ApiProperty({ example: '123456', description: '인증번호 6자리' })
  @IsString()
  @Matches(/^\d{6}$/, { message: '인증번호는 숫자 6자리여야 합니다.' })
  code: string;

  @ApiProperty({ enum: PhoneVerifyPurpose, description: '인증 목적' })
  @IsEnum(PhoneVerifyPurpose)
  purpose: PhoneVerifyPurpose;
}
