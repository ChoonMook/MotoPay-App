// PATCH /admin/companies/:id/shop/settlement 요청 바디 검증 — 시공업체 정산 기본값 수정(관리자 전용,
// 파트너 자기 자신은 수정 불가하도록 PATCH /shops/me의 UpdateShopDto와 완전히 분리된 DTO)
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateShopSettlementDto {
  @ApiPropertyOptional({
    description:
      '정산 기본 매입가 정률(%) — 상품마다 가격대가 달라 업체 단위 기본값은 정률만 사용(정액이 필요하면 AD-STL-02에서 상품별 예외로 등록)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({ description: '정산일 — 매월 며칠에 이 업체에 지급하는지(1~31)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  settlementDay?: number;
}
