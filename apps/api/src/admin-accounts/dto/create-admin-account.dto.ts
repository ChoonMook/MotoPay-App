// POST /admin/accounts 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
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

  @ApiProperty({
    description:
      "사용자유형 - CommonCodeDetail(code='CO_TYPE')의 detailCode 값(ADMIN/DEALER/SUPPLIER — SHOP 제외)",
    example: 'ADMIN',
  })
  @IsString()
  @MinLength(1)
  accountType: string;

  @ApiPropertyOptional({
    description: '소속업체 -> Company.id — accountType이 DEALER·SUPPLIER인 경우 필수(같은 업체구분의 업체만 선택 가능), ADMIN이면 지정 불가',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiProperty({
    description:
      "권한그룹 - CommonCodeDetail(code='PERM_GROUP')의 detailCode 값",
    example: 'SUPER_ADMIN',
  })
  @IsString()
  @MinLength(1)
  permGroup: string;
}
