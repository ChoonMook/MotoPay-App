// POST /auth/find-username 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class FindUsernameDto {
  @ApiProperty({ example: '홍길동', description: '가입 시 등록한 이름' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '010-1234-5678',
    description: '가입 시 등록한 휴대폰번호(하이픈 있어도/없어도 됨)',
  })
  @IsString()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 휴대폰번호 형식이 아닙니다.',
  })
  phone: string;
}
