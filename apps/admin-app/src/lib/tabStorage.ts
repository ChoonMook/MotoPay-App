// 열린 탭 목록·활성 탭 sessionStorage 저장 - 원본 Site.Master의 partners_tabs_v2/partners_active_tab을 그대로 이식
import { DEFAULT_MENU_ITEM } from "./menuConfig";

export interface AdminTab {
  path: string;
  label: string;
}

export const DEFAULT_TAB: AdminTab = { path: DEFAULT_MENU_ITEM.path, label: DEFAULT_MENU_ITEM.label };

const TABS_KEY = "admin_tabs_v1";
const ACTIVE_TAB_KEY = "admin_active_tab_v1";

export function loadTabs(): AdminTab[] {
  const raw = sessionStorage.getItem(TABS_KEY);
  if (!raw) return [DEFAULT_TAB];
  try {
    const parsed = JSON.parse(raw) as AdminTab[];
    return parsed.length > 0 ? parsed : [DEFAULT_TAB];
  } catch {
    return [DEFAULT_TAB];
  }
}

export function loadActiveTab(): string {
  return sessionStorage.getItem(ACTIVE_TAB_KEY) ?? DEFAULT_TAB.path;
}

export function saveTabState(tabs: AdminTab[], activeTab: string): void {
  sessionStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  sessionStorage.setItem(ACTIVE_TAB_KEY, activeTab);
}

export function clearTabStorage(): void {
  sessionStorage.removeItem(TABS_KEY);
  sessionStorage.removeItem(ACTIVE_TAB_KEY);
}
