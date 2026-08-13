// 브라우저 Geolocation API 래퍼 — 위치 정보는 "있으면 거리순 정렬에 쓰는" 부가 기능이라, 권한 거부·미지원·
// 타임아웃 등 어떤 이유로든 실패하면 예외를 던지지 않고 null만 반환한다(호출부가 별도 에러 처리 없이 쓸 수 있게)
export function getCurrentPosition(timeoutMs = 5000): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}
