// POST /admin/common-codes/:code/details/:detailCode/photo 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class UploadCommonCodeDetailPhotoDto {
  @ApiProperty({
    description:
      'data URI(base64) 형식의 이미지 — JPEG·PNG·WEBP만 허용(예: 차종 대표사진)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @Matches(/^data:image\/(jpeg|png|webp);base64,.+$/, {
    message: 'JPEG·PNG·WEBP 형식의 이미지 데이터만 업로드할 수 있습니다.',
  })
  imageBase64: string;
}
