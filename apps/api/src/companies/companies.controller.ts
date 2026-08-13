// GET/POST/PATCH /admin/companies(/:id) — AD-CO-02/03/04 업체 관리 화면 전용, 관리자 로그인 필요
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { CurrentAdmin } from '../admin-auth/decorators/current-admin.decorator';
import type { SafeAdminAccount } from '../admin-auth/admin-auth.types';
import { UpdateShopDto } from '../shops/dto/update-shop.dto';
import { UploadShopPhotoDto } from '../shops/dto/upload-shop-photo.dto';
import { CompaniesService } from './companies.service';
import { DealerShopMappingService } from './dealer-shop-mapping.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreatePartnerUserDto } from './dto/create-partner-user.dto';
import { UpdatePartnerUserDto } from './dto/update-partner-user.dto';
import { AddCompanyHolidaysDto } from './dto/add-company-holidays.dto';
import { ReplaceCompanyTimeSlotsDto } from './dto/replace-company-time-slots.dto';
import { UpsertCompanyDailySlotDto } from './dto/upsert-company-daily-slot.dto';
import { UploadCompanyDocumentDto } from './dto/upload-company-document.dto';
import { SetDealerShopMappingsDto } from './dto/set-dealer-shop-mappings.dto';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly dealerShopMappingService: DealerShopMappingService,
  ) {}

  @Get()
  @ApiOperation({ summary: '업체 목록 조회' })
  list() {
    return this.companiesService.list();
  }

  @Post()
  @ApiOperation({
    summary: '업체 등록(시공업체는 신규 Shop 레코드도 함께 생성)',
  })
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '업체 정보 수정, 사용중지/재개' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Get(':id/shop')
  @ApiOperation({
    summary: '업체에 연결된 매장(Shop) 상세 조회 — 시공업체 타입 전용',
  })
  getShop(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getShop(id);
  }

  @Patch(':id/shop')
  @ApiOperation({
    summary: '업체에 연결된 매장(Shop) 정보 수정 — 시공업체 타입 전용',
  })
  updateShop(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShopDto,
  ) {
    return this.companiesService.updateShop(id, dto);
  }

  @Get(':id/partner-users')
  @ApiOperation({
    summary: '업체 소속 사용자(PartnerUser) 계정 목록 — 시공업체 타입 전용',
  })
  listPartnerUsers(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.listPartnerUsers(id);
  }

  @Get(':id/partner-users/check-username')
  @ApiOperation({ summary: '사용자 계정 추가 화면의 아이디 중복 확인' })
  checkPartnerUsername(
    @Param('id', ParseIntPipe) id: number,
    @Query('username') username: string,
  ) {
    return this.companiesService.checkPartnerUsernameAvailable(username);
  }

  @Post(':id/partner-users')
  @ApiOperation({
    summary:
      '업체 소속 사용자 계정 추가 — 임시 비밀번호를 발급해 응답에 1회 포함',
  })
  createPartnerUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePartnerUserDto,
  ) {
    return this.companiesService.createPartnerUser(id, dto);
  }

  @Patch(':id/partner-users/:userId')
  @ApiOperation({
    summary: '업체 소속 사용자 계정 수정(이름·이메일·휴대폰·사용여부)',
  })
  updatePartnerUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId') userId: string,
    @Body() dto: UpdatePartnerUserDto,
  ) {
    return this.companiesService.updatePartnerUser(id, userId, dto);
  }

  @Delete(':id/partner-users/:userId')
  @ApiOperation({ summary: '업체 소속 사용자 계정 삭제' })
  deletePartnerUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId') userId: string,
  ) {
    return this.companiesService.deletePartnerUser(id, userId);
  }

  @Post(':id/shop/photos')
  @ApiOperation({
    summary: '매장 사진 업로드 — MAIN은 교체, CASE는 최대 10장 추가',
  })
  uploadShopPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UploadShopPhotoDto,
  ) {
    return this.companiesService.uploadShopPhoto(id, dto);
  }

  @Delete(':id/shop/photos/:photoId')
  @ApiOperation({ summary: '매장 사진 삭제' })
  deleteShopPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    return this.companiesService.deleteShopPhoto(id, photoId);
  }

  @Get(':id/holidays')
  @ApiOperation({ summary: '월 단위 휴무일 조회' })
  listHolidays(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.companiesService.listHolidays(id, Number(year), Number(month));
  }

  @Post(':id/holidays')
  @ApiOperation({ summary: '휴무일 일괄 등록' })
  async addHolidays(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCompanyHolidaysDto,
  ) {
    await this.companiesService.addHolidays(id, dto.dates);
    return { success: true };
  }

  @Delete(':id/holidays/:date')
  @ApiOperation({ summary: '휴무일 개별 해제' })
  async removeHoliday(
    @Param('id', ParseIntPipe) id: number,
    @Param('date') date: string,
  ) {
    await this.companiesService.removeHoliday(id, date);
    return { success: true };
  }

  @Get(':id/time-slots/:dayType')
  @ApiOperation({ summary: '요일구분별 예약가능 시간대 템플릿 조회' })
  getTimeSlots(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayType') dayType: string,
  ) {
    return this.companiesService.getTimeSlots(id, dayType);
  }

  @Put(':id/time-slots/:dayType')
  @ApiOperation({
    summary: '요일구분별 예약가능 시간대 템플릿 저장(전체 교체)',
  })
  async replaceTimeSlots(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayType') dayType: string,
    @Body() dto: ReplaceCompanyTimeSlotsDto,
  ) {
    await this.companiesService.replaceTimeSlots(id, dayType, dto.slots);
    return { success: true };
  }

  @Get(':id/daily-schedule')
  @ApiOperation({
    summary: '일자별 예약 스케줄 조회(템플릿+오버라이드+예약 병합)',
  })
  getDailySchedule(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ) {
    return this.companiesService.getDailySchedule(id, date);
  }

  @Patch(':id/daily-slots')
  @ApiOperation({ summary: '특정 일자·시간의 정원/잠금 오버라이드' })
  async upsertDailySlot(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertCompanyDailySlotDto,
  ) {
    await this.companiesService.upsertDailySlot(id, dto);
    return { success: true };
  }

  @Post(':id/documents')
  @ApiOperation({
    summary:
      '사업자 등록증/통장사본 첨부 업로드(이미지 또는 PDF) — 기존 파일은 교체',
  })
  uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UploadCompanyDocumentDto,
  ) {
    return this.companiesService.uploadCompanyDocument(id, dto);
  }

  @Delete(':id/documents/:docType')
  @ApiOperation({ summary: '사업자 등록증/통장사본 첨부 삭제' })
  deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('docType') docType: 'BIZ_REG_CERT' | 'BANKBOOK_COPY',
  ) {
    return this.companiesService.deleteCompanyDocument(id, docType);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: '업체 승인 — 승인되어야 소속 로그인 계정이 정상 로그인 가능',
  })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() me: SafeAdminAccount,
  ) {
    return this.companiesService.approveCompany(id, me.username);
  }

  @Post(':id/revoke-approval')
  @ApiOperation({ summary: '업체 승인 취소' })
  revokeApproval(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.revokeCompanyApproval(id);
  }

  @Get(':id/shop-mappings')
  @ApiOperation({
    summary:
      '딜러사-시공업체 매핑 현황 조회(AD-NCPK-04) — 딜러사 타입 업체 전용',
  })
  getShopMappings(@Param('id', ParseIntPipe) id: number) {
    return this.dealerShopMappingService.getMappedShopCodes(id);
  }

  @Put(':id/shop-mappings')
  @ApiOperation({
    summary: '딜러사-시공업체 매핑 체크리스트 전체 교체 저장(AD-NCPK-04)',
  })
  setShopMappings(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetDealerShopMappingsDto,
  ) {
    return this.dealerShopMappingService.setMappedShopCodes(id, dto);
  }
}
