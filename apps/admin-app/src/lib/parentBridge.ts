// 콘텐츠 페이지(iframe 내부)에서 부모 창(AdminShell)의 탭을 열기 위한 브릿지.
// 원본 Site.Master가 콘텐츠 쪽 버튼에 "onclick=window.parent.openTab(path, label)"을 쓰던 패턴과 동일 —
// AdminShell.tsx가 자신의 openTab을 window.openTab으로 노출해두면, iframe 안의 콘텐츠 페이지는
// react-router의 navigate() 대신 이 함수로 부모의 탭을 연다.
// (iframe 안에서 navigate()를 쓰면 그 iframe 자신의 location만 바뀌면서 URL의 ?frame=Y가 함께
// 사라져, 그 iframe이 쉘을 다시 그려버리는(중첩 렌더링) 문제가 생긴다.)
declare global {
  interface Window {
    openTab?: (path: string, label: string) => void;
  }
}

export function openInParent(path: string, label: string): void {
  if (window.parent !== window && window.parent.openTab) {
    window.parent.openTab(path, label);
  }
}
