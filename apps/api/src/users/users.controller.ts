// PATCH /users/me, POST /users/me/profile-image, PATCH /users/me/password — 로그인한 본인 정보만 수정 가능
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileImageDto } from './dto/update-profile-image.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: '내 정보 변경 — 이름·이메일 수정' })
  updateMe(@CurrentUser() user: SafeUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/profile-image')
  @ApiOperation({ summary: '프로필 사진 업로드/교체' })
  updateMyProfileImage(
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateProfileImageDto,
  ) {
    return this.usersService.updateProfileImage(user.id, dto.imageBase64);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '비밀번호 변경 — 현재 비밀번호 확인 후 교체' })
  async changePassword(
    @CurrentUser() user: SafeUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.id, dto);
    return { success: true };
  }
}
