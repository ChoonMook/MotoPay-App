// DATABASE_URL 문자열을 mariadb 드라이버의 PoolConfig로 변환
//
// timezone을 UTC("Z")로 고정하는 이유:
// @prisma/adapter-mariadb는 Date를 DB에 쓸 때 항상 UTC 기준 컴포넌트로 문자열을 만들어 보낸다(mariadb 드라이버의
// timezone 옵션과 무관하게 어댑터 자체가 그렇게 동작 — 확인 완료). 이 앱의 DB 커넥션 세션이 KST 등 다른 타임존이면
// 그 UTC 문자열이 "세션 타임존 기준"으로 잘못 해석돼 실제 시각이 어긋난다. 세션을 UTC로 맞춰야 Prisma가 보낸
// UTC 문자열이 그대로 UTC로 해석되어 정확히 저장된다.
//
// createdAt/updatedAt/lastLoginAt는 schema.prisma에서 DATETIME이 아니라 TIMESTAMP(@db.Timestamp)로 선언돼 있음 —
// TIMESTAMP는 MySQL/MariaDB가 세션 타임존 기준으로 자동 변환해주는 타입이라, 이 앱(UTC 세션)은 정확한 UTC 인스턴트를
// 유지하면서도, 다른 DB 클라이언트(서버 기본 세션 = 한국시간)로 직접 열어보면 자동으로 한국시간으로 보임.
export function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    timezone: 'Z',
  };
}
