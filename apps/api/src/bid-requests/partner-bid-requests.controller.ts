// GET /shops/me/bid-requests(내 업체로 입찰의뢰가 온 예약시공 요청 목록),
// POST /shops/me/bid-requests/:requestNo/offers(입찰 제출 — 항목별 견적),
// POST /shops/me/bid-requests/:requestNo/plans(추천안 제출 — 전문가추천) — 파트너(시공업체) 로그인 전용
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartnerUser } from '../partner-auth/decorators/current-partner-user.decorator';
import { JwtPartnerAuthGuard } from '../partner-auth/guards/jwt-partner-auth.guard';
import type { SafePartnerUser } from '../partner-auth/partner-auth.types';
import { BidRequestsService } from './bid-requests.service';
import { SubmitBidOfferDto } from './dto/submit-bid-offer.dto';
import { SubmitBidPlanDto } from './dto/submit-bid-plan.dto';

@ApiTags('bid-requests')
@ApiBearerAuth()
@UseGuards(JwtPartnerAuthGuard)
@Controller('shops/me/bid-requests')
export class PartnerBidRequestsController {
  constructor(private readonly bidRequestsService: BidRequestsService) {}

  @Get()
  @ApiOperation({
    summary: '내 업체로 입찰의뢰가 온 예약시공 요청 목록(입찰함)',
  })
  listInvited(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.bidRequestsService.listInvitedForShop(partnerUser.shopCode);
  }

  @Post(':requestNo/offers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      '입찰 제출(항목별 견적) — 고객이 업체를 선택하기 전까지는 재제출로 수정 가능',
  })
  async submitOffer(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('requestNo') requestNo: string,
    @Body() dto: SubmitBidOfferDto,
  ) {
    await this.bidRequestsService.submitOffer(
      partnerUser.shopCode,
      requestNo,
      dto,
    );
    return { success: true };
  }

  @Post(':requestNo/plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      '추천안 제출(상품·부위/농도·시공시각·사유) — 고객이 업체를 선택하기 전까지는 재제출로 수정 가능',
  })
  async submitPlan(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('requestNo') requestNo: string,
    @Body() dto: SubmitBidPlanDto,
  ) {
    await this.bidRequestsService.submitPlan(
      partnerUser.shopCode,
      requestNo,
      dto,
    );
    return { success: true };
  }
}
