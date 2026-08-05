// POST /shops/me/reservations/:reservationNo/call-logs 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const CALL_RESULT_VALUES = ['CONNECTED', 'NOANSWER', 'RETRY'] as const;

export class CreateCallLogDto {
  @ApiProperty({
    enum: CALL_RESULT_VALUES,
    description: '통화 결과 -> CommonCodeDetail(code=CALL_RESULT)',
  })
  @IsIn(CALL_RESULT_VALUES)
  result: (typeof CALL_RESULT_VALUES)[number];

  @ApiProperty({ required: false, description: '통화 메모(선택)' })
  @IsOptional()
  @IsString()
  memo?: string;
}
