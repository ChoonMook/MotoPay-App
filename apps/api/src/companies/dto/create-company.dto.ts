// POST /admin/companies 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: "업체구분 -> CommonCodeDetail(code='CO_TYPE')의 detailCode",
    example: 'SHOP',
  })
  @IsString()
  @MinLength(1)
  coType: string;

  @ApiProperty({ example: '모토탱크 강남점' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: '123-45-67890' })
  @IsString()
  @MinLength(1)
  businessRegNo: string;

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
}
