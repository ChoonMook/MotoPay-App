// 관리자웹 표준 ag-grid 설정 - AD-SYS-04(사용자 계정 관리) 화면에서 정립한 그리드 스타일을 표준으로 고정한다.
// 신규 목록(list) 화면은 이 값을 직접 쓰지 말고 components/DataGrid.tsx를 사용해 그리드를 구성한다.
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export const ADMIN_GRID_THEME = themeQuartz.withParams({
  accentColor: "var(--metaonce-primary)",
  backgroundColor: "#ffffff",
  foregroundColor: "var(--metaonce-on-surface)",
  borderColor: "#e3e5ec",
  headerBackgroundColor: "var(--metaonce-surface-container-low)",
  headerTextColor: "var(--metaonce-on-surface-variant)",
  headerFontWeight: 700,
  // 헤더 배경(연회색)과 같은 무채색 계열로는 hover와 헤더가 눈으로 구분되지 않아, 톤 자체를 다르게(연한 파란빛)
  // 가져가 헤더보다 밝으면서도 흰 배경(행) 위에서 또렷이 보이도록 함
  rowHoverColor: "rgba(27, 100, 242, 0.05)",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  spacing: 8,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  rowHeight: 44,
  headerHeight: 44,
});

export const ADMIN_GRID_LOCALE_KO = {
  page: "페이지",
  to: "-",
  of: "/",
  next: "다음",
  last: "마지막",
  first: "처음",
  previous: "이전",
  loadingOoo: "로딩 중...",
};

export const ADMIN_GRID_PAGE_SIZE_OPTIONS = [10, 50, 100] as const;
export const ADMIN_GRID_DEFAULT_PAGE_SIZE = 10;
