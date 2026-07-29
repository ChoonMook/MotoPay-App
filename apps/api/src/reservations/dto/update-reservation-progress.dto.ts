// PATCH /shops/me/reservations/:reservationNo/progress 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const PROGRESS_VALUES = ['APPLIED', 'IN_PROGRESS', 'DONE'] as const;

export class UpdateReservationProgressDto {
  @ApiProperty({
    enum: PROGRESS_VALUES,
    description: '시공 진행상태 -> CommonCodeDetail(code=RESERVATION_PROGRESS)',
  })
  @IsIn(PROGRESS_VALUES)
  progressStatus: (typeof PROGRESS_VALUES)[number];
}
