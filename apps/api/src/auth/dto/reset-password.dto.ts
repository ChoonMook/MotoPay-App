// POST /auth/reset-password 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'POST /auth/request-password-reset에서 발급받은 임시 토큰(10분 유효)',
  })
  @IsString()
  resetToken: string;

  @ApiProperty({
    example: 'NewPassw0rd!',
    description: '새 비밀번호(8자 이상, 영문+숫자+특수문자 포함)',
  })
  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/, {
    message: '비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.',
  })
  newPassword: string;
}
