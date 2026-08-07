// 콘텐츠 페이지(iframe 내부)에서 부모 창(AdminShell)의 탭을 열기 위한 브릿지.
// 원본 Site.Master가 콘텐츠 쪽 버튼에 "onclick=window.parent.openTab(path, label)"을 쓰던 패턴과 동일 —
// AdminShell.tsx가 자신의 openTab을 window.openTab으로 노출해두면, iframe 안의 콘텐츠 페이지는
// react-router의 navigate() 대신 이 함수로 부모의 탭을 연다.
// (iframe 안에서 navigate()를 쓰면 그 iframe 자신의 location만 바뀌면서 URL의 ?frame=Y가 함께
// 사라져, 그 iframe이 쉘을 다시 그려버리는(중첩 렌더링) 문제가 생긴다.)
declare global {
  interface Window {
    openTab?: (path: string, label: string) => void;
    adjustApiBusyCount?: (delta: number) => void;
  }
}

export function openInParent(path: string, label: string): void {
  if (window.parent !== window && window.parent.openTab) {
    window.parent.openTab(path, label);
  }
}

/** apps/api 요청 시작(+1)/종료(-1)를 부모 창(AdminShell)에 알려 사이드바 로고를 트랜잭션 처리 중에는
 * 빠르게 회전시킨다(lib/http.ts가 요청마다 호출). AdminShell이 카운트를 0보다 큰 동안만 "처리 중"으로 본다. */
export function notifyApiBusyDelta(delta: 1 | -1): void {
  if (window.parent !== window && window.parent.adjustApiBusyCount) {
    window.parent.adjustApiBusyCount(delta);
  }
}
