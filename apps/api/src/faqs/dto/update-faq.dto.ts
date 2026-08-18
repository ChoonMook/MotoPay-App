// PATCH /admin/faqs/:id 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateFaqDto {
  @ApiPropertyOptional({ description: '카테고리 -> CommonCodeDetail(code=FAQ_CATEGORY)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @ApiPropertyOptional({ description: '질문' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  question?: string;

  @ApiPropertyOptional({ description: '답변' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  answer?: string;

  @ApiPropertyOptional({ description: '노출여부' })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;
}
