// apps/api(NestJS) 서버 주소 - 개발 중에는 로컬 서버, 배포 후에는 실제 API 서버 URL로 교체
// 모바일 앱(웹뷰) 안에서 로컬 개발 서버를 바라볼 때는 apps/motopay-mobile과 마찬가지로
// "adb reverse tcp:3000 tcp:3000"이 필요함(에뮬레이터의 localhost는 호스트 PC의 localhost와 다름)
// 테스트서버: api가 customer-app(8090)/partner-app(8091)과 별도 origin(8092)으로 직접 노출됨
export const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "http://221.141.3.91:8092";

// 카카오맵 JavaScript SDK 키(업체 프로필 "위치" 지도 표시용) — apps/api의 KAKAO_REST_API_KEY(서버 지오코딩용)와는
// 발급 종류가 다른 별개의 키. .env의 VITE_KAKAO_JS_KEY로 주입(카카오 디벨로퍼스에 이 앱이 서비스되는 도메인이
// "Web 플랫폼"으로 등록돼 있어야 정상 로드됨)
export const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
