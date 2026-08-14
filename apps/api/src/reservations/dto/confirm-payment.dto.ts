// PATCH /reservations/:id/pay 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    enum: ['BANK', 'CARD'],
    description: '결제수단 — BANK(무통장입금)/CARD(카드결제)',
  })
  @IsIn(['BANK', 'CARD'])
  paymentMethod: 'BANK' | 'CARD';

  @ApiPropertyOptional({ description: '적용한 쿠폰명 스냅샷 — 미적용이면 생략' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  couponName?: string;

  @ApiPropertyOptional({ description: '쿠폰 할인액(원) — 미적용이면 생략' })
  @IsOptional()
  @IsInt()
  @Min(0)
  couponDiscount?: number;

  @ApiPropertyOptional({ description: '사용한 포인트(원) — 미사용이면 생략(0으로 저장)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsUsed?: number;

  @ApiProperty({ description: '최종 결제금액(원)' })
  @IsInt()
  @Min(0)
  paidAmount: number;
}
