// POST /partner-auth/request-password-reset 요청 바디 검증
// 파트너 계정은 자체 가입이 없으므로(콜센터 발급) 휴대폰번호만으로는 본인확인이 약하다고 보고 아이디도 함께 요구
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class PartnerRequestPasswordResetDto {
  @ApiProperty({ example: 'shop12345', description: '파트너 아이디' })
  @IsString()
  username: string;

  @ApiProperty({ example: '홍길동', description: '계정 발급 시 등록한 담당자명' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '010-1234-5678',
    description: '계정 발급 시 등록한 휴대폰번호(하이픈 있어도/없어도 됨)',
  })
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 휴대폰번호 형식이 아닙니다.',
  })
  phone: string;
}
