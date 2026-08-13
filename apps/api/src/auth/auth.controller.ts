// POST /auth/login, POST /auth/signup, POST /auth/refresh, GET /auth/check-username/:username, GET /auth/me,
// POST /auth/find-username, POST /auth/request-password-reset, POST /auth/reset-password
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { FindUsernameDto } from './dto/find-username.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { SafeUser } from './auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '아이디/비밀번호 로그인 — access/refresh 토큰 발급',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      '일반고객 회원가입 — 가입과 동시에 access/refresh 토큰 발급(자동 로그인)',
  })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'accessToken 만료 시 refreshToken으로 access/refresh 토큰 재발급(rotation)',
  })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('check-username/:username')
  @ApiOperation({ summary: '회원가입 시 아이디 중복확인' })
  async checkUsername(@Param('username') username: string) {
    return { available: await this.authService.isUsernameAvailable(username) };
  }

  @Post('find-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '아이디 찾기 — 휴대폰번호로 마스킹된 아이디 조회' })
  findUsername(@Body() dto: FindUsernameDto) {
    return this.authService.findUsernameByPhone(dto.phone);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '비밀번호 찾기 1단계 — 휴대폰번호로 계정 확인 후 재설정 토큰 발급(10분 유효)',
  })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.issuePasswordResetToken(dto.phone);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 찾기 2단계 — 재설정 토큰 검증 후 새 비밀번호로 교체',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.resetToken, dto.newPassword);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 로그인한 사용자 정보 조회(토큰 검증용)' })
  me(@CurrentUser() user: SafeUser) {
    return user;
  }
}
