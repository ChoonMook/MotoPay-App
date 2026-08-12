// PATCH /admin/new-car-purchases/:vin 요청 바디 검증 — VIN·딜러사코드는 등록 후 변경 불가(수정 대상에서 제외)
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateNewCarPurchaseDto {
  @ApiPropertyOptional({ description: '고객명' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  customerName?: string;

  @ApiPropertyOptional({ description: '휴대폰번호(형식 무관 — 서버가 정규화 후 암호화 저장)' })
  @IsOptional()
  @IsString()
  @MinLength(9)
  phone?: string;

  @ApiPropertyOptional({ description: '차량브랜드코드 -> CommonCodeDetail(code=CAR_BRAND)' })
  @IsOptional()
  @IsString()
  carBrandCode?: string;

  @ApiPropertyOptional({ description: '차종코드 -> CommonCodeDetail(code=CAR_MODEL)' })
  @IsOptional()
  @IsString()
  carModelCode?: string;

  @ApiPropertyOptional({ description: '세부차종명' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  trimName?: string;

  @ApiPropertyOptional({ description: '연식' })
  @IsOptional()
  @IsString()
  modelYear?: string;

  @ApiPropertyOptional({ description: '구매일(YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: '패키지상품코드 -> Product.productCode(prodType=PKG)' })
  @IsOptional()
  @IsString()
  packageCode?: string;

  @ApiPropertyOptional({ description: '패키지 구성상품 중 선택한 업그레이드옵션·추가옵션 상품코드 목록(전달 시 통째로 교체)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  componentCodes?: string[];
}
