// POST /admin/common-codes/:code/details 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCommonCodeDetailDto {
  @ApiProperty({ example: 'ETC', description: '상세코드값' })
  @IsString()
  @MinLength(1)
  detailCode: string;

  @ApiProperty({ example: '기타', description: '상세코드명' })
  @IsString()
  @MinLength(1)
  detailName: string;

  @ApiPropertyOptional({ description: '참조1' })
  @IsOptional()
  @IsString()
  ref1?: string;

  @ApiPropertyOptional({ description: '참조2' })
  @IsOptional()
  @IsString()
  ref2?: string;

  @ApiPropertyOptional({
    description: '정렬순서 - 생략 시 그룹 내 마지막 순서로 추가',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
