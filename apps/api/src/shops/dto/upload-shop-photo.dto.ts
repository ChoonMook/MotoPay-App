// POST /shops/me/photos 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

export class UploadShopPhotoDto {
  @ApiProperty({
    description: 'data URI(base64) 형식의 이미지 — JPEG·PNG·WEBP만 허용',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @Matches(/^data:image\/(jpeg|png|webp);base64,.+$/, {
    message: 'JPEG·PNG·WEBP 형식의 이미지 데이터만 업로드할 수 있습니다.',
  })
  imageBase64: string;

  @ApiProperty({
    enum: ['MAIN', 'CASE'],
    description:
      '사진유형 — MAIN(대표사진, 항상 1장·업로드 시 교체)/CASE(소개·시공사례 사진, 최대 10장) — CommonCodeDetail(code=SHOP_PHOTO_TYPE)',
  })
  @IsIn(['MAIN', 'CASE'])
  photoType: string;
}
