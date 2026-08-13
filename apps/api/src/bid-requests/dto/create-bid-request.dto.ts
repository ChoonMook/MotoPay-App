// POST /bid-requests 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const CAR_INST_VALUES = [
  'TINT',
  'PPF',
  'BBOX',
  'CCA',
  'UCOAT',
  'CLEAN',
  'EXTREP',
  'WHTIRE',
] as const;
export const TINT_POSITION_VALUES = [
  'FRONT',
  'SIDE_1',
  'SIDE_2',
  'REAR',
  'SUNROOF',
] as const;
export const VLT_VALUES = ['5', '15', '30'] as const;
const RADIUS_VALUES = [5, 10, 20] as const;

export class CreateBidRequestItemDto {
  @ApiProperty({
    enum: CAR_INST_VALUES,
    description:
      "시공 항목(일반입찰) 또는 관심 카테고리(전문가추천) -> CommonCodeDetail(code='CAR_INST')",
  })
  @IsIn(CAR_INST_VALUES)
  instCode: (typeof CAR_INST_VALUES)[number];

  @ApiPropertyOptional({
    description: '선택한 제품명(일반입찰만, 자유 텍스트 — 카탈로그 미연동)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productName?: string;
}

export class CreateBidRequestPositionDto {
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

export class CreateBidRequestDto {
  @ApiProperty({
    enum: ['GENERAL', 'EXPERT'],
    description: "요청유형 -> CommonCodeDetail(code='BID_REQ_TYPE')",
  })
  @IsIn(['GENERAL', 'EXPERT'])
  reqType: 'GENERAL' | 'EXPERT';

  @ApiProperty({
    example: '2026-08-10',
    description: '희망 시공일(YYYY-MM-DD)',
  })
  @IsString()
  @MinLength(1)
  desiredDate: string;

  @ApiProperty({ enum: RADIUS_VALUES, description: '검색 반경(km)' })
  @IsIn(RADIUS_VALUES)
  radiusKm: (typeof RADIUS_VALUES)[number];

  @ApiPropertyOptional({ description: '최소 평점 조건(0~5, 선택)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: '희망 예산(원, 전문가추천 전용)' })
  @IsOptional()
  @IsInt()
  @Min(10000)
  @Max(100000000)
  budget?: number;

  @ApiPropertyOptional({ description: '요청사항(전문가추천 전용)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    type: [CreateBidRequestItemDto],
    description: '시공 항목(일반입찰) 또는 관심 카테고리(전문가추천) 목록',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((item: CreateBidRequestItemDto) => item.instCode)
  @ValidateNested({ each: true })
  @Type(() => CreateBidRequestItemDto)
  items?: CreateBidRequestItemDto[];

  @ApiPropertyOptional({
    type: [CreateBidRequestPositionDto],
    description:
      '틴팅 부위별 농도 목록(일반입찰 + 썬팅(틴팅) 선택 시에만 유효)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((pos: CreateBidRequestPositionDto) => pos.position)
  @ValidateNested({ each: true })
  @Type(() => CreateBidRequestPositionDto)
  positions?: CreateBidRequestPositionDto[];
}
