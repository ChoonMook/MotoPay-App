// POST /shops/me/bid-requests/:requestNo/offers 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { CAR_INST_VALUES } from './create-bid-request.dto';

export class SubmitBidOfferItemDto {
  @ApiProperty({
    enum: CAR_INST_VALUES,
    description: "시공 항목 -> CommonCodeDetail(code='CAR_INST'), 요청의 시공 항목과 정확히 일치해야 함",
  })
  @IsIn(CAR_INST_VALUES)
  instCode: (typeof CAR_INST_VALUES)[number];

  @ApiProperty({ description: '이 항목의 견적가(원)' })
  @IsInt()
  @Min(1)
  @Max(100000000)
  price: number;
}

export class SubmitBidOfferDto {
  @ApiProperty({ type: [SubmitBidOfferItemDto], description: '시공 항목별 견적' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: SubmitBidOfferItemDto) => item.instCode)
  @ValidateNested({ each: true })
  @Type(() => SubmitBidOfferItemDto)
  items: SubmitBidOfferItemDto[];

  @ApiProperty({ example: '14:00', description: '시공 예정 시각(HH:mm) — 요청의 희망일(desiredDate) 기준 업체 실제 예약 가능 시간 중 하나' })
  @IsString()
  scheduledTime: string;

  @ApiPropertyOptional({ description: '고객에게 전달할 메모' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}
