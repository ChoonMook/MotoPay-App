// POST /cars/me(수기등록) 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMyCarDto {
  @ApiProperty({
    example: 'BENZ',
    description: "차량브랜드코드 -> CommonCodeDetail(code='CAR_BRAND')",
  })
  @IsString()
  @MinLength(1)
  carBrandCode: string;

  @ApiProperty({
    example: 'B-E',
    description: "차종코드 -> CommonCodeDetail(code='CAR_MODEL')",
  })
  @IsString()
  @MinLength(1)
  carModelCode: string;

  @ApiPropertyOptional({ example: 'E 200', description: '세부차종명' })
  @IsOptional()
  @IsString()
  trimName?: string;

  @ApiPropertyOptional({ example: '2023', description: '연식' })
  @IsOptional()
  @IsString()
  modelYear?: string;

  @ApiPropertyOptional({ example: '34나 7890', description: '차량번호' })
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @ApiPropertyOptional({ description: '차대번호(VIN)' })
  @IsOptional()
  @IsString()
  vin?: string;
}
