// PATCH /admin/common-codes/:code 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCommonCodeDto {
  @ApiPropertyOptional({ description: '공통코드 그룹명' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: '사용여부' })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;
}
