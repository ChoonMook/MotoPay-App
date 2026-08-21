// POST /admin/push/send 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SendPushBroadcastDto {
  @ApiProperty({ description: '발송 대상 유형', enum: ['USER', 'PARTNER'] })
  @IsIn(['USER', 'PARTNER'])
  targetType: 'USER' | 'PARTNER';

  @ApiProperty({ description: '발송 범위', enum: ['ALL', 'INDIVIDUAL'] })
  @IsIn(['ALL', 'INDIVIDUAL'])
  scope: 'ALL' | 'INDIVIDUAL';

  @ApiPropertyOptional({ description: '개별선택 발송 시 대상 id(User.id 또는 PartnerUser.id) 목록' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids?: string[];

  @ApiProperty({ description: '알림 제목' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ description: '알림 본문' })
  @IsString()
  @MinLength(1)
  body: string;
}
