// PATCH /bid-requests/:id/select-plan 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SelectBidPlanDto {
  @ApiProperty({ description: '선택한 추천번호 -> BidPlan.planNo' })
  @IsString()
  @MinLength(1)
  planNo: string;
}
