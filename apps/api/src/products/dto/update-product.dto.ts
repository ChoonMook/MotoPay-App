// PATCH /admin/products/:id 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ description: '상품유형 -> CommonCodeDetail(code=PROD_TYPE)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  prodType?: string;

  @ApiPropertyOptional({ description: '브랜드 -> CommonCodeDetail(code=PROD_BRAND)' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: '상품분류 -> CommonCodeDetail(code=PROD_CAT)' })
  @IsOptional()
  @IsString()
  prodCat?: string;

  @ApiPropertyOptional({ description: '딜러사 -> CommonCodeDetail(code=DEALER)' })
  @IsOptional()
  @IsString()
  dealerCode?: string;

  @ApiPropertyOptional({ description: '상품명' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: '판매가(원) — 소비자가' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: '정가(할인 전 가격)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  originPrice?: number;

  @ApiPropertyOptional({
    description: '공급가(원) — 원가. SUPER_ADMIN·SETTLEMENT 권한 관리자의 요청만 실제로 반영됨',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  supplyPrice?: number;

  @ApiPropertyOptional({ description: '상품설명(HTML)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '판매여부' })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;

  @ApiPropertyOptional({ description: '신차패키지 적용여부' })
  @IsOptional()
  @IsBoolean()
  ncpApplicable?: boolean;

  @ApiPropertyOptional({ description: '예약시공 적용여부' })
  @IsOptional()
  @IsBoolean()
  bidApplicable?: boolean;
}
