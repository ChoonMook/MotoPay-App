// POST/DELETE /me/push-token — 로그인한 고객(User)의 Expo 푸시 토큰 등록/해제
import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';
import { PushNotificationService } from './push-notification.service';

@ApiTags('push')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/push-token')
export class PushTokenController {
  constructor(private readonly pushService: PushNotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Expo 푸시 토큰 등록(기기당 upsert)' })
  register(@Body() dto: RegisterPushTokenDto, @CurrentUser() user: SafeUser) {
    return this.pushService.registerToken('USER', user.id, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Expo 푸시 토큰 해제(로그아웃 시 호출)' })
  unregister(@Body() dto: UnregisterPushTokenDto) {
    return this.pushService.unregisterToken(dto.expoPushToken);
  }
}
