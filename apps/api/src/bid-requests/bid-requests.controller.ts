// POST /bid-requests(예약시공 요청 생성 — 일반입찰/전문가추천), GET /bid-requests/me(내 요청 목록),
// PATCH /bid-requests/:id/cancel(요청 취소 — OPEN 상태만, 취소사유 바디 필수),
// GET /bid-requests/:id/offers(도착한 입찰 목록 — 업체 비교), PATCH /bid-requests/:id/select(업체 선택),
// GET /bid-requests/:id/plans(도착한 추천안 목록 — 전문가추천), PATCH /bid-requests/:id/select-plan(추천안 선택) — 로그인 필요
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { SafeUser } from '../auth/auth.types';
import { BidRequestsService } from './bid-requests.service';
import { CreateBidRequestDto } from './dto/create-bid-request.dto';
import { CancelBidRequestDto } from './dto/cancel-bid-request.dto';
import { SelectBidOfferDto } from './dto/select-bid-offer.dto';
import { SelectBidPlanDto } from './dto/select-bid-plan.dto';

@ApiTags('bid-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bid-requests')
export class BidRequestsController {
  constructor(private readonly bidRequestsService: BidRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '예약시공 요청 생성(일반입찰/전문가추천)' })
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateBidRequestDto) {
    return this.bidRequestsService.create(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: '내 예약시공 요청 목록 조회' })
  listMine(@CurrentUser() user: SafeUser) {
    return this.bidRequestsService.listMine(user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '예약시공 요청 취소 — 입찰중(OPEN) 상태만 가능' })
  cancel(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBidRequestDto,
  ) {
    return this.bidRequestsService.cancel(user.id, id, dto);
  }

  @Get(':id/offers')
  @ApiOperation({ summary: '요청에 도착한 입찰 목록 조회(업체 비교)' })
  listOffers(@CurrentUser() user: SafeUser, @Param('id', ParseIntPipe) id: number) {
    return this.bidRequestsService.listOffersForRequest(user.id, id);
  }

  @Patch(':id/select')
  @ApiOperation({ summary: '입찰 중 하나를 선택 — 입찰중(OPEN) 상태만 가능, 선택 즉시 선정완료(SELECTED)로 전환' })
  select(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SelectBidOfferDto,
  ) {
    return this.bidRequestsService.selectOffer(user.id, id, dto.offerNo);
  }

  @Get(':id/plans')
  @ApiOperation({ summary: '요청에 도착한 추천안 목록 조회(업체 비교, 전문가추천 전용)' })
  listPlans(@CurrentUser() user: SafeUser, @Param('id', ParseIntPipe) id: number) {
    return this.bidRequestsService.listPlansForRequest(user.id, id);
  }

  @Patch(':id/select-plan')
  @ApiOperation({ summary: '추천안 중 하나를 선택 — 입찰중(OPEN) 상태만 가능, 선택 즉시 선정완료(SELECTED)로 전환' })
  selectPlan(
    @CurrentUser() user: SafeUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SelectBidPlanDto,
  ) {
    return this.bidRequestsService.selectPlan(user.id, id, dto.planNo);
  }
}
