// GET /shops(목록)/GET /shops/:shopCode(상세) — 로그인 불필요, 시공업체 조회용
// GET·PATCH /shops/me, POST·DELETE /shops/me/photos — 파트너 로그인 계정 전용(반드시 :shopCode 라우트보다 먼저 선언)
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
import { CurrentPartnerUser } from '../partner-auth/decorators/current-partner-user.decorator';
import { JwtPartnerAuthGuard } from '../partner-auth/guards/jwt-partner-auth.guard';
import type { SafePartnerUser } from '../partner-auth/partner-auth.types';
import { UpdateShopDto } from './dto/update-shop.dto';
import { UploadShopPhotoDto } from './dto/upload-shop-photo.dto';
import { ShopsService } from './shops.service';

@ApiTags('shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @ApiOperation({
    summary:
      '시공업체 목록 조회 — instCodes(콤마구분)로 시공가능 카테고리를 모두 지원하는 업체만 필터, lat/lng 지정 시 거리순 정렬',
  })
  list(
    @Query('instCodes') instCodes?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    const latNum = lat !== undefined ? Number(lat) : undefined;
    const lngNum = lng !== undefined ? Number(lng) : undefined;

    return this.shopsService.list({
      instCodes: instCodes ? instCodes.split(',').filter(Boolean) : undefined,
      lat: latNum !== undefined && Number.isFinite(latNum) ? latNum : undefined,
      lng: lngNum !== undefined && Number.isFinite(lngNum) ? lngNum : undefined,
    });
  }

  @Get('me')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 업체 조회(파트너 로그인 전용) — 사진·시공가능 카테고리 포함',
  })
  getMyShop(@CurrentPartnerUser() partnerUser: SafePartnerUser) {
    return this.shopsService.getDetail(partnerUser.shopCode);
  }

  @Patch('me')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 업체 기본정보 수정(파트너 로그인 전용) — 보낸 필드만 반영',
  })
  updateMyShop(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.updateMyShop(partnerUser.shopCode, dto);
  }

  @Post('me/photos')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '내 업체 사진 업로드(파트너 로그인 전용) — MAIN은 교체(항상 1장), CASE는 추가(최대 10장)',
  })
  uploadMyShopPhoto(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Body() dto: UploadShopPhotoDto,
  ) {
    return this.shopsService.uploadPhoto(partnerUser.shopCode, dto);
  }

  @Delete('me/photos/:photoId')
  @UseGuards(JwtPartnerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 업체 사진 삭제(파트너 로그인 전용)' })
  deleteMyShopPhoto(
    @CurrentPartnerUser() partnerUser: SafePartnerUser,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    return this.shopsService.deletePhoto(partnerUser.shopCode, photoId);
  }

  @Get(':shopCode')
  @ApiOperation({ summary: '시공업체 상세 조회 — 사진·시공가능 카테고리 포함' })
  getDetail(@Param('shopCode') shopCode: string) {
    return this.shopsService.getDetail(shopCode);
  }
}
