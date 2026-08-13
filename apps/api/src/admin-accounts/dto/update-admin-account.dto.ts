// PATCH /admin/accounts/:id 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
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

  @ApiPropertyOptional({
    description:
      "사용자유형 - CommonCodeDetail(code='CO_TYPE')의 detailCode 값(ADMIN/DEALER/SUPPLIER — SHOP 제외)",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  accountType?: string;

  @ApiPropertyOptional({
    description:
      '소속업체 -> Company.id — accountType이 DEALER·SUPPLIER인 경우 필수(같은 업체구분의 업체만 선택 가능), ADMIN이면 지정 불가',
  })
  @IsOptional()
  @IsInt()
  companyId?: number | null;

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
