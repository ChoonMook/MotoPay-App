// 권한그룹별 관리자웹 메뉴 권한(AD-SYS-05 메뉴권한관리) 조회/일괄저장
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MenuPermissionRowDto } from './dto/save-menu-permissions.dto';

export interface MenuPermissionRow {
  menuPgId: string;
  canAccess: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canFile: boolean;
}

@Injectable()
export class MenuPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(permGroup: string): Promise<MenuPermissionRow[]> {
    const rows = await this.prisma.menuPermission.findMany({
      where: { permGroup },
    });
    return rows.map((r) => ({
      menuPgId: r.menuPgId,
      canAccess: r.canAccess,
      canRead: r.canRead,
      canWrite: r.canWrite,
      canDelete: r.canDelete,
      canFile: r.canFile,
    }));
  }

  /** 매트릭스 전체를 한 번에 저장 — 전달된 행으로 해당 권한그룹의 기존 권한을 완전히 대체한다 */
  async saveAll(
    permGroup: string,
    rows: MenuPermissionRowDto[],
  ): Promise<MenuPermissionRow[]> {
    await this.prisma.$transaction([
      this.prisma.menuPermission.deleteMany({ where: { permGroup } }),
      this.prisma.menuPermission.createMany({
        data: rows
          .filter(
            (r) =>
              r.canAccess || r.canRead || r.canWrite || r.canDelete || r.canFile,
          )
          .map((r) => ({ ...r, permGroup })),
      }),
    ]);
    return this.list(permGroup);
  }
}
