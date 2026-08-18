// GET /faqs — FAQ 조회(CU-CS-02), 로그인 불필요(공개 조회)
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get()
  @ApiOperation({ summary: 'FAQ 목록(CU-CS-02) — 노출 대상만, 카테고리 필터' })
  list(@Query('category') category?: string) {
    return this.faqsService.list(category);
  }
}
