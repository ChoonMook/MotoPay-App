// PATCH /partner-auth/me/password 요청 바디 검증 — 최초 로그인 강제 변경과 일반 변경 모두 동일 엔드포인트 사용
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class PartnerChangePasswordDto {
  @ApiProperty({ description: '현재 비밀번호(발급받은 초기 비밀번호 포함)' })
  @IsString()
  currentPassword: string;

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
