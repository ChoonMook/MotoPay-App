// PATCH /shops/me/reservations/:reservationNo/resched-request 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RequestReschedDto {
  @ApiProperty({ example: '2026-08-20', description: '제안하는 새 날짜(YYYY-MM-DD)' })
  @IsString()
  date: string;

  @ApiProperty({ example: '14:00', description: '제안하는 새 시각(HH:mm)' })
  @IsString()
  time: string;

  @ApiProperty({ description: '일정변경 사유' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
