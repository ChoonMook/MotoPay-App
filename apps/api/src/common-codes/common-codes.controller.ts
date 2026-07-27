// GET /common-codes/:code — 공통코드 상세 목록 조회(로그인 불필요, 브랜드/차종/딜러사명 등 참조용 데이터)
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommonCodesService } from './common-codes.service';

@ApiTags('common-codes')
@Controller('common-codes')
export class CommonCodesController {
  constructor(private readonly commonCodesService: CommonCodesService) {}

  @Get(':code')
  @ApiOperation({
    summary: '공통코드 상세 목록 조회 (예: CAR_BRAND, CAR_MODEL, DEALER)',
  })
  getDetails(@Param('code') code: string) {
    return this.commonCodesService.getDetails(code);
  }
}
