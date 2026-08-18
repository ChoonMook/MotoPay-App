// PATCH /me/inquiries/:inquiryNo 요청 바디 검증 — 답변 등록 전(PENDING)에만 허용
import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateInquiryDto {
  @ApiProperty({ description: '문의 유형 -> CommonCodeDetail(code=INQUIRY_CATEGORY)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @ApiProperty({ description: '제목', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiProperty({ description: '내용', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiProperty({
    type: [String],
    required: false,
    description:
      '첨부 사진 전체 목록(전달 시 기존 사진을 이 목록으로 완전히 교체, 최대 5장) — ' +
      '유지할 기존 사진은 조회 응답의 상대경로 그대로, 새로 추가하는 사진은 data URI(base64)로 전달',
    example: ['inquiry-photos/existing-uuid.jpg', 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: '사진은 최대 5장까지 첨부할 수 있습니다.' })
  @IsString({ each: true })
  photos?: string[];
}
