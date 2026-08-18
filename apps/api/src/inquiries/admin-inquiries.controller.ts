// GET /admin/inquiries, GET /admin/inquiries/:inquiryNo, PATCH /admin/inquiries/:inquiryNo/answer —
// AD-CS-02 1:1 문의 관리, 관리자 로그인 전용
import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { AnswerInquiryDto } from './dto/answer-inquiry.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('admin-inquiries')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/inquiries')
export class AdminInquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @ApiOperation({
    summary: '1:1 문의 목록(AD-CS-02) — 유형·상태·문의자 검색·접수일 기간 필터',
  })
  list(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.inquiriesService.adminList({ keyword, category, status, dateFrom, dateTo });
  }

  @Get(':inquiryNo')
  @ApiOperation({ summary: '1:1 문의 상세' })
  getDetail(@Param('inquiryNo') inquiryNo: string) {
    return this.inquiriesService.adminGetDetail(inquiryNo);
  }

  @Patch(':inquiryNo/answer')
  @ApiOperation({
    summary: '1:1 문의 답변 등록 — 실제 이메일 발송은 없고 앱 내 문의 상세 화면에 즉시 반영',
  })
  answer(
    @Param('inquiryNo') inquiryNo: string,
    @Body() dto: AnswerInquiryDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.inquiriesService.adminAnswer(inquiryNo, dto, me.username);
  }
}
