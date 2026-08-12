// PUT /admin/products/:id/car-model-mappings 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetProductCarModelMappingsDto {
  @ApiProperty({ example: ['SORENTO', 'SPORTAGE'], description: '이 상품(패키지)을 적용 가능한 차종 목록 -> CommonCodeDetail(code=CAR_MODEL)' })
  @IsArray()
  @IsString({ each: true })
  carModelCodes: string[];
}
