// PATCH /admin-auth/me 요청 바디 검증 — 로그인한 관리자 본인의 이메일·휴대폰번호·비밀번호(선택) 수정
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateAdminMeDto {
  @ApiPropertyOptional({ example: 'admin@motopay.co.kr' })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @ApiPropertyOptional({ example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 휴대폰번호 형식이 아닙니다.',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: '변경 시에만 입력 — 8자 이상, 영문·숫자·특수문자 포함',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/, {
    message: '비밀번호는 8자 이상, 영문·숫자·특수문자를 모두 포함해야 합니다.',
  })
  newPassword?: string;
}
