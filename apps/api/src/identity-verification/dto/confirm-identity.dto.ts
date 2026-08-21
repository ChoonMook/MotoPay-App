// POST /identity-verification/confirm 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmIdentityDto {
  @ApiProperty({ description: 'PortOne.requestIdentityVerification()으로 발급받은 본인인증 건 ID' })
  @IsString()
  @MinLength(1)
  identityVerificationId: string;
}
