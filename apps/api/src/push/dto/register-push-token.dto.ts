// POST /me/push-token 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class RegisterPushTokenDto {
  @ApiProperty({ description: 'Expo 푸시 토큰 (ExponentPushToken[...])' })
  @IsString()
  @MinLength(1)
  expoPushToken: string;

  @ApiProperty({ description: '기기 플랫폼', enum: ['ios', 'android'] })
  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
