// POST /admin/points/grant, /admin/points/deduct 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class ForcePointAdjustDto {
  @ApiProperty({ description: '대상 회원 id' })
  @IsString()
  @MinLength(1)
  memberId: string;

  @ApiProperty({ description: '부여/차감 포인트(원, 1 이상)' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ description: '부여/차감 사유(필수)' })
  @IsString()
  @MinLength(1)
  reason: string;
}
