// GET/POST/PATCH /admin/new-car-purchases(/:vin)(/bulk)(/:vin/confirm) — DL-NCPK-01~04 신차 구매내역 입력
// 화면 전용, 관리자 로그인 필요(딜러 직원·플랫폼 관리자 모두 AdminAccount로 접근)
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { BulkCreateNewCarPurchasesDto } from './dto/bulk-create-new-car-purchases.dto';
import { CreateNewCarPurchaseDto } from './dto/create-new-car-purchase.dto';
import { UpdateNewCarPurchaseDto } from './dto/update-new-car-purchase.dto';
import { NewCarPurchasesService } from './new-car-purchases.service';

@ApiTags('admin-new-car-purchases')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/new-car-purchases')
export class AdminNewCarPurchasesController {
  constructor(private readonly newCarPurchasesService: NewCarPurchasesService) {}

  @Get()
  @ApiOperation({ summary: '등록 내역 조회(DL-NCPK-04) — 고객명·VIN 검색, 확정상태 필터' })
  list(@Query('keyword') keyword?: string, @Query('confirmed') confirmed?: string) {
    return this.newCarPurchasesService.list({
      keyword,
      confirmed: confirmed === undefined ? undefined : confirmed === 'true',
    });
  }

  @Get(':vin')
  @ApiOperation({ summary: '구매 내역 상세 조회' })
  get(@Param('vin') vin: string) {
    return this.newCarPurchasesService.get(vin);
  }

  @Post()
  @ApiOperation({ summary: '구매 내역 직접 등록(DL-NCPK-02)' })
  create(@Body() dto: CreateNewCarPurchaseDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.newCarPurchasesService.create(dto, me.username);
  }

  @Post('bulk')
  @ApiOperation({ summary: '엑셀 일괄업로드로 파싱한 행 목록 일괄 등록(DL-NCPK-03) — 행별 개별 성공/실패 반환' })
  bulkCreate(@Body() dto: BulkCreateNewCarPurchasesDto, @CurrentAdmin() me: SafeAdminAccount) {
    return this.newCarPurchasesService.bulkCreate(dto.rows, me.username);
  }

  @Patch(':vin')
  @ApiOperation({ summary: '구매 내역 수정 — 확정된 건은 관리자(accountType=ADMIN)만 수정 가능' })
  update(
    @Param('vin') vin: string,
    @Body() dto: UpdateNewCarPurchaseDto,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.newCarPurchasesService.update(vin, dto, me);
  }

  @Post(':vin/confirm')
  @ApiOperation({ summary: '등록→확정 상태 전환(DL-NCPK-04)' })
  confirm(@Param('vin') vin: string, @CurrentAdmin() me: SafeAdminAccount) {
    return this.newCarPurchasesService.confirm(vin, me);
  }
}
