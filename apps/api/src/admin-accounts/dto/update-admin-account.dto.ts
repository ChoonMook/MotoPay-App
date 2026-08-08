// PATCH /admin/accounts/:id 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminAccountType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class UpdateAdminAccountDto {
  @ApiPropertyOptional({ example: '홍길동' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

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

  @ApiPropertyOptional({ enum: AdminAccountType })
  @IsOptional()
  @IsEnum(AdminAccountType)
  accountType?: AdminAccountType;

  @ApiPropertyOptional({
    description:
      "권한그룹 - CommonCodeDetail(code='PERM_GROUP')의 detailCode 값",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  permGroup?: string;

  @ApiPropertyOptional({ description: '상태(사용/비활성화)' })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;
}
