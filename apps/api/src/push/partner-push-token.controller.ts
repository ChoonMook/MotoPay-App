// POST/DELETE /partner-auth/me/push-token — 로그인한 파트너(PartnerUser)의 Expo 푸시 토큰 등록/해제
import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartnerUser } from '../partner-auth/decorators/current-partner-user.decorator';
import { JwtPartnerAuthGuard } from '../partner-auth/guards/jwt-partner-auth.guard';
import type { SafePartnerUser } from '../partner-auth/partner-auth.types';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UnregisterPushTokenDto } from './dto/unregister-push-token.dto';
import { PushNotificationService } from './push-notification.service';

@ApiTags('push')
@ApiBearerAuth()
@UseGuards(JwtPartnerAuthGuard)
@Controller('partner-auth/me/push-token')
export class PartnerPushTokenController {
  constructor(private readonly pushService: PushNotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Expo 푸시 토큰 등록(기기당 upsert)' })
  register(@Body() dto: RegisterPushTokenDto, @CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.pushService.registerToken('PARTNER', partnerUser.id, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Expo 푸시 토큰 해제(로그아웃 시 호출)' })
  unregister(@Body() dto: UnregisterPushTokenDto) {
    return this.pushService.unregisterToken(dto.expoPushToken);
  }
}
