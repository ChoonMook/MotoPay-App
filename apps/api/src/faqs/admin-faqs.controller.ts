// GET/POST/PATCH/DELETE /admin/faqs(/:id), PATCH /admin/faqs/reorder — AD-CS-03 FAQ 관리, 관리자 로그인 전용
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { CreateFaqDto } from './dto/create-faq.dto';
import { ReorderFaqsDto } from './dto/reorder-faqs.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqsService } from './faqs.service';

@ApiTags('admin-faqs')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/faqs')
export class AdminFaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get()
  @ApiOperation({ summary: 'FAQ 목록(AD-CS-03) — 노출여부 무관 전체, 카테고리 필터' })
  list(@Query('category') category?: string) {
    return this.faqsService.adminList(category);
  }

  @Post()
  @ApiOperation({ summary: 'FAQ 추가' })
  create(@Body() dto: CreateFaqDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.faqsService.create(dto, me.username);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'FAQ 드래그 정렬 반영' })
  reorder(@Body() dto: ReorderFaqsDto) {
    return this.faqsService.reorder(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'FAQ 수정 — 카테고리·질문·답변·노출여부' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFaqDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.faqsService.update(id, dto, me.username);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'FAQ 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faqsService.remove(id);
  }
}
