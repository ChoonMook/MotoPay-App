// PATCH /shops/me 요청 바디 검증 — 내 업체 기본정보 수정(부분 수정, 보낸 필드만 반영)
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateShopDto {
  @ApiPropertyOptional({ description: '소개글' })
  @IsOptional()
  @IsString()
  intro?: string;

  @ApiPropertyOptional({ description: '인사말' })
  @IsOptional()
  @IsString()
  greeting?: string;

  @ApiPropertyOptional({ description: '우편번호' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: '주소' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '상세주소' })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({ description: '대표 전화번호' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '평일 09:00 ~ 19:00, 토요일 10:00 ~ 18:00, 일요일 휴무',
    description: '운영시간 안내',
  })
  @IsOptional()
  @IsString()
  businessHours?: string;

  @ApiPropertyOptional({
    description:
      '시공가능 카테고리 — CommonCodeDetail(code=CAR_INST)의 detailCode 목록, 보내면 전체 교체',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
