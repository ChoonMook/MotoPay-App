// 고객앱(apps/customer-app) 웹 주소 - 개발 중에는 로컬 customer-app dev 서버, 배포 후에는 실제 운영 서버 주소
export const CUSTOMER_APP_URL = import.meta.env.DEV
  ? "http://localhost:5173"
  : "http://221.141.3.91:8090";
