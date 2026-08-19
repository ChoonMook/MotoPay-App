// GET /me/notifications, GET /me/notifications/unread-count, PATCH /me/notifications/:id/read — CU-MYPG-12 알림함
import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '내 알림함 목록(CU-MYPG-12)' })
  listMine(@CurrentUser() user: SafeUser) {
    return this.notificationsService.listMine('USER', user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '안읽은 알림 개수 — 홈 알림 아이콘 뱃지용' })
  unreadCount(@CurrentUser() user: SafeUser) {
    return this.notificationsService.unreadCount('USER', user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: SafeUser) {
    return this.notificationsService.markRead('USER', user.id, id);
  }
}
