// POST /auth/signup 요청 바디 검증
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    example: 'motouser01',
    description: '아이디(영문·숫자 4~20자)',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9]{4,20}$/, {
    message: '아이디는 영문·숫자 4~20자여야 합니다.',
  })
  username: string;

  @ApiProperty({
    example: 'Password12!',
    description: '비밀번호(8자 이상, 영문+숫자+특수문자 포함)',
  })
  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/, {
    message: '비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.',
  })
  password: string;

  @ApiProperty({
    example: 'user@example.com',
    description: '알림·영수증 수신용 이메일',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description:
      'PortOne.requestIdentityVerification()으로 발급받은 본인인증 건 ID — 이름·휴대폰번호는 이 값으로 서버가 PortOne에서 직접 조회해 확정하므로 클라이언트가 별도로 보내지 않음',
  })
  @IsString()
  @MinLength(1)
  identityVerificationId: string;

  @ApiProperty({ description: '서비스 이용약관 동의(필수 — true여야 함)' })
  @IsBoolean()
  @Equals(true, { message: '서비스 이용약관에 동의해야 가입할 수 있습니다.' })
  agreedTerms: boolean;

  @ApiProperty({ description: '개인정보 처리방침 동의(필수 — true여야 함)' })
  @IsBoolean()
  @Equals(true, { message: '개인정보 처리방침에 동의해야 가입할 수 있습니다.' })
  agreedPrivacy: boolean;

  @ApiPropertyOptional({
    description: '마케팅 SMS 수신 동의(선택)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  agreedMarketingSms?: boolean;

  @ApiPropertyOptional({
    description: '마케팅 이메일 수신 동의(선택)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  agreedMarketingEmail?: boolean;

  @ApiPropertyOptional({
    description: '마케팅 푸시 수신 동의(선택)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  agreedMarketingPush?: boolean;
}
