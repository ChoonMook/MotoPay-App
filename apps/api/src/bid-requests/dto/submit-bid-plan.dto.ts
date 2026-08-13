// POST /shops/me/bid-requests/:requestNo/plans 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  CAR_INST_VALUES,
  TINT_POSITION_VALUES,
  VLT_VALUES,
} from './create-bid-request.dto';

export class SubmitBidPlanItemDto {
  @ApiProperty({
    enum: CAR_INST_VALUES,
    description:
      "관심 카테고리 -> CommonCodeDetail(code='CAR_INST'), 요청의 관심 카테고리와 정확히 일치해야 함",
  })
  @IsIn(CAR_INST_VALUES)
  instCode: (typeof CAR_INST_VALUES)[number];

  @ApiPropertyOptional({
    description: '추천 상품 -> Product.productCode(카탈로그에서 고른 경우)',
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiProperty({ description: '상품명 스냅샷' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  productName: string;

  @ApiProperty({ description: '소비자가(정가, 원)' })
  @IsInt()
  @Min(0)
  @Max(100000000)
  retailPrice: number;

  @ApiProperty({ description: '제안가(원)' })
  @IsInt()
  @Min(1)
  @Max(100000000)
  offerPrice: number;
}

export class SubmitBidPlanPositionDto {
  @ApiProperty({
    enum: TINT_POSITION_VALUES,
    description: "틴팅 시공 부위 -> CommonCodeDetail(code='BID_TINT_POSITION')",
  })
  @IsIn(TINT_POSITION_VALUES)
  position: (typeof TINT_POSITION_VALUES)[number];

  @ApiProperty({
    enum: VLT_VALUES,
    description: "틴팅 농도 -> CommonCodeDetail(code='VLT')",
  })
  @IsIn(VLT_VALUES)
  level: (typeof VLT_VALUES)[number];
}

export class SubmitBidPlanDto {
  @ApiProperty({
    type: [SubmitBidPlanItemDto],
    description: '관심 카테고리별 추천 상품·가격',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: SubmitBidPlanItemDto) => item.instCode)
  @ValidateNested({ each: true })
  @Type(() => SubmitBidPlanItemDto)
  items: SubmitBidPlanItemDto[];

  @ApiPropertyOptional({
    type: [SubmitBidPlanPositionDto],
    description:
      '틴팅 부위별 농도 추천(관심 카테고리에 TINT를 포함한 경우에만 유효)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((pos: SubmitBidPlanPositionDto) => pos.position)
  @ValidateNested({ each: true })
  @Type(() => SubmitBidPlanPositionDto)
  positions?: SubmitBidPlanPositionDto[];

  @ApiProperty({
    example: '14:00',
    description:
      '시공 예정 시각(HH:mm) — 요청의 희망일(desiredDate) 기준 업체 실제 예약 가능 시간 중 하나',
  })
  @IsString()
  scheduledTime: string;

  @ApiProperty({ description: '추천 사유' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  reason: string;
}
