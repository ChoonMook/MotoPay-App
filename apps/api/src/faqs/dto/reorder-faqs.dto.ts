// PATCH /admin/faqs/reorder 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';

export class ReorderFaqItemDto {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsInt()
  sortOrder: number;
}

export class ReorderFaqsDto {
  @ApiProperty({ type: [ReorderFaqItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderFaqItemDto)
  items: ReorderFaqItemDto[];
}
