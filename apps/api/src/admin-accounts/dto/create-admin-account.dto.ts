// POST /admin/accounts 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminAccountType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateAdminAccountDto {
  @ApiProperty({ example: 'ops01', description: '아이디' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'ops01@motopay.co.kr' })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @ApiPropertyOptional({ example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 휴대폰번호 형식이 아닙니다.',
  })
  phone?: string;

  @ApiProperty({ enum: AdminAccountType, example: 'ADMIN' })
  @IsEnum(AdminAccountType)
  accountType: AdminAccountType;

  @ApiProperty({
    description:
      "권한그룹 - CommonCodeDetail(code='PERM_GROUP')의 detailCode 값",
    example: 'SUPER_ADMIN',
  })
  @IsString()
  @MinLength(1)
  permGroup: string;
}
