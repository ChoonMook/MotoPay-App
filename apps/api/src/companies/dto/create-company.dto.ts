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

  @ApiPropertyOptional({ example: '06134' })
  @IsOptional()
  @IsString()
  companyZipCode?: string;

  @ApiPropertyOptional({ example: '서울 강남구 테헤란로 152' })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({ example: '10층' })
  @IsOptional()
  @IsString()
  companyAddressDetail?: string;

  @ApiPropertyOptional({ example: '도소매업' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ example: '자동차용품' })
  @IsOptional()
  @IsString()
  businessItem?: string;

  @ApiPropertyOptional({
    description:
      '사업자구분 -> CommonCodeDetail(code=BIZ_DIV: INDIVIDUAL/CORP)',
    example: 'CORP',
  })
  @IsOptional()
  @IsString()
  bizDivision?: string;

  @ApiPropertyOptional({ example: '02-1234-5678' })
  @IsOptional()
  @IsString()
  repPhone?: string;

  @ApiPropertyOptional({ example: '02-1234-5679' })
  @IsOptional()
  @IsString()
  faxNo?: string;

  @ApiPropertyOptional({
    description: "은행 -> CommonCodeDetail(code='BANK')",
    example: 'KB',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '123456-78-901234' })
  @IsOptional()
  @IsString()
  accountNo?: string;
}
