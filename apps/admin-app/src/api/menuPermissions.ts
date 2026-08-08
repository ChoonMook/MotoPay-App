// apps/api의 메뉴 권한 엔드포인트(/admin/menu-permissions/*) 호출 — AD-SYS-05 메뉴권한관리 화면 전용
import { authedRequest } from "./http";

export interface MenuPermissionRow {
  menuPgId: string;
  canAccess: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canFile: boolean;
}

export function listMenuPermissions(permGroup: string): Promise<MenuPermissionRow[]> {
  return authedRequest<MenuPermissionRow[]>(`/admin/menu-permissions/${permGroup}`);
}

export function saveMenuPermissions(permGroup: string, rows: MenuPermissionRow[]): Promise<MenuPermissionRow[]> {
  return authedRequest<MenuPermissionRow[]>(`/admin/menu-permissions/${permGroup}`, {
    method: "PUT",
    body: JSON.stringify({ rows }),
  });
}
