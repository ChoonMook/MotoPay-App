// POST /me/inquiries 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({ description: '문의 유형 -> CommonCodeDetail(code=INQUIRY_CATEGORY)' })
  @IsString()
  @MinLength(1)
  category: string;

  @ApiProperty({ description: '제목' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ description: '내용' })
  @IsString()
  @MinLength(1)
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
