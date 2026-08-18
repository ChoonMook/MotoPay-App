// GET /admin/bid-requests, GET /admin/bid-requests/:requestNo — AD-RSVC-02 예약시공현황(일반입찰·전문가추천 통합 모니터링)
// 관리자 로그인 전용, 조회 전용(수정 없음)
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { BidRequestsService } from './bid-requests.service';

@ApiTags('admin-bid-requests')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/bid-requests')
export class AdminBidRequestsController {
  constructor(private readonly bidRequestsService: BidRequestsService) {}

  @Get()
  @ApiOperation({
    summary:
      '예약시공현황 목록(AD-RSVC-02) — 일반입찰·전문가추천 통합, 고객명/요청번호 검색·요청유형·상태 필터',
  })
  list(
    @Query('keyword') keyword?: string,
    @Query('reqType') reqType?: string,
    @Query('status') status?: string,
  ) {
    return this.bidRequestsService.adminList({ keyword, reqType, status });
  }

  @Get(':requestNo')
  @ApiOperation({
    summary:
      '예약시공현황 상세 — 요청 원본 + 일반입찰은 응찰 전체, 전문가추천은 추천안 전체',
  })
  getDetail(@Param('requestNo') requestNo: string) {
    return this.bidRequestsService.adminGetDetail(requestNo);
  }
}
