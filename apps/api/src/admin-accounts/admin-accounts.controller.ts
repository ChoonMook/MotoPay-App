// GET/POST/PATCH /admin/accounts(/:id) — AD-SYS-04 사용자 계정 관리 화면 전용, 관리자 로그인 필요
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { AdminAccountsService } from './admin-accounts.service';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { UpdateAdminAccountDto } from './dto/update-admin-account.dto';

@ApiTags('admin-accounts')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(private readonly adminAccountsService: AdminAccountsService) {}

  @Get()
  @ApiOperation({ summary: '관리자 계정 목록 조회' })
  list() {
    return this.adminAccountsService.list();
  }

  @Get('check-username')
  @ApiOperation({ summary: '계정 추가 화면의 아이디 중복 확인' })
  checkUsername(@Query('username') username: string) {
    return this.adminAccountsService.checkUsernameAvailable(username);
  }

  @Post()
  @ApiOperation({
    summary: '관리자 계정 추가 - 임시 비밀번호를 발급해 응답에 1회 포함',
  })
  create(
    @Body() dto: CreateAdminAccountDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.adminAccountsService.create(dto, me.username);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '관리자 계정 수정(이름·이메일·휴대폰·권한그룹·상태 등)',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminAccountDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.adminAccountsService.update(id, dto, me.username);
  }
}
