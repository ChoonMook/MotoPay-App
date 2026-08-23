// PUT /admin/settlements/products/:productCode/commissions 요청 바디 검증
// — 상품별 수수료 예외(AD-STL-02) 전체 교체 저장, 배열에 포함된 시공업체만 예외로 유지
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductShopCommissionItemDto {
  @ApiProperty({ description: '시공업체 -> Shop.shopCode' })
  @IsString()
  @MinLength(1)
  shopCode: string;

  @ApiProperty({
    enum: ['FIXED', 'RATE'],
    description: "수수료 방식 -> CommonCodeDetail(code='COMMISSION_TYPE')",
  })
  @IsIn(['FIXED', 'RATE'])
  commissionType: string;

  @ApiProperty({ required: false, description: "정액 수수료(원) — commissionType='FIXED'일 때만 사용" })
  @IsOptional()
  @IsInt()
  @Min(0)
  commissionAmount?: number;

  @ApiProperty({ required: false, description: "정률 수수료(%) — commissionType='RATE'일 때만 사용" })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionRate?: number;
}

export class SetProductShopCommissionsDto {
  @ApiProperty({ type: [ProductShopCommissionItemDto] })
  @IsArray()
  @ArrayUnique((item: ProductShopCommissionItemDto) => item.shopCode)
  @ValidateNested({ each: true })
  @Type(() => ProductShopCommissionItemDto)
  items: ProductShopCommissionItemDto[];
}
