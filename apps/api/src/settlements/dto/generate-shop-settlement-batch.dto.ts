// POST /admin/settlements/shop-batches/generate 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class GenerateShopSettlementBatchDto {
  @ApiProperty({ example: '2026-08', description: '정산 대상월, "YYYY-MM" 형식' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'settlementMonth는 "YYYY-MM" 형식이어야 합니다.' })
  settlementMonth: string;
}
