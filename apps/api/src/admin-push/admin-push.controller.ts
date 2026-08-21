// GET /admin/push/history, GET /admin/push/partner-users, POST /admin/push/send — AD-CS-04(푸시 발송), 관리자 로그인 전용
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { AdminPushService } from './admin-push.service';
import { SendPushBroadcastDto } from './dto/send-push-broadcast.dto';

@ApiTags('admin-push')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/push')
export class AdminPushController {
  constructor(private readonly adminPushService: AdminPushService) {}

  @Get('history')
  @ApiOperation({ summary: '관리자 푸시 발송 이력(AD-CS-04)' })
  history() {
    return this.adminPushService.listHistory();
  }

  @Get('partner-users')
  @ApiOperation({
    summary: '발송 대상 검색용 — 전체 업체를 가로질러 사용중인 시공업체 사용자 목록',
  })
  partnerUsers() {
    return this.adminPushService.listPartnerUsersForSearch();
  }

  @Post('send')
  @ApiOperation({ summary: '관리자 임의 공지 푸시 발송(AD-CS-04)' })
  send(
    @Body() dto: SendPushBroadcastDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.adminPushService.send(dto, me.username);
  }
}
