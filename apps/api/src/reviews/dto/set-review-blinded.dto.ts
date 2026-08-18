// PATCH /admin/reviews/:id/blind 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetReviewBlindedDto {
  @ApiProperty({ description: 'true=블라인드 처리, false=블라인드 해제' })
  @IsBoolean()
  isBlinded: boolean;
}
