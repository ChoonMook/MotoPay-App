// POST /admin/products 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'SVC',
    description: '상품유형 -> CommonCodeDetail(code=PROD_TYPE)',
  })
  @IsString()
  @MinLength(1)
  prodType: string;

  @ApiPropertyOptional({
    description: '브랜드 -> CommonCodeDetail(code=PROD_BRAND)',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: '상품분류 -> CommonCodeDetail(code=PROD_CAT)',
  })
  @IsOptional()
  @IsString()
  prodCat?: string;

  @ApiPropertyOptional({
    description:
      '딜러사 -> Company.id(coType=DEALER) — 패키지(PKG) 상품만 값을 가짐',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  dealerCompanyId?: number;

  @ApiProperty({ description: '상품명' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: '판매가(원) — 소비자가' })
  @IsInt()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: '정가(할인 전 가격)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  originPrice?: number;

  @ApiPropertyOptional({
    description:
      '공급가(원) — 원가. SUPER_ADMIN·SETTLEMENT 권한 관리자의 요청만 실제로 저장됨',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  supplyPrice?: number;

  @ApiPropertyOptional({ description: '상품설명(HTML)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '판매여부', default: true })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;

  @ApiPropertyOptional({ description: '신차패키지 적용여부', default: true })
  @IsOptional()
  @IsBoolean()
  ncpApplicable?: boolean;

  @ApiPropertyOptional({ description: '예약시공 적용여부', default: true })
  @IsOptional()
  @IsBoolean()
  bidApplicable?: boolean;
}
