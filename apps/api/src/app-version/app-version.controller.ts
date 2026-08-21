// GET /app-version/policy — 앱 강제 업데이트 정책 조회. 화면 진입 전에 호출돼야 하므로 인증 불필요(공개 API)
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppVersionService } from './app-version.service';

@ApiTags('app-version')
@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get('policy')
  @ApiOperation({
    summary: '앱 강제 업데이트 정책 조회(공개) — customer-app/partner-app이 motopay-mobile 안에서 진입 시 호출',
  })
  getPolicy(@Query('platform') platform: string = 'ANDROID') {
    return this.appVersionService.getPolicy(platform);
  }
}
