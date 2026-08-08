// PATCH /admin/companies/:id/daily-slots 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertCompanyDailySlotDto {
  @ApiProperty({ example: '2026-09-15', description: '"YYYY-MM-DD" 형식' })
  @IsString()
  date: string;

  @ApiProperty({ example: '09:00', description: '"HH:mm" 형식' })
  @IsString()
  time: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}
