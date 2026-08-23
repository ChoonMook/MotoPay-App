// PATCH /admin/settlements/shop-batches/:id/payout 요청 바디 검증 — 지급 상태·지급일 수정
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class UpdateShopSettlementPayoutDto {
  @ApiProperty({ enum: ['PENDING', 'PAID'], description: "-> CommonCodeDetail(code='PAYOUT_STATUS')" })
  @IsIn(['PENDING', 'PAID'])
  payoutStatus: string;

  @ApiPropertyOptional({ description: '실제 지급일("YYYY-MM-DD") — PAID로 바꿀 때만 의미 있음' })
  @IsOptional()
  @IsDateString()
  payoutDate?: string;
}
