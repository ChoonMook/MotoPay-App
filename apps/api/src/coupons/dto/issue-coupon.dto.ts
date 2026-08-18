// POST /admin/coupons 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class IssueCouponDto {
  @ApiProperty({ description: '쿠폰명' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: '쿠폰유형', enum: ['DISCOUNT', 'EXCHANGE', 'AMOUNT'] })
  @IsIn(['DISCOUNT', 'EXCHANGE', 'AMOUNT'])
  couponType: string;

  @ApiPropertyOptional({ description: '할인값(할인권=%, 금액권=원, 교환권은 미사용)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountValue?: number;

  @ApiProperty({ description: '발행주체', enum: ['OPERATOR', 'DEALER'] })
  @IsIn(['OPERATOR', 'DEALER'])
  issuerType: string;

  @ApiPropertyOptional({ description: '딜러사 대행 발행인 경우 딜러사 Company.id' })
  @IsOptional()
  @IsInt()
  issuerCompanyId?: number;

  @ApiProperty({ description: '발행대상', enum: ['ALL', 'CONDITION', 'INDIVIDUAL'] })
  @IsIn(['ALL', 'CONDITION', 'INDIVIDUAL'])
  targetType: string;

  @ApiPropertyOptional({ description: '조건별 발행 시 대상 등급(GOLD/SILVER/BRONZE)' })
  @IsOptional()
  @IsString()
  targetGrade?: string;

  @ApiPropertyOptional({ description: '개별선택 발행 시 대상 회원 id 목록' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberIds?: string[];

  @ApiProperty({ description: '유효기간 시작(YYYY-MM-DD)' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: '유효기간 종료(YYYY-MM-DD)' })
  @IsDateString()
  validTo: string;
}
