// PATCH /admin/companies/:id 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: '모토탱크 강남점' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: '123-45-67890' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  businessRegNo?: string;

  @ApiPropertyOptional({ example: '홍길동' })
  @IsOptional()
  @IsString()
  representativeName?: string;

  @ApiPropertyOptional({ example: '김담당' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '상태(정상=true/중지=false)' })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;

  @ApiPropertyOptional({ description: '사용중지 사유 — useYn=false로 변경할 때 필수' })
  @IsOptional()
  @IsString()
  suspendReason?: string;
}
