// POST /reservations/:id/review 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: '평점(1~5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: '후기 내용' })
  @IsString()
  content: string;

  @ApiProperty({
    type: [String],
    required: false,
    description: '첨부 사진(data URI, base64) 목록 — JPEG·PNG·WEBP만 허용, 최대 5장',
    example: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: '사진은 최대 5장까지 첨부할 수 있습니다.' })
  @IsString({ each: true })
  @Matches(/^data:image\/(jpeg|png|webp);base64,.+$/, {
    each: true,
    message: 'JPEG·PNG·WEBP 형식의 이미지 데이터만 업로드할 수 있습니다.',
  })
  photos?: string[];
}
