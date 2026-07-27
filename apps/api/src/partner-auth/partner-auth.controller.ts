// POST /partner-auth/login, PATCH /partner-auth/me/password
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartnerUser } from './decorators/current-partner-user.decorator';
import { PartnerChangePasswordDto } from './dto/partner-change-password.dto';
import { PartnerLoginDto } from './dto/partner-login.dto';
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
}
