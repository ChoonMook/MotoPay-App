// PATCH /admin/inquiries/:id/answer 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnswerInquiryDto {
  @ApiProperty({ description: '답변 내용' })
  @IsString()
  @MinLength(1)
  answer: string;
}
