// 목록 화면 위에서 아래로 당기면 onRefresh를 호출하는 새로고침 제스처 래퍼 — 기존 스크롤 컨테이너(className으로 전달받는
// overflow-y-auto div)를 그대로 대체해서 쓴다. 화면 전체(WebView) 새로고침이 아니라 해당 화면의 데이터만 다시 불러오는
// 방식이라, SPA 상태(로그인·다른 화면 스택 등)는 그대로 유지된다
import { useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from "react";

const PULL_THRESHOLD = 70; // 이 이상 당겨야 새로고침 실행
const MAX_PULL = 100; // 인디케이터 최대 노출 높이
const DAMPING = 0.5; // 손가락 이동량 대비 실제 당김량 비율 — 고무줄처럼 저항감을 주기 위함

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, className, style, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    // 스크롤이 맨 위(scrollTop === 0)일 때만 당기기 시작 — 목록 중간에서 위로 스크롤하는 동작과 구분
    if (refreshing || (containerRef.current?.scrollTop ?? 0) > 0) {
      startYRef.current = null;
      return;
    }
    startYRef.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    setPullDistance(delta > 0 ? Math.min(delta * DAMPING, MAX_PULL) : 0);
  };

  const onTouchEnd = async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const indicatorActive = refreshing || pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: refreshing ? PULL_THRESHOLD : pullDistance }}
      >
        <div
          className={`h-5 w-5 rounded-full border-2 border-gray-300 border-t-brand ${indicatorActive ? "animate-spin" : ""}`}
        />
      </div>
      {children}
    </div>
  );
}
