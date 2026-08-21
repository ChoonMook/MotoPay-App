// 안드로이드 하드웨어 백버튼을 화면별 뒤로가기로 연결하는 핸들러 스택
// 네이티브(motopay-mobile)가 하드웨어 백버튼을 누르면 window.__motoConsumeBack()을 호출해
// 현재 열려 있는 화면·시트가 자체 뒤로가기를 처리했는지 확인함(처리 못 하면 네이티브가 앱을 종료)
type BackAction = () => void;

const stack: BackAction[] = [];

/** 현재 화면(또는 시트)이 떠 있는 동안 뒤로가기 동작을 등록. 반환된 함수를 호출하면 해제됨(useEffect cleanup용) */
export function pushBackAction(action: BackAction): () => void {
  stack.push(action);
  return () => {
    const idx = stack.lastIndexOf(action);
    if (idx !== -1) stack.splice(idx, 1);
  };
}

declare global {
  interface Window {
    __motoConsumeBack?: () => boolean;
  }
}

if (typeof window !== "undefined") {
  window.__motoConsumeBack = () => {
    const action = stack[stack.length - 1];
    if (!action) return false;
    action();
    return true;
  };
}
