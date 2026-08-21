// POST /phone-verification/send-code, POST /phone-verification/verify-code — 회원가입 전 단계라 인증 불필요(공개 API)
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendPhoneCodeDto } from './dto/send-phone-code.dto';
import { VerifyPhoneCodeDto } from './dto/verify-phone-code.dto';
import { PhoneVerificationService } from './phone-verification.service';

@ApiTags('phone-verification')
@Controller('phone-verification')
export class PhoneVerificationController {
  constructor(private readonly phoneVerificationService: PhoneVerificationService) {}

  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SMS 인증번호 발송(휴대폰 소유 확인용)' })
  async sendCode(@Body() dto: SendPhoneCodeDto) {
    await this.phoneVerificationService.sendCode(dto.phone, dto.purpose);
    return { success: true };
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SMS 인증번호 검증' })
  async verifyCode(@Body() dto: VerifyPhoneCodeDto) {
    await this.phoneVerificationService.verifyCode(dto.phone, dto.code, dto.purpose);
    return { success: true };
  }
}
