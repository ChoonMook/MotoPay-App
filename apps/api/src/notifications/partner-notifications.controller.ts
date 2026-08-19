// GET /partner-auth/me/notifications, GET .../unread-count, PATCH .../:id/read — 파트너 알림함(PT-PROF-01)
import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartnerUser } from '../partner-auth/decorators/current-partner-user.decorator';
import { JwtPartnerAuthGuard } from '../partner-auth/guards/jwt-partner-auth.guard';
import type { SafePartnerUser } from '../partner-auth/partner-auth.types';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtPartnerAuthGuard)
@Controller('partner-auth/me/notifications')
export class PartnerNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '내 알림함 목록(PT-PROF-01)' })
  listMine(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.notificationsService.listMine('PARTNER', partnerUser.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '안읽은 알림 개수 — 홈 알림 아이콘 뱃지용' })
  unreadCount(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.notificationsService.unreadCount('PARTNER', partnerUser.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.notificationsService.markRead('PARTNER', partnerUser.id, id);
  }
}
