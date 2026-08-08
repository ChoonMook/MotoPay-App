// PUT /admin/companies/:id/time-slots/:dayType 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class TimeSlotInputDto {
  @ApiProperty({ example: '09:00', description: '"HH:mm" 형식' })
  @IsString()
  time: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  capacity: number;
}

export class ReplaceCompanyTimeSlotsDto {
  @ApiProperty({ type: [TimeSlotInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotInputDto)
  slots: TimeSlotInputDto[];
}
