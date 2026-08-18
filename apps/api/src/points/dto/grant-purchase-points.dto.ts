// POST /admin/points/grant-purchase 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class GrantPurchasePointsItemDto {
  @ApiProperty({ description: '신차 구매내역 VIN' })
  @IsString()
  @MinLength(1)
  vin: string;

  @ApiProperty({ description: '지급 포인트(원, 1 이상)' })
  @IsInt()
  @Min(1)
  amount: number;
}

export class GrantPurchasePointsDto {
  @ApiProperty({ type: [GrantPurchasePointsItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GrantPurchasePointsItemDto)
  items: GrantPurchasePointsItemDto[];

  @ApiProperty({ description: '지급 사유(필수)' })
  @IsString()
  @MinLength(1)
  reason: string;
}
