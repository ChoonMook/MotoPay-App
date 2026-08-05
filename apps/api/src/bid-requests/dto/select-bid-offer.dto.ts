// PATCH /bid-requests/:id/select 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SelectBidOfferDto {
  @ApiProperty({ description: '선택한 응찰번호 -> BidOffer.offerNo' })
  @IsString()
  @MinLength(1)
  offerNo: string;
}
