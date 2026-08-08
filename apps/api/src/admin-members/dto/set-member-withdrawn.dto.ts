// PATCH /admin/members/:id 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetMemberWithdrawnDto {
  @ApiProperty({ description: 'true면 탈퇴 처리, false면 탈퇴 취소(복구)' })
  @IsBoolean()
  withdrawn: boolean;
}
