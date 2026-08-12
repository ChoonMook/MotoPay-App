// PUT /admin/products/:id/dealer-mappings 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetProductDealerMappingsDto {
  @ApiProperty({ example: ['KCC', 'EO'], description: '이 상품(패키지)을 판매할 딜러사 목록 -> CommonCodeDetail(code=DEALER)' })
  @IsArray()
  @IsString({ each: true })
  dealerCodes: string[];
}
