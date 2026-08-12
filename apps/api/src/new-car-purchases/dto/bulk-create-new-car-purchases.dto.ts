// POST /admin/new-car-purchases/bulk 요청 바디 검증 (DL-NCPK-03 엑셀 일괄업로드)
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateNewCarPurchaseDto } from './create-new-car-purchase.dto';

export class BulkCreateNewCarPurchasesDto {
  @ApiProperty({ type: [CreateNewCarPurchaseDto], description: '엑셀에서 파싱한 행 목록 — 행별로 개별 성공/실패 처리' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNewCarPurchaseDto)
  rows: CreateNewCarPurchaseDto[];
}
