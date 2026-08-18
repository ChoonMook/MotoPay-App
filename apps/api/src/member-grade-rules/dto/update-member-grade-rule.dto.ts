// PATCH /admin/member-grade-rules/:gradeCode 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateMemberGradeRuleDto {
  @ApiPropertyOptional({ description: '등급 산정 기준금액(원)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSpendAmount?: number;

  @ApiPropertyOptional({ description: '혜택: 시공 할인권(%)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountRate?: number;

  @ApiPropertyOptional({ description: '혜택: 월 금액권(원)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  voucherAmount?: number;
}
