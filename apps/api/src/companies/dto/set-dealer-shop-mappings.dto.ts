// PUT /admin/companies/:id/shop-mappings 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetDealerShopMappingsDto {
  @ApiProperty({ description: '이 딜러사가 안내 가능한 시공업체 목록 -> Shop.shopCode' })
  @IsArray()
  @IsString({ each: true })
  shopCodes: string[];
}
