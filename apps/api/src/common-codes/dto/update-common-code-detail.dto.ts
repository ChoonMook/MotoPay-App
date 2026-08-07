// PATCH /admin/common-codes/:code/details/:detailCode 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateCommonCodeDetailDto {
  @ApiPropertyOptional({ description: '상세코드명' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  detailName?: string;

  @ApiPropertyOptional({ description: '참조1' })
  @IsOptional()
  @IsString()
  ref1?: string;

  @ApiPropertyOptional({ description: '참조2' })
  @IsOptional()
  @IsString()
  ref2?: string;

  @ApiPropertyOptional({ description: '정렬순서' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '사용여부' })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;
}
