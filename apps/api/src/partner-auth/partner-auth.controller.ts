// POST /partner-auth/login, PATCH /partner-auth/me/password
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
import { CurrentPartnerUser } from './decorators/current-partner-user.decorator';
import { PartnerChangePasswordDto } from './dto/partner-change-password.dto';
import { PartnerFindUsernameDto } from './dto/partner-find-username.dto';
import { PartnerLoginDto } from './dto/partner-login.dto';
import { PartnerRefreshDto } from './dto/partner-refresh.dto';
import { PartnerRequestPasswordResetDto } from './dto/partner-request-password-reset.dto';
import { PartnerResetPasswordDto } from './dto/partner-reset-password.dto';
import { JwtPartnerAuthGuard } from './guards/jwt-partner-auth.guard';
import { PartnerAuthService } from './partner-auth.service';
import type { SafePartnerUser } from './partner-auth.types';

@ApiTags('partner-auth')
@Controller('partner-auth')
export class PartnerAuthController {
  constructor(private readonly partnerAuthService: PartnerAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '파트너(시공업체) 아이디/비밀번호 로그인 — access/refresh 토큰 발급, mustChangePassword로 최초 로그인 여부 안내',
  })
  login(@Body() dto: PartnerLoginDto) {
    return this.partnerAuthService.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '현재 로그인한 파트너 계정 정보 조회(토큰 검증용, 자동로그인 세션 복원에 사용)',
  })
  me(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return partnerUser;
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '비밀번호 변경 — 현재 비밀번호 확인 후 교체(최초 로그인 강제 변경도 동일 엔드포인트 사용, 성공 시 mustChangePassword=false)',
  })
  async changePassword(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Body() dto: PartnerChangePasswordDto,
  ) {
    await this.partnerAuthService.changePassword(partnerUser.id, dto);
    return { success: true };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'accessToken 만료 시 refreshToken으로 access/refresh 토큰 재발급(rotation)',
  })
  refresh(@Body() dto: PartnerRefreshDto) {
    return this.partnerAuthService.refresh(dto.refreshToken);
  }

  @Post('find-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '아이디 찾기 — 휴대폰번호로 마스킹된 아이디 조회' })
  findUsername(@Body() dto: PartnerFindUsernameDto) {
    return this.partnerAuthService.findUsernameByPhone(dto.phone);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '비밀번호 찾기 1단계 — 아이디+휴대폰번호로 계정 확인 후 재설정 토큰 발급(10분 유효)',
  })
  requestPasswordReset(@Body() dto: PartnerRequestPasswordResetDto) {
    return this.partnerAuthService.issuePasswordResetToken(
      dto.username,
      dto.phone,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 찾기 2단계 — 재설정 토큰 검증 후 새 비밀번호로 교체',
  })
  async resetPassword(@Body() dto: PartnerResetPasswordDto) {
    await this.partnerAuthService.resetPasswordWithToken(
      dto.resetToken,
      dto.newPassword,
    );
    return { success: true };
  }
}
