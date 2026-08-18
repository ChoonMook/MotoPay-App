// GET /admin/reviews, PATCH /admin/reviews/:id/blind — AD-NOTI-02 후기 관리, 관리자 로그인 전용
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { SetReviewBlindedDto } from './dto/set-review-blinded.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('admin-reviews')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({
    summary: '후기 목록(AD-NOTI-02) — 업체명 검색·평점·노출상태·작성일 기간 필터',
  })
  list(
    @Query('keyword') keyword?: string,
    @Query('rating') rating?: string,
    @Query('isBlinded') isBlinded?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reviewsService.adminList({
      keyword,
      rating: rating ? Number(rating) : undefined,
      isBlinded: isBlinded === undefined ? undefined : isBlinded === 'true',
      dateFrom,
      dateTo,
    });
  }

  @Patch(':id/blind')
  @ApiOperation({ summary: '후기 블라인드 처리/해제 — 즉시 고객·업체 화면에서 숨김' })
  setBlinded(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetReviewBlindedDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.reviewsService.setBlinded(id, dto.isBlinded, me.username);
  }
}
