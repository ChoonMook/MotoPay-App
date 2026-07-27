// apps/api(NestJS) 서버 주소 - 개발 중에는 로컬 서버, 배포 후에는 실제 API 서버 URL로 교체
// 모바일 앱(웹뷰) 안에서 로컬 개발 서버를 바라볼 때는 apps/customer-mobile과 마찬가지로
// "adb reverse tcp:3000 tcp:3000"이 필요함(에뮬레이터의 localhost는 호스트 PC의 localhost와 다름)
// 테스트서버: api가 customer-app(8090)/partner-app(8091)과 별도 origin(8092)으로 직접 노출됨
export const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "http://221.141.3.91:8092";
