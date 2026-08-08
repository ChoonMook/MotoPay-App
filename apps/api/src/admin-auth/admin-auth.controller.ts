// POST /admin-auth/login, GET /admin-auth/me, PATCH /admin-auth/me, POST /admin-auth/refresh
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import { UpdateAdminMeDto } from './dto/update-admin-me.dto';
import { JwtAdminAuthGuard } from './guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from './admin-auth.types';

@ApiTags('admin-auth')
@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '관리자웹(admin-app) 아이디/비밀번호 로그인 — access/refresh 토큰 발급',
  })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '현재 로그인한 관리자 계정 정보 조회(토큰 검증용, 자동로그인 세션 복원에 사용)',
  })
  me(@CurrentAdmin() adminAccount: SafeAdminAccount) {
    return adminAccount;
  }

  @Patch('me')
  @UseGuards(JwtAdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 정보 수정 — 이메일·휴대폰번호·비밀번호(선택) 변경',
  })
  updateMe(
    @CurrentAdmin() adminAccount: SafeAdminAccount,
    @Body() dto: UpdateAdminMeDto,
  ) {
    return this.adminAuthService.updateMe(adminAccount.id, dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'accessToken 만료 시 refreshToken으로 access/refresh 토큰 재발급(rotation)',
  })
  refresh(@Body() dto: AdminRefreshDto) {
    return this.adminAuthService.refresh(dto.refreshToken);
  }
}
