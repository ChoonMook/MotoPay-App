// POST /admin/faqs 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ description: '카테고리 -> CommonCodeDetail(code=FAQ_CATEGORY)' })
  @IsString()
  @MinLength(1)
  category: string;

  @ApiProperty({ description: '질문' })
  @IsString()
  @MinLength(1)
  question: string;

  @ApiProperty({ description: '답변' })
  @IsString()
  @MinLength(1)
  answer: string;
}
