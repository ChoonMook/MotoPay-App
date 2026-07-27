// 파트너(시공업체)앱 웹 주소 - 개발 중에는 로컬 partner-app dev 서버, 배포 후에는 실제 파트너앱 URL로 교체
export const PARTNER_APP_URL = import.meta.env.DEV
  ? "http://localhost:5174"
  : "http://221.141.3.91:8091";
