// PATCH /shops/me/reservations/:reservationNo/complete 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CompleteReservationDto {
  @ApiProperty({
    type: [String],
    description:
      '시공 사진(data URI, base64) 목록 — JPEG·PNG·WEBP만 허용, 최소 3장~최대 10장',
    example: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
  })
  @IsArray()
  @ArrayMinSize(3, { message: '시공 사진은 최소 3장 이상 등록해야 합니다.' })
  @ArrayMaxSize(10, { message: '시공 사진은 최대 10장까지 등록할 수 있습니다.' })
  @IsString({ each: true })
  @Matches(/^data:image\/(jpeg|png|webp);base64,.+$/, {
    each: true,
    message: 'JPEG·PNG·WEBP 형식의 이미지 데이터만 업로드할 수 있습니다.',
  })
  photos: string[];

  @ApiProperty({ required: false, description: '작업 메모(선택)' })
  @IsOptional()
  @IsString()
  memo?: string;
}
