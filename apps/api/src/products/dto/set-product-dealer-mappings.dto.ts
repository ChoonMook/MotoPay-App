// PUT /admin/products/:id/dealer-mappings 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class SetProductDealerMappingsDto {
  @ApiProperty({
    example: [17, 19],
    description:
      '이 상품(패키지)을 판매할 딜러사 목록 -> Company.id(coType=DEALER)',
  })
  @IsArray()
  @IsInt({ each: true })
  dealerCompanyIds: number[];
}
