// apps/api(NestJS) 서버 주소 - 개발 중에는 로컬 서버, 배포 후에는 실제 API 서버 URL로 교체
// customer-app과 동일한 백엔드를 공유함(별도 파트너 전용 서버 아님)
export const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "http://221.141.3.91:8092";
