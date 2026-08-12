// PUT /admin/products/:id/bundle-items 요청 바디 검증
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BundleItemInputDto {
  @ApiProperty({ description: '구성상품 상품코드 -> Product.productCode(prodType=SVC 또는 GOODS)' })
  @IsString()
  @MinLength(1)
  componentCode: string;

  @ApiProperty({ enum: ['BASIC', 'OPTION', 'ADD'], description: '구성상품 유형 -> CommonCodeDetail(code=BUNDLE_ITEM_TYPE)' })
  @IsIn(['BASIC', 'OPTION', 'ADD'])
  itemType: string;

  @ApiPropertyOptional({ description: '이 패키지 안에서 적용할 가격(원) — 비우면 구성상품 자체 판매가를 그대로 사용' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiProperty({ description: '수량', default: 1 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ description: '표시 순서(같은 유형 그룹 내 상대 순서)' })
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class SetProductBundleItemsDto {
  @ApiProperty({ type: [BundleItemInputDto], description: '패키지 구성상품 전체 목록(통째로 교체 저장)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemInputDto)
  items: BundleItemInputDto[];
}
