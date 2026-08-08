// PUT /admin/menu-permissions/:permGroup 요청 바디 검증
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class MenuPermissionRowDto {
  @ApiProperty({ example: 'AD-MBR-02', description: '메뉴구조도 프로그램ID' })
  @IsString()
  @MinLength(1)
  menuPgId: string;

  @ApiProperty()
  @IsBoolean()
  canAccess: boolean;

  @ApiProperty()
  @IsBoolean()
  canRead: boolean;

  @ApiProperty()
  @IsBoolean()
  canWrite: boolean;

  @ApiProperty()
  @IsBoolean()
  canDelete: boolean;

  @ApiProperty()
  @IsBoolean()
  canFile: boolean;
}

export class SaveMenuPermissionsDto {
  @ApiProperty({ type: [MenuPermissionRowDto] })
  @ValidateNested({ each: true })
  @Type(() => MenuPermissionRowDto)
  rows: MenuPermissionRowDto[];
}
