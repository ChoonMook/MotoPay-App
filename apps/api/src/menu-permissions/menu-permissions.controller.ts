// GET/PUT /admin/menu-permissions/:permGroup — AD-SYS-05 메뉴권한관리 화면 전용, 관리자 로그인 필요
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminAuthGuard } from '../admin-auth/guards/jwt-admin-auth.guard';
import { MenuPermissionsService } from './menu-permissions.service';
import { SaveMenuPermissionsDto } from './dto/save-menu-permissions.dto';

@ApiTags('menu-permissions')
@ApiBearerAuth()
@UseGuards(JwtAdminAuthGuard)
@Controller('admin/menu-permissions')
export class MenuPermissionsController {
  constructor(
    private readonly menuPermissionsService: MenuPermissionsService,
  ) {}

  @Get(':permGroup')
  @ApiOperation({ summary: '권한그룹별 메뉴 권한 목록 조회' })
  list(@Param('permGroup') permGroup: string) {
    return this.menuPermissionsService.list(permGroup);
  }

  @Put(':permGroup')
  @ApiOperation({ summary: '권한그룹별 메뉴 권한 매트릭스 일괄 저장' })
  saveAll(
    @Param('permGroup') permGroup: string,
    @Body() dto: SaveMenuPermissionsDto,
  ) {
    return this.menuPermissionsService.saveAll(permGroup, dto.rows);
  }
}
