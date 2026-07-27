// PATCH /cars/me/:id 요청 바디 검증 — 수기등록(regType='MANUAL')은 전체 필드, 신차매핑(regType='MAP')은 plateNumber만 허용(서비스단에서 검증)
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMyCarDto {
  @ApiPropertyOptional({
    example: 'BENZ',
    description: "차량브랜드코드 -> CommonCodeDetail(code='CAR_BRAND')",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  carBrandCode?: string;

  @ApiPropertyOptional({
    example: 'B-E',
    description: "차종코드 -> CommonCodeDetail(code='CAR_MODEL')",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  carModelCode?: string;

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
