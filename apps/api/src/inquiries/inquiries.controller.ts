// POST /me/inquiries, GET /me/inquiries, GET /me/inquiries/:inquiryNo, PATCH /me/inquiries/:inquiryNo
// — 1:1 문의 등록·조회·수정(CU-CS-03~05), 로그인한 본인 데이터만 조회/수정. 수정은 답변 등록 전(PENDING)에만 허용
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('inquiries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @ApiOperation({ summary: '1:1 문의 등록(CU-CS-03)' })
  create(@Body() dto: CreateInquiryDto, @CurrentUser() user: SafeUser) {
    return this.inquiriesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 문의 처리현황(CU-CS-04)' })
  listMine(@CurrentUser() user: SafeUser) {
    return this.inquiriesService.listMine(user.id);
  }

  @Get(':inquiryNo')
  @ApiOperation({ summary: '내 문의 상세(CU-CS-05)' })
  getMine(@Param('inquiryNo') inquiryNo: string, @CurrentUser() user: SafeUser) {
    return this.inquiriesService.getMine(user.id, inquiryNo);
  }

  @Patch(':inquiryNo')
  @ApiOperation({ summary: '내 문의 수정(CU-CS-03) — 답변 등록 전(PENDING)에만 허용' })
  updateMine(
    @Param('inquiryNo') inquiryNo: string,
    @Body() dto: UpdateInquiryDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.inquiriesService.updateMine(user.id, inquiryNo, dto);
  }
}
