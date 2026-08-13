// PUT /admin/products/:id/position-options 요청 바디 검증
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProductPositionOptionGroupDto {
  @ApiProperty({
    example: 'FRONT',
    description: '시공 부위 -> CommonCodeDetail(code=BID_TINT_POSITION)',
  })
  @IsString()
  @MinLength(1)
  position: string;

  @ApiProperty({
    example: ['5', '15', '30'],
    description:
      '이 부위에서 선택 가능한 농도 목록 -> CommonCodeDetail(code=VLT)',
  })
  @IsArray()
  @IsString({ each: true })
  levels: string[];
}

export class SetProductPositionOptionsDto {
  @ApiProperty({ description: '부위옵션 사용여부' })
  @IsBoolean()
  positionOptionYn: boolean;

  @ApiProperty({
    type: [ProductPositionOptionGroupDto],
    description: '부위별 선택 가능 농도 설정',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPositionOptionGroupDto)
  options: ProductPositionOptionGroupDto[];
}
