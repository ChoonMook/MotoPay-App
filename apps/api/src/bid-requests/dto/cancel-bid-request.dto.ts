// PATCH /bid-requests/:id/cancel 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const BID_CANCEL_REASON_VALUES = [
  'SIMPLE',
  'RE_REQUEST',
  'ETC',
] as const;

export class CancelBidRequestDto {
  @ApiProperty({
    enum: BID_CANCEL_REASON_VALUES,
    description: "취소사유 -> CommonCodeDetail(code='BID_CANCEL_REASON')",
  })
  @IsIn(BID_CANCEL_REASON_VALUES)
  cancelReason: (typeof BID_CANCEL_REASON_VALUES)[number];

  @ApiPropertyOptional({
    description: '취소사유가 기타(ETC)일 때의 자유입력 사유',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cancelReasonNote?: string;
}
