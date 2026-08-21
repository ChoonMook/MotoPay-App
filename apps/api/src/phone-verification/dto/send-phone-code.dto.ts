// POST /phone-verification/send-code 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { PhoneVerifyPurpose } from '@prisma/client';

export class SendPhoneCodeDto {
  @ApiProperty({ example: '010-1234-5678', description: '휴대폰번호(하이픈 있어도/없어도 됨)' })
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 휴대폰번호 형식이 아닙니다.',
  })
  phone: string;

  @ApiProperty({ enum: PhoneVerifyPurpose, description: '인증 목적' })
  @IsEnum(PhoneVerifyPurpose)
  purpose: PhoneVerifyPurpose;
}
