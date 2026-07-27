// 웹뷰가 로드할 apps/customer-app 주소 - 개발 중에는 로컬 Vite dev 서버, 배포 후에는 실제 호스팅 URL로 교체
// localhost:5173으로 접속 가능하려면 실행 전 "adb reverse tcp:5173 tcp:5173"이 필요함(에뮬레이터·실기기 USB 디버깅 공용,
// 10.0.2.2 방식은 에뮬레이터 전용인 데다 Vite가 IPv6(::1)로만 바인딩되면 연결이 안 되는 문제가 있어 이 방식을 채택함)
// 운영 서버는 http(비TLS)라 app.json의 usesCleartextTraffic: true가 dev용이 아니라 운영에도 그대로 필요함
export const WEB_URL = __DEV__ ? "http://localhost:5173" : "http://221.141.3.91:8090";
