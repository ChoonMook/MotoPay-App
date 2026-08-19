// DELETE /me/push-token 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UnregisterPushTokenDto {
  @ApiProperty({ description: '로그아웃 등으로 해제할 이 기기의 Expo 푸시 토큰' })
  @IsString()
  @MinLength(1)
  expoPushToken: string;
}
