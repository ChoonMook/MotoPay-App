// PATCH /reservations/:id/resched-reject 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectReschedDto {
  @ApiPropertyOptional({ description: '거절 사유(선택 입력)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
