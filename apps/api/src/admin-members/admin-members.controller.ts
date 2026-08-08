// GET/PATCH /admin/members(/:id) — AD-MBR-02 고객 회원 목록 화면 전용, 관리자 로그인 필요
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { AdminMembersService } from './admin-members.service';
import { SetMemberWithdrawnDto } from './dto/set-member-withdrawn.dto';

@ApiTags('admin-members')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/members')
export class AdminMembersController {
  constructor(private readonly adminMembersService: AdminMembersService) {}

  @Get()
  @ApiOperation({ summary: '고객 회원 목록 조회' })
  list() {
    return this.adminMembersService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: '고객 회원 상세 조회(보유차량·신차패키지 포함)' })
  detail(@Param('id') id: string) {
    return this.adminMembersService.detail(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '회원 탈퇴 처리/취소' })
  setWithdrawn(@Param('id') id: string, @Body() dto: SetMemberWithdrawnDto) {
    return this.adminMembersService.setWithdrawn(id, dto.withdrawn);
  }
}
