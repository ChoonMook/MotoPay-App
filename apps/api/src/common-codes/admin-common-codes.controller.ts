// GET/POST/PATCH/DELETE /admin/common-codes(/:code)(/details/:detailCode) — AD-SYS-03 공통 코드 관리
// 화면 전용, 관리자 로그인 필요
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { CommonCodesService } from './common-codes.service';
import { CreateCommonCodeDetailDto } from './dto/create-common-code-detail.dto';
import { CreateCommonCodeDto } from './dto/create-common-code.dto';
import { UpdateCommonCodeDetailDto } from './dto/update-common-code-detail.dto';
import { UpdateCommonCodeDto } from './dto/update-common-code.dto';
import { UploadCommonCodeDetailPhotoDto } from './dto/upload-common-code-detail-photo.dto';

@ApiTags('admin-common-codes')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/common-codes')
export class AdminCommonCodesController {
  constructor(private readonly commonCodesService: CommonCodesService) {}

  @Get()
  @ApiOperation({ summary: '공통코드 그룹 목록 조회(상단 그리드)' })
  listGroups() {
    return this.commonCodesService.listGroups();
  }

  @Get(':code')
  @ApiOperation({
    summary: '공통코드 그룹 + 상세 코드값 목록 조회(하단 그리드)',
  })
  getGroup(@Param('code') code: string) {
    return this.commonCodesService.getGroupWithDetails(code);
  }

  @Post()
  @ApiOperation({ summary: '코드그룹 추가' })
  createGroup(@Body() dto: CreateCommonCodeDto) {
    return this.commonCodesService.createGroup(dto);
  }

  @Patch(':code')
  @ApiOperation({ summary: '코드그룹 수정(그룹명·사용여부)' })
  updateGroup(@Param('code') code: string, @Body() dto: UpdateCommonCodeDto) {
    return this.commonCodesService.updateGroup(code, dto);
  }

  @Delete(':code')
  @ApiOperation({
    summary: '코드그룹 삭제 - 상세 코드값이 남아있으면 삭제 불가',
  })
  deleteGroup(@Param('code') code: string) {
    return this.commonCodesService.deleteGroup(code);
  }

  @Post(':code/details')
  @ApiOperation({ summary: '상세 코드값 추가' })
  createDetail(
    @Param('code') code: string,
    @Body() dto: CreateCommonCodeDetailDto,
  ) {
    return this.commonCodesService.createDetail(code, dto);
  }

  @Patch(':code/details/:detailCode')
  @ApiOperation({ summary: '상세 코드값 수정(코드명·정렬순서·사용여부 등)' })
  updateDetail(
    @Param('code') code: string,
    @Param('detailCode') detailCode: string,
    @Body() dto: UpdateCommonCodeDetailDto,
  ) {
    return this.commonCodesService.updateDetail(code, detailCode, dto);
  }

  @Delete(':code/details/:detailCode')
  @ApiOperation({ summary: '상세 코드값 삭제' })
  deleteDetail(
    @Param('code') code: string,
    @Param('detailCode') detailCode: string,
  ) {
    return this.commonCodesService.deleteDetail(code, detailCode);
  }

  @Post(':code/details/:detailCode/photo')
  @ApiOperation({
    summary: '상세 코드값 대표사진 업로드(ref2에 경로 저장) — 기존 파일은 교체',
  })
  uploadDetailPhoto(
    @Param('code') code: string,
    @Param('detailCode') detailCode: string,
    @Body() dto: UploadCommonCodeDetailPhotoDto,
  ) {
    return this.commonCodesService.uploadDetailPhoto(
      code,
      detailCode,
      dto.imageBase64,
    );
  }

  @Delete(':code/details/:detailCode/photo')
  @ApiOperation({ summary: '상세 코드값 대표사진 삭제' })
  deleteDetailPhoto(
    @Param('code') code: string,
    @Param('detailCode') detailCode: string,
  ) {
    return this.commonCodesService.deleteDetailPhoto(code, detailCode);
  }
}
