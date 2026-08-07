// POST /admin/common-codes 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCommonCodeDto {
  @ApiProperty({ example: 'CAR_BRAND', description: '공통코드 그룹값(pk)' })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty({ example: '차량브랜드', description: '공통코드 그룹명' })
  @IsString()
  @MinLength(1)
  name: string;
}
