// POST /admin/companies/:id/holidays 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AddCompanyHolidaysDto {
  @ApiProperty({ type: [String], example: ['2026-09-15', '2026-09-16'] })
  @IsArray()
  @IsString({ each: true })
  dates: string[];
}
