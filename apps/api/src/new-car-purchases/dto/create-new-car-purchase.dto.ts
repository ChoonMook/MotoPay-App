// POST /admin/new-car-purchases 요청 바디 검증 (DL-NCPK-02 직접입력 폼)
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateNewCarPurchaseDto {
  @ApiProperty({ description: '차대번호(VIN, 17자리) — 이 구매건의 고유키' })
  @IsString()
  @Length(17, 17)
  vin: string;

  @ApiProperty({ description: '딜러사코드 -> CommonCodeDetail(code=DEALER)' })
  @IsString()
  @MinLength(1)
  dealerCode: string;

  @ApiProperty({ description: '고객명' })
  @IsString()
  @MinLength(1)
  customerName: string;

  @ApiProperty({ description: '휴대폰번호(형식 무관 — 서버가 정규화 후 암호화 저장)' })
  @IsString()
  @MinLength(9)
  phone: string;

  @ApiProperty({ description: '차량브랜드코드 -> CommonCodeDetail(code=CAR_BRAND)' })
  @IsString()
  @MinLength(1)
  carBrandCode: string;

  @ApiProperty({ description: '차종코드 -> CommonCodeDetail(code=CAR_MODEL)' })
  @IsString()
  @MinLength(1)
  carModelCode: string;

  @ApiProperty({ description: '세부차종명(자유 텍스트, 예: "E 200")' })
  @IsString()
  @MinLength(1)
  trimName: string;

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

  @ApiPropertyOptional({
    description: '패키지 구성상품 중 고객이 선택한 업그레이드옵션(OPTION)·추가옵션(ADD) 상품코드 목록(기본상품은 항상 포함이라 제외)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  componentCodes?: string[];
}
