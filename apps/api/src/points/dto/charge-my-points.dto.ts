// POST /me/points/charge 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Min } from 'class-validator';

const MIN_CHARGE_AMOUNT = 10000;

export class ChargeMyPointsDto {
  @ApiProperty({ description: `충전 금액(원, ${MIN_CHARGE_AMOUNT} 이상)` })
  @IsInt()
  @Min(MIN_CHARGE_AMOUNT)
  amount: number;

  @ApiProperty({ enum: ['BANK', 'CARD'], description: '결제수단 — BANK(무통장입금)/CARD(카드결제)' })
  @IsIn(['BANK', 'CARD'])
  method: 'BANK' | 'CARD';
}
