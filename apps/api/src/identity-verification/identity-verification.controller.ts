// POST /identity-verification/confirm — 회원가입 전 단계라 인증 불필요(공개 API)
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfirmIdentityDto } from './dto/confirm-identity.dto';
import { IdentityVerificationService } from './identity-verification.service';

@ApiTags('identity-verification')
@Controller('identity-verification')
export class IdentityVerificationController {
  constructor(private readonly identityVerificationService: IdentityVerificationService) {}

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PortOne 본인인증 결과 조회(이름·휴대폰번호 확인)' })
  confirm(@Body() dto: ConfirmIdentityDto) {
    return this.identityVerificationService.confirm(dto.identityVerificationId);
  }
}
