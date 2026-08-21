// PATCH /admin/app-version-policies/:platform 요청 바디 검증
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAppVersionPolicyDto {
  @ApiPropertyOptional({ description: '최소 지원 버전코드(이 값 미만은 강제 업데이트 대상)' })
  @IsOptional()
  @IsInt()
  minVersionCode?: number;

  @ApiPropertyOptional({ description: '최소 지원 버전 표시명(예: "0.0.0.3")' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  minVersionName?: string;

  @ApiPropertyOptional({ description: '최신 배포 버전코드(참고용 표시)' })
  @IsOptional()
  @IsInt()
  latestVersionCode?: number;

  @ApiPropertyOptional({ description: '최신 배포 버전 표시명(참고용 표시)' })
  @IsOptional()
  @IsString()
  latestVersionName?: string;

  @ApiPropertyOptional({ description: '강제 업데이트 화면에서 안내할 APK 다운로드 URL' })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ description: '강제 업데이트 화면 안내 문구' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;

  @ApiPropertyOptional({ description: '강제 업데이트 기능 사용여부' })
  @IsOptional()
  @IsBoolean()
  useYn?: boolean;
}
