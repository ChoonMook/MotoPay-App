// GET/PATCH /admin/app-version-policies(/:platform) — AD-SYS-06 앱버전관리, 관리자 로그인 필요
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { AppVersionService } from './app-version.service';
import { UpdateAppVersionPolicyDto } from './dto/update-app-version-policy.dto';

@ApiTags('admin-app-version')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/app-version-policies')
export class AdminAppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get()
  @ApiOperation({ summary: '플랫폼별 앱 강제 업데이트 정책 목록 조회' })
  listPolicies() {
    return this.appVersionService.listPolicies();
  }

  @Patch(':platform')
  @ApiOperation({ summary: '앱 강제 업데이트 정책 수정' })
  updatePolicy(
    @Param('platform') platform: string,
    @Body() dto: UpdateAppVersionPolicyDto,
    @CurrentAdmin() admin: SafeAdminAccount,
  ) {
    return this.appVersionService.updatePolicy(platform, dto, admin.username);
  }
}
