# 컨텍스트 노트 — NestJS + Prisma + MariaDB 백엔드

## 배경
- 지금까지는 `apps/customer-app`(웹)·`apps/customer-mobile`(웹뷰 하이브리드 셸)만 존재하고 백엔드가 전혀 없는 상태였음. `AuthFlow.tsx`의 로그인은 `id==="user" && pw==="1234"`인 하드코딩 목업.
- 서버 사이드 프레임워크를 무엇으로 할지 논의 후 **NestJS**로 결정(TypeScript 공유, 데코레이터 기반 Guard로 5개 사용자 유형별 권한 분리에 적합, `@nestjs/swagger`로 CLAUDE.md Phase 2의 "API Contract 우선 정의" 원칙 충족, 자체 서버에 상시 Node 프로세스로 배포하기 쉬움).
- 이번 세션에서 "사용자 로그인 먼저 진행해 보자. NestJS, Prisma, MariaDB 환경이야"로 착수 결정.

## 주요 결정

- **User 모델 범위**: 유형별로 테이블을 나누지 않고 `User` 테이블 하나 + `role` enum(CUSTOMER/PARTNER/SHOP/SUPPLIER/ADMIN)으로 통합. 이유: CLAUDE.md에 5개 사용자 유형이 이미 명시돼 있고, 로그인 자체는 유형과 무관하게 동일한 흐름(아이디+비밀번호 검증 → 토큰 발급)이라 테이블을 나눌 이유가 없음. 유형별로 달라지는 건 로그인 이후의 권한(Guard)이라, 그건 Phase 이후 항목으로 미룸.
- **인증 방식**: 세션/쿠키 대신 JWT(access+refresh) 발급. `apps/customer-mobile`이 WebView 안에서 웹앱을 그대로 띄우는 구조라, 쿠키 기반 세션은 웹뷰-네이티브 경계에서 다루기 번거로움(서드파티 쿠키 정책 등) — 토큰을 클라이언트가 직접 저장·전송하는 방식이 이 아키텍처에 더 잘 맞음.
- **로그인 필드**: 이메일이 아니라 `username`(아이디) 기반 — 기존 `apps/customer-app`의 `LoginScreen.tsx`가 "아이디"/"비밀번호" 필드를 쓰고 있어 그대로 맞춤.
- **DB 위치**: 로컬 Homebrew MariaDB → 자체 서버(`221.141.3.91`) → 다시 로컬로 → 최종적으로 **원래 계획(자체 서버 `221.141.3.91`의 기존 MariaDB 사용)으로 확정**. 왕복 끝에 로컬 Homebrew MariaDB는 설치했다가 다시 완전히 삭제함(서비스 중지 → `brew uninstall mariadb` → `/opt/homebrew/var/mysql` 데이터 디렉토리·LaunchAgent plist까지 정리, 로컬에 흔적 없음).
- 개발도 처음부터 `221.141.3.91`의 원격 MariaDB에 붙어서 진행 — 접속 정보(포트/DB명/계정) 확보 필요, 아직 미확보.
- **프로젝트 위치**: `apps/api`에 독립 프로젝트로 생성 — `apps/customer-app`/`apps/customer-mobile`과 동일하게 모노레포 워크스페이스 도구 없이 각자 `package.json`을 갖는 기존 컨벤션을 그대로 따름.
- **Node 버전**: nvm의 Node 20 LTS(`zsh -lic`로 확인, v20.20.2) 사용 — `apps/customer-mobile`과 동일 버전으로 통일.

## 진행 이력

### 환경/DB 결정 왕복 (2026-07-23)
- MariaDB 위치를 로컬 Homebrew → 자체 서버(`221.141.3.91`) → 다시 로컬 → **최종적으로 자체 서버(`221.141.3.91:3308`, DB명 `motopay`)로 확정**. 그 사이 로컬에 설치했던 Homebrew MariaDB는 서비스 중지 → `brew uninstall` → 데이터 디렉토리(`/opt/homebrew/var/mysql`)·LaunchAgent plist까지 완전히 정리함.
- 접속 정보: 포트 3308, DB `motopay`, 계정 `dev01`(비밀번호는 `.env`에만 저장, git에 커밋되는 어떤 문서에도 평문으로 남기지 않음). `nc -zv 221.141.3.91 3308`으로 포트 접근 가능 확인 후 진행.

### NestJS + Prisma 스캐폴딩
- `apps/api`에 `nest new`로 독립 프로젝트 생성(기존 `apps/customer-app`/`apps/customer-mobile`과 동일 컨벤션, 모노레포 워크스페이스 없음).
- `.gitignore`를 CLI가 자동 생성해주지 않아 직접 작성(`node_modules`, `.env`, `dist` 등).
- 패키지: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `@nestjs/swagger`, Prisma(`prisma`, `@prisma/client`, `@prisma/adapter-mariadb`) 설치.
- `prisma init`이 부수적으로 `.claude/skills`, `.windsurf/skills`, `.agents/skills`, `skills-lock.json`을 자동 생성했는데, 이 프로젝트와 무관한 Prisma CLI의 범용 AI 스킬 문서라 바로 삭제함.

### Prisma 7의 破格 변경 — MariaDB 드라이버 어댑터 필수 (중요, 다음에 또 헷갈릴 수 있음)
- **`schema.prisma`의 `datasource db { url = env("DATABASE_URL") }` 방식이 Prisma 7부터 완전히 제거됨.** 대신:
  1. **CLI(migrate 등)용 연결 정보**는 `prisma.config.ts`의 `datasource: { url: process.env["DATABASE_URL"] }`로 지정(→ `prisma init`이 자동으로 이렇게 만들어줌, 손댈 필요 없음).
  2. **런타임 PrismaClient용 연결**은 `new PrismaClient({ adapter })` 형태로 드라이버 어댑터를 명시적으로 넘겨야 함. MariaDB는 `@prisma/adapter-mariadb`의 `PrismaMariaDb` 클래스 사용: `new PrismaMariaDb(process.env.DATABASE_URL)`.
  - `schema.prisma`에 실수로 `url = env(...)`를 넣으면 `P1012` 에러(`the datasource property url is no longer supported in schema files`)로 바로 막힘.
- **생성기(`generator client { provider = ... }`) 선택도 중요**: `prisma init` 기본값인 `provider = "prisma-client"`(신규 생성기)는 **ESM 전용**으로 출력됨(`import.meta.url` 사용) — 이 프로젝트(NestJS 기본 CJS 스캐폴딩, `package.json`에 `"type": "module"` 없음)에서 `ts-node`로 직접 실행 시 `ReferenceError: exports is not defined in ES module scope`로 즉시 깨짐. **`provider = "prisma-client-js"`(구 생성기명)로 바꾸면 CJS/ESM 듀얼 호환 출력**(`generated/prisma/index.js`가 `require`/`import` 양쪽 다 지원하는 `exports` 맵을 가진 자체 `package.json`을 생성)이 나와서 문제 해결. 이후 프로젝트를 통째로 ESM으로 전환할 계획이 없다면 계속 `prisma-client-js`를 쓸 것.
- import 경로는 `generated/prisma`(커스텀 output 폴더) 그대로 — 폴더째로 import하면 그 폴더의 `index.js`를 잡음(`/client` 서브패스가 아니라 폴더 루트로 import).
- 검증: `prisma/seed.ts`(테스트 계정 upsert, `apps/customer-app`의 기존 목업 로그인 `id: user / pw: 1234`와 동일하게 시딩)를 `npx ts-node --transpile-only prisma/seed.ts`로 실제 실행해 원격 DB에 실제로 레코드가 생성되는 것까지 확인 완료 — Prisma 7 + MariaDB 어댑터 + 원격 DB 연결 전체 경로가 실제로 동작함을 검증.

### Prisma 커스텀 output 경로가 `nest build` 이후 깨지는 문제 (중요, 두 번째 함정)
- 처음엔 `generator client { output = "../generated/prisma" }`로 `apps/api/generated/prisma`에 생성했는데, `npm run start`(컴파일된 `dist/` 실행)에서 `Cannot find module '../../generated/prisma'` 에러 발생.
- **원인**: `src/prisma/prisma.service.ts`에서 `../../generated/prisma`는 소스 기준(`src/prisma/` → `apps/api/`)으론 맞지만, `nest build`가 이걸 `dist/src/prisma/prisma.service.js`로 컴파일하면 같은 상대경로가 `dist/generated/prisma`를 가리키게 돼(디렉터리 깊이가 안 맞음) 실제 파일 위치(`apps/api/generated/prisma`, dist 밖)를 못 찾음. `ts-node`로 `src/`를 직접 실행할 땐 안 걸려서 시드 스크립트 테스트 때는 못 잡아냈다가, 실제 서버 기동(`nest build` → `dist/` 실행) 때 발견함.
- **해결**: 커스텀 `output` 경로를 아예 없애고 **기본 위치(`node_modules/@prisma/client`)로 생성** — `import { PrismaClient } from '@prisma/client'`처럼 패키지 경로로 import하면 Node의 `node_modules` 탐색 방식(상위로 계속 올라가며 찾음) 덕분에 `src/`에서 실행하든 `dist/`에서 실행하든 항상 같은 곳을 정확히 찾음. **커스텀 output 경로는 dist가 있는 프로젝트(NestJS 등)에서는 되도록 쓰지 말 것.**
- 이 변경으로 `prisma.service.ts`, `prisma/seed.ts`, `auth/auth.types.ts` 세 곳의 import 경로를 전부 `@prisma/client`로 수정.

### AuthModule 구현 & 검증
- 구조: `AuthController`(`POST /auth/login`, `GET /auth/me`) → `AuthService`(bcrypt 비교, JWT 발급) → `PrismaService`(User 조회). `JwtStrategy` + `JwtAuthGuard`로 `Authorization: Bearer` 헤더 검증. `@CurrentUser()` 데코레이터로 `req.user`(비밀번호 해시 제외한 `SafeUser`)를 컨트롤러에서 바로 꺼내 씀.
- `@nestjs/jwt`의 `expiresIn` 타입이 `ms` 라이브러리의 리터럴 유니온(`StringValue`)이라 `.env`에서 읽은 일반 `string`과 타입이 안 맞아 `as any` 캐스팅 필요(런타임엔 "15m"/"7d" 같은 문자열이 정상 동작 — 순수 타입 마찰).
- **curl로 6가지 케이스 전부 실제 서버에 대고 검증 완료**: 로그인 성공(토큰 2종+사용자 정보 반환), 잘못된 비밀번호(401), 존재하지 않는 아이디(401, 아이디 존재 여부를 노출하지 않도록 동일 에러 메시지), 토큰 없이 `/auth/me`(401), 유효한 토큰으로 `/auth/me`(200, 올바른 사용자 정보), 빈 값 요청(400, class-validator 메시지). `npm run build` 타입 에러 0건, `/api-docs-json`에 라우트 정상 노출까지 확인.

### 프론트 연동 — `apps/customer-app`의 mock 로그인을 실제 API로 교체 (2026-07-23)
- `src/api/`(신규): `config.ts`(API 서버 주소, `apps/customer-mobile/src/config.ts`의 dev/prod 분기 패턴과 동일하게 `import.meta.env.DEV`로 분기), `tokenStorage.ts`(localStorage에 토큰 저장 — 이 SPA가 일반 브라우저와 웹뷰 양쪽에서 다 도는데 localStorage는 양쪽 다 정상 동작함), `auth.ts`(`login()` 함수, 실패 시 서버가 내려준 에러 메시지를 그대로 `Error`로 던짐).
- `AuthFlow.tsx`의 `onLogin`을 하드코딩 검증(`id==="user" && pw==="1234"`)에서 실제 `await login(id, pw)` 호출로 교체. 로딩 상태(`loginLoading`)를 추가해 `LoginScreen.tsx`의 버튼을 요청 중엔 비활성화 + "로그인 중..." 표시(CLAUDE.md의 "loading/error state 명확히 처리" 원칙 반영).
- `App.tsx`의 로그아웃 핸들러에 `clearTokens()` 추가 — 기존엔 `userName`만 지우고 토큰은 안 지웠음.
- **NestJS 쪽 CORS 활성화 필요**: 웹앱(Vite dev server, 예: `localhost:5200`)과 API(`localhost:3000`)가 다른 origin이라 브라우저가 기본적으로 fetch를 차단함 → `main.ts`에 `app.enableCors()` 추가(지금은 전체 허용, 운영 배포 시 실제 프론트 도메인으로 좁혀야 함 — 미해결 항목에 남김).
- **모바일 웹뷰에서 로컬 API 테스트 시 주의**: `apps/customer-mobile`이 웹뷰 안에서 로컬 API(`localhost:3000`)를 바라보려면, 이전에 dev 서버(5173)에 썼던 것과 동일한 이유로 `adb reverse tcp:3000 tcp:3000`이 필요함(에뮬레이터의 `localhost`는 호스트 PC와 다른 네임스페이스). 아직 실제로 모바일에서 테스트는 안 해봄 — 필요시 진행.
- **ESLint 에러 3종 수정**(NestJS 기본 `@typescript-eslint` strict 설정이 `any`를 엄격히 잡음):
  1. JWT `expiresIn`을 `as any` 캐스팅하던 걸 없애고, **`.env`의 만료시간 값을 문자열("15m"/"7d") 대신 초 단위 숫자 문자열("900"/"604800")로 바꾸고 `Number(...)`로 명시 변환**하는 방식으로 전환. `ConfigService.get<number>(...)`처럼 제네릭만 숫자로 지정하는 건 실제 런타임 변환이 아니라 타입만 속이는 것이라(실제로는 여전히 문자열) 위험 — `Number()`로 명시적으로 변환해야 안전. 토큰 발급 후 실제로 payload의 `exp - iat`가 정확히 900(초)인지 디코드해서 검증 완료.
  2. `@CurrentUser()` 데코레이터의 `ctx.switchToHttp().getRequest()`가 기본적으로 `any` 반환 → `getRequest<Request & { user: SafeUser }>()`로 명시 타입 지정.
  3. `main.ts` 최하단의 `bootstrap();`이 floating promise로 걸림 → `void bootstrap();`로 수정(NestJS 기본 템플릿의 표준 패턴).
- **최종 검증**: Playwright로 실제 두 서버(API 3000 + 웹 5200)를 동시에 띄우고 브라우저 UI에서 직접 로그인 — 틀린 비밀번호 시 서버가 내려준 실제 에러 메시지가 토스트로 뜨는 것, 올바른 로그인 시 DB에 저장된 실제 이름("홍길동님")으로 홈 화면이 뜨는 것(하드코딩 값이 아님을 증명), `localStorage`에 실제 토큰이 저장되는 것까지 전부 확인. `tsc`/`lint`/`build` 모두 클린.

### 회원가입 API — User 스키마 확장 + 휴대폰번호 암호화 (2026-07-23)
- 사용자 요청: "회원가입 api 작성하자. 추가로 필요한 users 정보는 휴대폰번호(암호화), 약관동의여부, 개인정보 동의여부, 마케팅(sms, 이메일, 푸시) 동의여부, 가입일시, 최종로그인일시야."
- **스키마 설계 결정**:
  - 기존 `phone String?`을 `phoneEncrypted String?`로 이름까지 바꿈(의미가 "평문 저장"에서 "암호문 저장"으로 바뀌었으니 필드명도 명확히 하는 게 맞다고 판단). 시드 유저 1명(`phone: null`)뿐이라 데이터 손실 리스크 없이 마이그레이션함.
  - "가입일시"는 이미 있던 `createdAt`을 그대로 사용(중복 컬럼 안 만듦). "최종로그인일시"는 `lastLoginAt DateTime?`(최초엔 null, 로그인 성공 시마다 갱신)으로 신규 추가.
  - 마케팅 동의는 사용자가 명시적으로 SMS/이메일/푸시 3개 채널로 나눠 요청했으므로 그대로 3개 Boolean 컬럼(`agreedMarketingSms`/`Email`/`Push`)으로 분리. **주의**: `apps/customer-app`의 기존 `SignupTermsScreen.tsx` 프로토타입은 마케팅 동의가 단일 체크박스(`marketing` 변수 하나)라 채널별 분리가 안 돼 있음 — 백엔드는 사용자 지시대로 3채널로 만들었지만, 프론트를 이 API에 연동하려면 그 화면도 3개 체크박스로 나누는 작업이 추가로 필요함(아직 안 함, "이후" 항목에 기록).
  - 약관(`agreedTerms`)·개인정보(`agreedPrivacy`) 동의는 회원가입의 법적 필수 요건이라고 판단해 DTO에서 `@Equals(true)`로 강제(false로 보내면 400) — 마케팅 3종은 선택이라 기본값 false 허용.
  - **role은 회원가입 API에서 클라이언트가 절대 지정할 수 없고 서버가 항상 `CUSTOMER`로 고정**함(보안 결정 — `SignupDto`에 role 필드 자체를 안 둠). 관리자/파트너/시공업체/공급업체는 별도 초대·승인 절차로 생성될 것으로 예상(이 API 범위 밖).
- **휴대폰번호 암호화 설계**: AES-256-GCM(인증 암호화, 무결성 보장) 채택. 매번 랜덤 IV를 쓰기 때문에 같은 번호를 넣어도 암호문이 매번 달라짐(더 안전하지만, 트레이드오프로 "이 번호로 이미 가입했는지" 같은 동일값 검색은 암호문만으로는 불가능 — 필요해지면 별도 결정적 해시(HMAC 등) 컬럼을 추가해야 함, 지금은 요청받지 않아서 안 만듦). 원문 순수 함수(`src/common/crypto/phone-crypto.ts`)와 NestJS DI 래퍼(`phone-crypto.service.ts`)로 분리 — 순수 함수 쪽은 `prisma/seed.ts`(Nest 컨텍스트 밖에서 도는 스크립트)에서도 그대로 재사용하기 위함.
- **로그인/조회 응답 통일**: `login`/`signup`/`findSafeUserById`(즉 `/auth/me`) 세 곳 모두 `toSafeUser()` 헬퍼 하나로 통일해서, 암호화된 `phoneEncrypted`를 복호화한 `phone`을 응답에 담음(클라이언트는 항상 평문 전화번호를 받음, DB에만 암호문으로 남음).
- **검증**: curl로 정상가입(201)·중복아이디(409)·약관미동의(400)·잘못된휴대폰형식(400)·약한비밀번호(400) 5개 케이스 확인 + 가입 직후 발급된 토큰이 아니라 별도로 재로그인해서 받은 토큰으로 `/auth/me` 호출해 phone이 정확히 복호화되는지 확인. **추가로 DB를 직접 조회**해서 `phoneEncrypted` 컬럼 값이 `"010-9876-5432"` 같은 평문이 아니라 `iv:authTag:ciphertext` 형태의 실제 암호문인 것, `agreedTerms`/`agreedMarketingSms` 등이 요청한 그대로 저장된 것, `lastLoginAt`이 가입 시각보다 재로그인 시각으로 정확히 갱신된 것까지 눈으로 확인함(응답 값만 믿지 않고 저장소 자체를 검증).

### 휴대폰 검색용 해시 컬럼 + 프론트 회원가입 연동 (2026-07-23)
- 사용자 요청: "휴대폰번호 검색이 필요하니 해시 컬럼 추가해줘. 프론트 회원가입 화면 연동 진행해줘." — 두 가지를 한 번에 진행.
- **해시 설계**: `phoneHash`는 HMAC-SHA256이고, **암호화 키(`PHONE_ENCRYPTION_KEY`)와 완전히 다른 별도 키(`PHONE_HASH_KEY`)를 씀**(용도별 키 분리 — 암호화 키가 유출돼도 해시 재현이 안 되고, 반대도 마찬가지). 해시 전에 `normalizePhone()`으로 하이픈을 제거해 "010-1234-5678"과 "01012345678"이 같은 해시가 나오도록 정규화 — 이걸 안 하면 같은 번호도 입력 형식에 따라 다른 해시가 나와서 검색이 무의미해짐. **암호화도 이 정규화된 값으로 하도록 같이 바꿈**(이전엔 원본 입력 그대로 암호화해서 형식이 들쭉날쭉했음).
- **검색 API 자체는 안 만듦**: "해시 컬럼 추가해줘"까지만 요청받았고 "이 번호로 찾아주는 API를 만들어줘"는 아니었음 — 컬럼·인덱스·해시 생성 로직까지만 준비해두고, 실제 조회 엔드포인트(예: 아이디 찾기)는 필요해지면 그때 추가하기로 함. 다만 "회원가입 시 같은 번호로 중복가입 막아줘"도 아직 요청 안 받아서 `signup()`에 중복 체크 로직 자체는 넣지 않음(컬럼만 준비됨).
- **기존 데이터 백필**: 스키마 변경 시점에 이미 2명(`user`, `newuser01`)이 가입돼 있어서, 이들의 `phoneEncrypted`를 복호화 → 정규화 → 재해시해서 `phoneHash`를 소급 채우는 일회성 스크립트를 실행함(반복 실행되는 seed.ts와는 분리 — 1회성이라 실행 후 파일 삭제).
- **email 컬럼을 예정에 없이 추가한 이유**: 프론트 `SignupInfoScreen.tsx`가 원래부터(mock 시절부터) 이메일을 필수 입력으로 받고 있었는데, 백엔드 `User`/`SignupDto`엔 email이 아예 없었음. 이 상태로 그냥 "연동"만 하면 사용자가 입력한 이메일이 통째로 버려지는 게 되어 데이터 유실이라고 판단 — 두 번째 요청("프론트 연동")을 제대로 하려면 필연적으로 필요한 필드라 스키마에 추가함(첫 번째 요청엔 없었던 항목이라 checklist에 별도로 명시해서 사용자가 인지하도록 함).
- **`SignupVerifyScreen`에 "이름" 입력란 신규 추가 — 원본 디자인 변경, 승인 필요 사안**: 기존 프로토타입은 이 화면의 "인증 완료" 카드에 `MOCK_NAME`("홍길동")을 고정 표시했음(실제 PASS/NICE 같은 본인인증 연동이 없어서). 이대로 실제 회원가입 API에 연결하면 **모든 신규 가입자가 DB에 이름 "홍길동"으로 저장되는 명백한 기능 버그**가 됨. 실제 본인인증 연동은 이번 범위 밖이라, 최소한의 조치로 이 화면에 실제 이름을 받는 입력란을 추가하고 가짜 "생년월일" 표시는 제거함. **이건 CLAUDE.md의 "원본과 다르게 구현 시 승인 필수" 원칙에 해당하는 변경인데, "회원가입 API로 실제로 동작하게 만들어달라"는 요청 자체가 이 수정 없이는 성립이 안 돼서 일단 반영하고 사후 승인을 받는 방식으로 처리함** — checklist의 "이후" 항목에 명시해뒀으니 원치 않으면 되돌릴 수 있음.
- **마케팅 동의 채널 불일치**: 백엔드는 사용자가 명시적으로 요청한 대로 SMS/이메일/푸시 3채널 분리인데, 프론트 `SignupTermsScreen`은 여전히 단일 "마케팅 수신 동의" 체크박스(이것도 원본 디자인이라 임의로 3개로 쪼개지 않음 — 이 역시 승인 필요 사안이라 이번엔 손 안 댐). 절충안으로 **단일 체크박스 값을 API 호출 시 3개 필드 모두에 동일하게 넣는 방식**으로 연동. 채널별로 다른 동의를 받고 싶으면 화면 자체를 체크박스 3개로 바꿔야 함(승인 필요, "이후" 항목에 기록).
- **3개 화면을 controlled component로 전환**: `SignupInfoScreen`/`SignupTermsScreen`이 기존엔 자기 안에서만 값을 들고 있고 `onNext`/`onComplete`가 인자 없는 `() => void`라 부모(`AuthFlow.tsx`)가 실제 입력값을 전혀 몰랐음(이전 세션에서 이미 파악해뒀던 문제). 로그인 때처럼 `AuthFlow.tsx`가 모든 state(`signupUsername`/`signupEmail`/`signupPassword`/`signupPasswordConfirm`/`signupAgreeService`/`signupAgreePrivacy`/`signupAgreeMarketing`)를 소유하고 각 화면엔 값+변경 콜백을 props로 내려주는 방식으로 바꿈 — 이 코드베이스의 다른 Flow 컴포넌트들(`ShopFlow` 등)과 동일한 패턴.
- **아이디 중복확인 실제 연동**: 기존엔 버튼 누르면 무조건 `idChecked=true`(가짜)였음 → `GET /auth/check-username/:username` 신규 엔드포인트를 만들어 실제 DB 조회로 바꿈. 확인 결과에 따라 "사용 가능"/"이미 사용 중" 힌트 텍스트도 분기(기존엔 "사용 가능" 케이스만 있었음).
- **사용자 승인 및 향후 방향 확정(2026-07-23)**: "이름" 입력란 추가를 포함한 위 접근 방식을 그대로 승인받음. 단, 이 입력란은 **어디까지나 임시**라고 명확히 확인함 — "이름은 나중에 실명인증 서비스 연동시 CI값을 받아서 뿌려주는 용도로 변경할 거야." 즉:
  - 지금은 사용자가 이름을 직접 타이핑(임시).
  - 나중에 PASS/NICE 같은 실명인증 서비스를 실제로 붙이면, 그 서비스가 인증 결과와 함께 **CI(연계정보 — 여러 서비스에 걸쳐 동일인을 식별하는 값)**를 돌려주고, 서버는 그 CI로 실제 인증된 이름을 조회해서 클라이언트에 내려주는 방식으로 바뀔 예정. 그때는 "이름" 입력란이 다시 읽기전용(또는 아예 제거)으로 돌아가야 함.
  - 이때를 대비해 `User` 모델에 나중에 `ci`(또는 해시된 `ciHash`) 컬럼이 추가될 가능성이 높음 — CI는 보통 동일인의 중복가입을 막는 용도로도 쓰이므로, 지금 만들어둔 `phoneHash`와 비슷한 성격의 "검색/대조용 컬럼"이 하나 더 생기는 셈. 지금 당장 만들 필요는 없지만, 스키마 설계 시 이 확장을 염두에 두고 있을 것.
  - `SignupVerifyScreen.tsx` 상단에 이 내용을 주석으로 남겨둠(다음에 이 파일을 다시 열었을 때 "왜 이름을 직접 입력받고 있지?"라는 의문이 바로 풀리도록).
- **검증**: Playwright로 실제 브라우저에서 전체 회원가입 여정을 처음부터 끝까지 수행 — 이름/휴대폰 입력 → OTP 목업 인증 → 기존 아이디("user")로 중복확인 시 실제로 "이미 사용 중"이 뜨는 것 확인(하드코딩이면 항상 통과했을 케이스라 의미 있는 검증) → 새 아이디는 사용 가능 확인 → 이메일/비밀번호 입력 → 약관 체크(체크박스는 `<label>` 안의 별도 `<span onClick>`이라 텍스트를 클릭해선 안 되고 정확한 좌표를 클릭해야 했음 — Playwright 스크립트 작성 시 실수했다가 좌표 지정으로 수정) → 가입완료 화면에 **실제로 입력한 이름**이 뜨는 것 확인(목업이었다면 절대 이 이름이 나올 수 없으므로 진짜 API 경유임을 증명) → 토큰 저장 → 홈 진입까지. 이어서 DB를 직접 조회해서 `email`/`phoneHash`/`phoneEncrypted`/약관 3필드가 정확히 저장된 것도 확인.

### tsconfig.json 문제 2건 수정 (2026-07-23)
- 사용자가 IDE에서 `apps/api/tsconfig.json`의 `baseUrl` 줄에 TS 진단 에러를 직접 보고 요청: `Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0`(설치된 TS 5.9.3의 조기 경고). 코드베이스에 `baseUrl` 기반 non-relative import가 전혀 없어서(전부 `../` 상대경로) **`baseUrl` 옵션 자체를 삭제**하는 걸로 해결(경고 억제용 `ignoreDeprecations` 추가가 아니라 근본적으로 안 쓰는 옵션을 없앰).
- 이 조사 과정에서 **별도의 실제 빌드 버그를 하나 더 발견**: `tsconfig.json`에 `include`/`exclude`가 없어서 `nest build`(정확히는 `tsconfig.build.json`)가 `src/` 뿐 아니라 프로젝트 루트의 `prisma.config.ts`, `prisma/seed.ts`까지 같이 컴파일하고 있었음 → TypeScript가 `rootDir`을 "모든 입력 파일의 공통 조상 디렉터리"로 자동 추론하는데, `prisma/`가 껴 있어서 `src/`가 아니라 **프로젝트 루트 자체**가 rootDir로 잡혀버림 → 결과적으로 `dist/main.js`가 아니라 `dist/src/main.js`에 빌드됨. 그런데 `package.json`의 `start:prod`는 `node dist/main`을 실행하므로, **이 상태로 운영 배포했다면 서버가 아예 기동을 못 했을 것**(파일을 못 찾음).
  - 사용자에게 먼저 보고 후 승인받아 수정: `tsconfig.build.json`의 `exclude`에 `"prisma"`, `"prisma.config.ts"` 추가. 이러면 빌드 대상이 다시 `src/`로만 좁혀져서 `rootDir`이 올바르게 추론되고 `dist/main.js`가 제자리에 생성됨.
  - `tsconfig.json`(에디터/타입체크/`ts-node`용, `prisma/seed.ts` 실행 시 사용)은 건드리지 않아서 시드 스크립트의 타입체크·실행은 그대로 정상 동작.
  - **검증**: `dist/` 삭제 후 `npm run build`로 클린 리빌드 → `dist/main.js`가 최상위에 생기는 것 확인 → **`npm run start:prod`를 실제로 실행**해서 서버가 정상 기동하고 `/api-docs`(200)까지 응답하는 것 확인(이전엔 이 명령 자체를 한 번도 검증 안 하고 있었음 — `npm run start`/`start:dev`만 계속 써서 이 버그를 못 잡았던 것). `prisma/seed.ts` 재실행, `lint` 재확인도 모두 정상.

### 휴대폰번호 형식 통일 + 시각 타임존 버그 수정 (2026-07-23)
- 사용자 제보 2건: "① 휴대폰번호가 하이픈 있는/없는 경우가 혼재해 있다. 000-0000-0000 형식으로 통일해야 한다. ② 일시 저장 시 현재 시각이 로컬(한국) 시간이 아닌 것 같다."

**① 휴대폰번호 형식**
- `phone-crypto.ts`에 `formatPhone()` 추가(11자리→"000-0000-0000", 10자리 구형→"000-000-0000"). `signup()`에서 저장·암호화 전 이 포맷을 적용하도록 수정(기존엔 `normalizePhone()`으로 숫자만 남긴 걸 그대로 암호화해서 하이픈이 아예 없었음 — 그래서 입력 형식에 따라 저장값이 들쭉날쭉했던 것). 검색용 `phoneHash`는 계속 정규화된 숫자만으로 계산(형식과 무관하게 항상 같은 해시가 나와야 검색이 의미 있음).
- 기존 계정 4명(그 사이 사용자가 직접 회원가입 테스트한 `cmkil5150` 계정 포함 — 실제 사용자 데이터일 수 있어 삭제하지 않고 복호화→재포맷→재암호화로 소급 수정)의 휴대폰번호를 전부 통일함.

**② 시각 타임존 — 생각보다 근본적인 원인**
- 처음엔 mariadb 드라이버의 `timezone` 커넥션 옵션(KST로 설정)이면 해결될 줄 알았는데 **효과 없었음** — 실제 원인은 `@prisma/adapter-mariadb`가 `Date`를 DB에 쓸 때 `date.getUTCHours()` 등 **UTC 컴포넌트로 직접 문자열을 만들어서 mariadb 드라이버에 넘기는** 구조였음(어댑터 소스코드를 직접 열어서 확인 — `node_modules/@prisma/adapter-mariadb/dist/index.js`). mariadb 드라이버 자체의 `writeBinaryDate`는 `getHours()`(로컬 getter)를 쓰지만, 그 경로를 아예 안 탐 — Prisma 어댑터가 이미 문자열로 만들어서 넘기기 때문. 그래서 드라이버의 `timezone` 옵션은 (세션 `SET time_zone` 정도에만 영향을 주고) 이 문제와 무관했음.
- `DATETIME` 컬럼은 타임존 개념이 아예 없어서 그 UTC 문자열이 그대로 박힘. Prisma로 다시 읽으면 Prisma도 동일하게 "UTC로 저장돼 있다"고 가정하고 복원하므로 앱 내부적으로는 앞뒤가 맞아 티가 안 남(`.toString()`으로 보면 KST로 정상 표시됨) — 하지만 **다른 DB 클라이언트(mysql cli, DBeaver 등, 서버 기본 세션=SYSTEM=KST)로 raw 값을 직접 보면 실제 한국시간보다 정확히 9시간 이른 값**이 보임. 이게 사용자가 본 증상.
- **해결 방식을 사용자에게 직접 확인받음**(AskUserQuestion): "① DB에 한국시간 숫자를 그대로 박기(임시/간단, 나중에 날짜 계산 기능 만들 때 함정)" vs "② TIMESTAMP 컬럼 + 앱 커넥션은 UTC 세션 고정(정석, 스키마 마이그레이션 필요)" 중 **②(정석)로 확정**.
- **구현**:
  - `schema.prisma`: `createdAt`/`updatedAt`/`lastLoginAt`에 `@db.Timestamp(3)` 추가(`DATETIME` → `TIMESTAMP`, MySQL/MariaDB에서 세션 타임존을 인식하는 유일한 시간 타입).
  - `src/common/db/mariadb-config.ts`(신규) — `DATABASE_URL` 문자열을 파싱해 `mariadb.PoolConfig` 객체로 만들면서 **이 앱의 DB 커넥션 세션을 UTC(`timezone: 'Z'`)로 고정**. `PrismaService`·`prisma/seed.ts` 양쪽에 적용(문자열로 바로 넘기던 걸 이 함수를 거치도록 교체).
  - 마이그레이션 전에 `explicit_defaults_for_timestamp` 서버 설정을 확인했더니 **`OFF`**(레거시 MySQL 동작 — 조건에 맞는 첫 TIMESTAMP 컬럼에 암묵적으로 `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`가 붙을 수 있는 설정)라서, `prisma migrate dev --create-only`로 SQL만 먼저 생성해 직접 읽어본 뒤 적용. 적용 후 `SHOW CREATE TABLE users`로 실제 컬럼 정의를 확인해서 **의도치 않은 `ON UPDATE`가 안 붙은 것**을 검증(`updatedAt`은 Prisma가 매 쓰기마다 명시적으로 값을 채워주므로 애초에 DB 레벨 auto-update에 의존하지 않음).
  - **트러블슈팅**: `prisma migrate dev`를 논인터랙티브 환경(파이프로 stdin이 `/dev/null`)에서 실행했더니, 마이그레이션 자체는 성공적으로 적용됐는데 그 직후 "새 마이그레이션 이름을 입력하세요" 같은 불필요한 후속 프롬프트에서 멈춰버림(입력을 받을 수 없어 60초 타임아웃 후 백그라운드로 밀려남) → 프로세스를 직접 `kill`함(이미 실제 DDL 작업은 완료된 뒤였어서 안전). 참고: 이 환경에서 Prisma CLI의 인터랙티브 마이그레이션 명령을 쓸 땐 이런 후속 프롬프트가 걸릴 수 있다는 걸 기억해둘 것 — `--create-only`로 SQL만 만들고 별도로 적용하는 2단계 방식이 더 예측 가능함.
  - **최종 검증(중요)**: 이 앱의 Prisma 커넥션이 아니라 **완전히 별도의 raw `mariadb.createConnection()`**(옵션에 timezone을 안 줘서 서버 기본 세션=SYSTEM=KST를 그대로 씀, 즉 일반 DB 클라이언트를 흉내)으로 새로 쓴 레코드를 조회 → 실제 한국시간 벽시계와 **정확히 일치**하는 값이 보이는 것 확인. 동시에 Prisma 쪽에서 읽은 `.toISOString()`(진짜 UTC 인스턴트)도 정확한 것 확인 — "앱 내부는 정확한 UTC 유지 + 외부 DB 툴로 보면 자동으로 한국시간" 두 요구사항이 동시에 충족됨. (참고: 같은 걸 우리 앱 자신의 Prisma 커넥션으로 raw SQL 조회하면 당연히 UTC로 보임 — 그 커넥션 자체를 UTC로 고정했으니까. 처음에 이 구분을 안 하고 헷갈렸다가 바로잡음.)
- **기존 데이터**: 여러 차례의 버그/마이그레이션을 거치며 쌓인 테스트 계정 4개의 과거 `createdAt`/`lastLoginAt`은 정확한 원본 시각을 소급 복원하기 어려워(여러 단계 버그가 겹쳐 있었음) 그대로 둠 — 전부 테스트/개발용 계정이라 히스토리 값의 정밀도가 중요하지 않다고 판단, **이 시점 이후의 모든 새 기록은 정확함**.
- **최종 검증**: 실제 `POST /auth/signup`으로 하이픈 없는 번호("01055512345")를 보내 응답의 `phone`이 "010-5551-2345"로 정확히 변환되는 것, 로그인 시 서버 실제 시각과 응답이 일치하는 것까지 실제 서버로 확인. `tsc`/`lint`/`build` 전부 클린.

### 아이디 찾기·비밀번호 찾기(재설정) (2026-07-23)
- 사용자 요청: "이제 아이디 찾기, 비밀번호 찾기 (비밀번호 재설정) 진행해줘." — 이전 Phase 7에서 "휴대폰번호 검색이 필요하니 해시 컬럼 추가해줘"로 미리 준비해둔 `phoneHash`가 이번에 실제로 쓰이게 됨.
- **재설정 토큰 설계(핵심 결정)**: 비밀번호 재설정을 "1단계(휴대폰 확인 → 임시 토큰 발급)"와 "2단계(토큰+새 비밀번호 → 실제 교체)"로 분리하고, 그 사이를 잇는 토큰을 access/refresh와 **완전히 다른 시크릿**(`JWT_RESET_SECRET`)과 **짧은 만료**(10분)를 가진 별도 JWT로 설계함. payload에 `purpose: 'password-reset'` 클레임을 넣고 검증 시 이것도 확인해서, 혹시라도 access token을 재설정 엔드포인트에 잘못 흘려보내는 식의 토큰 종류 혼동 공격을 막음.
  - **왜 이렇게까지 분리했나**: 이 프로젝트의 휴대폰 인증은 아직 전부 클라이언트 목업(OTP에 아무 숫자나 넣어도 통과)이라, 지금 당장은 "인증 완료 후 토큰 발급"이나 "그냥 바로 비밀번호 교체"나 실질적 차이가 없어 보일 수 있음. 하지만 **미래에 실제 SMS/PASS/NICE 인증을 붙일 때** 바뀌어야 하는 지점은 딱 하나, "토큰 발급 시점에 진짜 인증을 요구하는 것"뿐이도록 설계함 — 지금 만들어둔 2단계 계약(토큰 발급 → 토큰으로 교체) 자체는 그대로 재사용 가능. 처음부터 이 구조로 만들어두면 나중에 실명인증을 붙일 때 API 계약을 다시 설계할 필요가 없음.
- **`phoneHash` 재사용**: 아이디 찾기·비밀번호 찾기 둘 다 동일한 `findUserByPhoneOrThrow()` private 헬퍼로 `phoneHash` 조회 → 없으면 404. Phase 7에서 "검색 가능하도록만 준비해두고 실제 조회 API는 나중에"라고 미뤄뒀던 게 바로 이 시점에 쓰임 — 그때의 설계가 맞았음을 확인.
- **계정 열거(enumeration) 방지는 의도적으로 안 함**: 미등록 번호로 조회하면 그냥 404("해당 휴대폰번호로 가입된 계정을 찾을 수 없습니다")를 바로 반환함. 보안 원칙상으론 항상 200을 반환하고 이메일/SMS로만 결과를 보내는 방식이 더 안전하지만, (1) 이번 요청 범위에 없었고 (2) 실제 국내 서비스 대다수의 아이디/비밀번호 찾기 UX도 미등록 번호에 대해 바로 에러를 보여주는 방식이 일반적이라, CLAUDE.md의 "요청받지 않은 기능은 만들지 않는다" 원칙에 따라 추가하지 않음 — checklist "이후" 항목에 명시해둠.
- **재설정 토큰의 재사용 가능성**: JWT는 상태를 서버에 기록하지 않는 방식이라, 발급된 토큰은 만료 전까지 몇 번이든 재사용 가능함(1회성 아님) — curl로 실제 확인함(같은 토큰으로 두 번째 재설정 요청도 200으로 성공). 이것도 이번 범위에 없었던 요구사항(1회성 제한)이라 그대로 둠, "이후" 항목에 기록.
- **`AcctFindScreen`/`PwdFindScreen`/`PwdResetScreen` 연동 패턴**: Phase 7의 회원가입 화면들과 달리 이 3개는 여러 화면에 걸쳐 필드를 쌓아가는 구조가 아니라 각각 "휴대폰 인증 → 결과 1개"로 끝나는 독립된 단일 액션이라, 모든 필드를 `AuthFlow.tsx`로 끌어올리는 대신 **가벼운 "액션 콜백 + 결과 props" 패턴**을 씀: `phone`/`otp`/`sent` 같은 화면 내부에서만 쓰이는 상태는 화면 자체가 계속 소유하고, `AuthFlow.tsx`는 `onVerify(phone)`/`onVerified(phone)`/`onDone(newPassword)` 콜백과 그 결과(`foundUsername`/`resetToken`)만 주고받음.
  - `AcctFindScreen`은 원래 `verified`라는 로컬 boolean으로 결과 섹션을 조건부 렌더링했는데, 이걸 `foundUsername: string | null` prop으로 바꿔서 **실제 API 응답이 곧 렌더링 조건**이 되도록 함(값이 없으면 결과가 없는 것).
  - `closeSheet()`에서 `foundUsername`/`resetToken`을 함께 초기화 — 안 하면 시트를 닫았다가 다시 열었을 때 이전 조회 결과가 잔상처럼 남아있는 버그가 생김.
- **검증**: 먼저 curl로 백엔드 3개 엔드포인트를 전부 확인(강한 비밀번호로 재설정 성공 → 새 비밀번호로 로그인 성공 → 이전 비밀번호로는 401 → 조작된 토큰은 401). 이후 Playwright로 실제 두 서버(API 3000 + Vite 5173)를 띄우고 브라우저에서 아이디 찾기(등록된 번호 입력 → OTP 목업 확인 → 화면에 뜨는 마스킹 아이디가 하드코딩이던 `moto****23`이 아니라 실제 API가 계산한 `u***`인 것 확인 — `user`라는 4글자 아이디라 5자 이하 케이스로 마스킹됨) / 비밀번호 찾기(번호 확인 → 재설정 화면 진입 → 새 비밀번호 제출 → 성공 토스트 → 그 비밀번호로 실제 로그인해 홈 화면까지 도달) 둘 다 UI로 직접 확인. 콘솔 에러 0건, `tsc`/`lint` 클린.

## 파트너(시공업체) 사용자 테이블 + 로그인 API (2026-07-27)

### 배경 및 결정 근거
- 사용자가 파트너사 사용자 테이블(사용자id/비밀번호/휴대폰번호/이메일/업체코드) + 로그인 API + 최초 로그인 강제 비밀번호 변경을 요청. 착수 전 스키마를 먼저 훑어보니 이미 `User.role`에 `PARTNER` 값이 있었고, `Shop`(시공업체 마스터, `shopCode` 자동채번)도 이미 존재해 "업체코드가 이 Shop.shopCode를 가리키는 게 맞겠다"는 확신이 섰음.
- **User 테이블 확장이 아니라 신규 `PartnerUser` 테이블로 분리한 이유**(AskUserQuestion으로 사용자 확인): 요청받은 필드 구성(이름 없음, 업체코드 있음)이 `User`(이름 필수, 약관동의 3종, 프로필사진 등 고객 전용 필드 다수)와 겹치는 게 거의 없음. `apps/partner-app`이 이미 완전히 분리된 별도 프론트(별도 포트·별도 로그인 화면·자체 가입 불가라는 다른 비즈니스 규칙)로 존재하는 상태라, 테이블도 분리하는 게 구조적으로 자연스러움.
- **인증 모듈도 `PartnerAuthModule`로 완전 분리**(동일하게 사용자 확인): `AuthService`가 두 개의 전혀 다른 사용자 테이블을 동시에 다루게 되는 걸 피함. JWT도 시크릿 자체를 별도로 발급(`JWT_PARTNER_ACCESS_SECRET`/`JWT_PARTNER_REFRESH_SECRET`)해서, 고객 토큰이 파트너 API에 대해 서명 검증 단계에서부터 실패하도록 설계 — 이미 이 프로젝트가 `JWT_RESET_SECRET`(비밀번호 재설정 전용)으로 "용도별 시크릿 분리" 원칙을 쓰고 있어 그 연장선. Passport 전략 이름도 `'jwt-partner'`로 명시해야 함 — 지정 안 하면 기본값 `'jwt'`가 되어 고객용 `JwtStrategy`와 전략 레지스트리에서 충돌(둘 다 이름 없이 등록하면 나중에 등록된 쪽이 덮어씀).
- **최초 로그인 강제 비밀번호 변경 — "플래그만 반환, 강제는 프론트" 방식 선택**(3번째 확인 질문): 로그인은 정상적으로 access/refresh 토큰을 전부 발급하고 응답에 `mustChangePassword` boolean만 포함, `apps/partner-app`의 `AuthFlow.tsx`가 이 값을 보고 홈으로 보내지 않고 무조건 `FirstLoginPwdChangeScreen`(닫기 버튼 없는 전체화면, 건너뛸 수 없음)으로 라우팅. 더 엄격한 대안(비밀번호 변경 전엔 다른 API를 호출 못 하게 제한된 토큰만 발급)도 제시했으나, 지금 시점에 파트너앱에 로그인 외의 보호된 API가 전혀 없어(홈 화면 등은 전부 mock) 그 엄격함이 실효성이 없다고 판단해 간단한 쪽을 선택함. **주의**: 이 설계상 비밀번호 변경 전에도 토큰 자체는 유효하므로, 나중에 파트너 전용 보호 API가 늘어나면 그때는 `JwtPartnerAuthGuard`(또는 별도 가드)에서 `mustChangePassword=true`인 계정의 접근을 차단하는 로직 추가를 검토할 것 — 지금은 막을 대상 자체가 없어서 안 넣음.
- **`업체코드`를 CommonCodeDetail 방식이 아니라 실제 FK로 건 이유**: 프로젝트 CLAUDE.md 규칙상 "고정된 값 목록"은 CommonCodeDetail 참조로 가되, 실제 엔티티(가변 데이터)를 가리킬 때는 진짜 FK를 건다는 기존 관례(`MyCar.memberId → User.id`, `NewCarPurchaseCustomer.packageCode → Product.productCode` 등)를 그대로 따름 — `Shop`은 업체가 계속 추가/삭제되는 실제 마스터 데이터라 고정 코드 그룹이 아님.

### 구현 세부사항
- `PartnerUser.phoneEncrypted`/`phoneHash`/`email`을 전부 **필수(non-null)** 컬럼으로 설계 — `User` 테이블에서는 이 필드들이 선택값(회원가입 단계별로 나중에 채워짐)이지만, 파트너 계정은 admin/콜센터가 발급 시점에 한 번에 다 채워 넣는 방식이라 처음부터 필수인 게 맞다고 판단(요청 문구 "휴대폰번호가 필요할 것 같다"도 이 해석과 일치).
- `useYn` 컬럼(요청엔 없었지만 추가): `Shop`/`Product`/`CommonCode` 등 이 스키마의 거의 모든 마스터 테이블이 갖고 있는 표준 컨벤션이라, 없으면 오히려 일관성이 깨진다고 판단해 포함(스펙 추가라기보다 기존 컨벤션 준수 — CLAUDE.md의 "기존 스타일에 맞춘다" 원칙).
- 마이그레이션 중 **또 한 번 겪은 MariaDB TIMESTAMP 암묵적 DEFAULT 이슈**(User/기존 여러 테이블에서 이미 문서화된 바로 그 패턴) — `updatedAt`에 원치 않는 `DEFAULT`가 붙어서 `migrate diff`로 드리프트 발견 → 즉시 `DROP DEFAULT` 후속 마이그레이션으로 수정. 이 프로젝트에서 새 TIMESTAMP 컬럼을 추가할 때마다 반복되는 패턴이니, 마이그레이션 적용 직후엔 항상 `migrate diff`로 드리프트 재확인하는 습관을 계속 유지할 것(CLAUDE.md에 이미 있는 지시사항, 실제로도 계속 재현됨을 재확인).
- 로그인 응답의 `SafePartnerUser`에 `shopName`을 Shop 조인으로 포함시킴(요청 필드엔 없었지만, `shopCode`만 내려주면 소비하는 쪽(추후 홈 화면 등)이 업체명을 보여주려 할 때 다시 API를 타야 해서 트리비얼한 조인 하나로 미리 포함 — 저장 스키마 변경도, 별도 API 호출도 아니라 최소 확장으로 판단).

### 검증
- curl로 백엔드 9개 케이스(로그인 성공/실패 2종, 비밀번호변경 성공/실패 3종, 재로그인 검증 2종, cross-realm 토큰 거부 2종) 전부 확인, 특히 **customer 토큰으로 파트너 API 호출·파트너 토큰으로 customer API 호출 양쪽 다 401**로 막히는 것까지 직접 확인해 realm 분리가 실제로 동작함을 증명.
- Playwright로 `apps/partner-app` 전체 UI 플로우 검증(로그인 실패 → 초기 비밀번호 로그인 → 강제변경 화면 → 잘못된 현재비번 → 정상 변경 → 홈 진입 → 재로그인 시 강제변경 생략 확인). 테스트로 변경된 시드 계정 비밀번호는 다시 초기값으로 원복해둠(시드 스크립트 문서와 실제 DB 상태가 어긋나지 않도록).
- `tsc -b`/`nest build`/`vite build`/`oxlint` 전부 클린(양쪽 프로젝트).

### 미해결/후속
- 파트너 계정 발급용 관리자 API가 없음 — 지금은 `seed-partner-users.ts` 수동 실행이 유일한 계정 생성 경로. 관리자웹(AD-*)이 생기면 그쪽에서 발급하는 흐름으로 대체될 가능성 높음.
- 아이디/비밀번호 찾기 3개 화면은 여전히 mock — 이번 요청 범위 밖이라 손대지 않음, 나중에 실제 연동하려면 고객 쪽과 동일한 패턴(휴대폰 인증 → 마스킹 아이디/재설정 토큰) 그대로 `PartnerAuthService`에 추가하면 됨.

## 포트 재구성 — api를 별도 origin(8092)으로 직접 노출 (2026-07-26)

### 배경
- Phase 24까지는 테스트서버(221.141.3.91)가 nginx same-origin 프록시 구조였음: 8090 하나로 customer-app 정적 파일과 `/api/`(→ 내부 3000 프록시)를 함께 서빙, api는 `127.0.0.1`에만 바인딩돼 외부에서 직접 접근 불가.
- 이번에 `apps/partner-app`이 추가되면서 사용자가 테스트서버 포트를 customer-app=8090(기존)/partner-app=8091(신규)/api=8092로 구성하고 싶다고 요청.

### 결정: same-origin 프록시 유지 vs api 직접 노출 — 직접 노출 선택
- AskUserQuestion으로 확인: "api(8092)를 두 프론트와 별도 origin으로 직접 노출" vs "지금처럼 각 프론트 포트 뒤에서 nginx가 /api로 내부 프록시하는 구조 유지(포트 번호만 8092로 변경)" 중 **직접 노출**로 확정.
- 이 결정으로 CORS가 더 이상 same-origin이 아니게 됨 — `main.ts`의 `app.enableCors()`(전체 허용) 주석에 남아있던 "운영 배포 시 좁힐 것" TODO를 이번에 실제로 정리함.
- nginx 원본 설정 파일은 이 로컬 저장소에 없고 Windows 서버(221.141.3.91)에 직접 구성돼 있어 이 세션에서 직접 수정 불가 — 저장소 쪽(코드/env 템플릿) 변경과 서버에 적용해야 할 정확한 절차 문서화까지만 진행, 실제 서버 반영은 사용자 몫으로 남김.

### 변경 내용
- `apps/api/src/main.ts`:
  - `app.listen(PORT, '127.0.0.1')` → `app.listen(PORT, '0.0.0.0')` — 로컬 전용 바인딩이던 걸 외부 접근 가능하도록 변경. 지금까지는 nginx가 로컬(127.0.0.1)에서만 붙었기 때문에 이 바인딩으로 충분했지만, api가 이제 그 자체로 공인 포트가 되므로 필수 변경.
  - `app.enableCors()` → `CORS_ORIGINS`(쉼표구분 env) 기반으로 origin을 제한하되, 값이 없으면(로컬 개발 기본값) 기존과 동일하게 전체 허용. **버그 회피**: `.env`에 `CORS_ORIGINS=`(빈 문자열)만 있어도 `"".split(',')`은 `['']`(진짜 빈 배열이 아니라 빈 문자열 1개짜리 배열)이 되어 모든 요청이 차단당하는 함정이 있어, `.trim()` 후 truthy 체크를 먼저 거치도록 작성함(빈 문자열 → `undefined` 취급 → allow-all로 폴백).
- `apps/api/.env.example`: `CORS_ORIGINS` 항목 추가(주석에 테스트서버 권장값 `"http://221.141.3.91:8090,http://221.141.3.91:8091"` 명시), `PORT` 옆에 테스트서버는 8092라는 주석 추가. **로컬 개발용 `.env`(gitignore됨)는 건드리지 않음** — `PORT=3000`을 그대로 유지해야 customer-app의 dev 설정(`localhost:3000`)과 어긋나지 않음. 테스트서버의 실제 `.env`(이 저장소 밖, 서버에만 존재)에만 `PORT=8092`/`CORS_ORIGINS`를 반영해야 함(체크리스트에 명시).
- `apps/customer-app/src/api/config.ts`의 prod `API_BASE_URL`: `"/api"`(same-origin 상대경로) → `"http://221.141.3.91:8092"`(절대 URL, 별도 origin).
- `apps/customer-app/src/config.ts`의 prod `PARTNER_APP_URL`: 아직 미배포라 뒀던 플레이스홀더(`https://partner.motopay.example.com`)를 실제 배포 예정 값(`http://221.141.3.91:8091`)으로 교체.
- `apps/partner-app/src/config.ts`의 prod `CUSTOMER_APP_URL`은 지난 세션에 이미 `http://221.141.3.91:8090`(customer-app의 기존 실제 운영 주소)으로 정확히 넣어뒀던 값이라 변경 불필요 — 실배포 주소를 처음부터 가짜 placeholder 없이 넣어뒀던 선택이 이번에 그대로 맞아떨어짐.

### 서버 쪽 후속 작업(아직 미실행, 사용자가 직접 진행 필요)
- `server/checklist.md`의 "Windows 서버 배포/업데이트 절차" 섹션을 새 구조에 맞게 갱신(8091 nginx 서버 블록 추가, 8090의 `/api/` 프록시 location 제거 권장, api는 nginx 없이 Node가 직접 0.0.0.0:8092로 리슨, Windows 방화벽에 8091/8092 인바운드 허용, 서버 `.env`에 `PORT=8092`+`CORS_ORIGINS` 반영) — 정확한 nginx 설정 스니펫과 순서는 그 파일에 정리해둠.
- 로컬(Mac)에서는 dev 포트(customer-app 5173/partner-app 5174/api 3000)가 그대로라 이번 변경이 로컬 개발 워크플로우에는 영향 없음 — `import.meta.env.DEV` 분기값은 전부 그대로 두고 prod 분기값만 바꿨기 때문.

## 내 업체 관리 메인·기본정보 관리 API 연계 (2026-07-27)

### 배경 및 스코프 확정
- "내 업체 관리 메인 및 기본정보 관리 api 연계"라는 요청을 받고 착수 전 디자인(`MotoPay 시공업체 업체관리.dc.html`)을 먼저 확인 — PT-PROF-01~08 총 8개 화면 중 요청에 해당하는 건 01(메인)·02(기본정보 관리) 2개뿐임을 확인, 나머지 6개(휴무일/예약가능시간/예약현황/알림함/비밀번호변경/로그아웃확인)는 스코프 밖으로 명확히 선을 그음.
- 착수 전 AskUserQuestion으로 확인한 것: 기본정보 관리 화면의 대표사진·소개사진(최대 10장) 업로드까지 이번에 구현할지 — **텍스트/주소/전화/운영시간/카테고리만 먼저** 하는 쪽으로 확정하고 사진은 UI 플레이스홀더로 유지. 프로필 사진과 동일한 base64 업로드 패턴이 이미 있어 기술적으로 어렵지는 않지만, 그 자체로 꽤 큰 별도 작업량이라 범위를 미리 좁혀둠.

### 스키마 갭 2건 발견 — 착수 전 미리 확인해서 다행이었던 부분
- **운영시간 컬럼 부재**: `Shop` 모델에 디자인이 요구하는 "운영시간"(자유 텍스트 안내문) 컬럼이 없었음 → `businessHours String?`(nullable) 추가. nullable이라 기존 행에 백필 이슈 없이 무중단 마이그레이션.
- **CAR_INST 공통코드 4종만 존재**: 디자인 목업은 유리막코팅/PPF/틴팅/블랙박스/실내크리닝/언더코팅 6종 카테고리를 다루는데, 실제 `CAR_INST` 공통코드엔 실내크리닝·언더코팅이 없었음(썬팅/PPF/유리막코팅/블랙박스 4종만 시드돼 있었음) → `seed-common-codes.ts`에 `CLEAN`(실내크리닝)/`UCOAT`(언더코팅) 2건 추가(대문자 영문 약어 컨벤션 — CLAUDE.md의 코드성 컬럼 규칙 그대로 준수). 이런 종류의 "디자인이 요구하는 옵션이 실제 마스터 데이터에 없다"는 갭은 매번 실제 스키마·시드 데이터를 먼저 열어보지 않으면 놓치기 쉬운 지점이라, 이번에도 착수 전 확인 습관이 그대로 유효했음.

### API 설계
- `GET /shops/me`/`PATCH /shops/me`를 기존 `ShopsModule`(`ShopsController`/`ShopsService`)에 추가 — 파트너 전용 신규 모듈을 만들지 않고 기존 Shop 관련 로직이 이미 있는 곳에 얹음(로그인/인증은 `PartnerAuthModule`로 완전 분리했던 것과 다른 결정인데, 이유는 "Shop"이라는 리소스 자체가 이미 하나의 응집된 도메인이고 `getMe`가 하는 일이 사실상 `getDetail(shopCode)`와 동일해서 로직 중복 없이 그대로 재사용 가능했기 때문. 인증(로그인)은 완전히 다른 사용자 테이블·다른 realm이라 분리가 맞았지만, 이건 같은 `Shop` 리소스를 보는 관점만 다른 것이라 분리할 이유가 약했음).
- **라우트 순서 함정**: `@Get('me')`를 `@Get(':shopCode')`보다 반드시 먼저 선언해야 함 — 안 그러면 Express/Nest가 `GET /shops/me`를 `shopCode='me'`로 잘못 매칭해버림(파라미터 검증이 없어서 조용히 통과해버리는 게 더 위험). curl로 두 라우트가 각자 의도대로 응답하는지 라우트 순서 변경 후 실제로 재확인함.
- `PATCH /shops/me`의 `categories` 필드는 보내면 `ShopInstCategory`를 delete+createMany로 전체 교체하는 방식 — 부분 diff(추가/삭제만 계산) 대신 전체 교체를 택한 이유는 프론트가 어차피 토글 UI로 "현재 활성화된 카테고리 전체 목록"을 들고 있어서 그대로 보내는 게 자연스럽고, 카테고리 개수가 6개뿐이라 매번 전체 교체해도 비용이 무시할 만함.

### 프론트 설계
- 이 프로젝트(고객앱·파트너앱 통틀어) **최초의 Textarea 프리미티브**를 추가함(`components/ui/Textarea.tsx`) — 지금까지 Input/Checkbox/Button/BottomSheet/Toast만 있었고 멀티라인 입력이 필요한 화면이 이번이 처음이라 Cardoc 디자인시스템 번들(`_ds_bundle.js`)에서 `Textarea.jsx` 소스를 직접 열어 패딩·라운드·포커스링 값을 그대로 이식.
- **"로그아웃"만 스코프 밖인데도 실제로 구현한 결정**: 메인 화면의 부가메뉴 3개(알림함/비밀번호변경/로그아웃) 중 앞 2개는 화면 자체가 없어 토스트로 남겨뒀지만, 로그아웃은 "같은 화면 안의 확인 모달"만 있으면 완결되는 기능이고(새 화면 필요 없음), 이게 없으면 로그인한 뒤 이 앱에서 나갈 방법이 전혀 없는 실사용 결함이 됨 — CLAUDE.md의 "no half-finished implementations" 원칙에 따라 최소 완결성을 위해 포함시킴. 마이페이지 로그아웃(customer-app)을 만들 때도 비슷한 논리로 "명시적으로 요청 안 받았어도 저위험 확장으로 포함"했던 선례와 같은 판단.
- 카테고리 토글 UI는 백엔드에 새 엔드포인트를 만들지 않고 기존 `GET /common-codes/CAR_INST`(전체 카테고리 목록) + `GET /shops/me`의 `categories`(현재 활성 목록) 두 응답을 프론트에서 조합해서 구성 — 필요한 데이터가 이미 두 곳에 있어서 백엔드 확장 없이 프론트 조합만으로 충분했음.
- "승인대기 중이에요" 배너: 원본 디자인엔 있지만 실제 관리자 승인 워크플로우 자체가 이 프로젝트에 아직 없음(관리자웹 자체가 미착수) — 가짜 백엔드 승인 플래그 컬럼을 만들지 않고, 저장 성공 시 세션 동안만 켜지는 순수 프론트 로컬 state로 처리. 나중에 실제 관리자 승인 기능이 생기면 그때 `Shop`에 `approvalStatus` 같은 실제 컬럼을 추가하고 이 배너를 그 값과 연동하면 됨.

### 검증
- curl로 6개 케이스(인증 없이 GET/PATCH 거부 2건, 로그인 후 GET 성공, 라우트 순서 검증용 `:shopCode` 병행 조회, PATCH 성공, 카테고리 전체교체 확인) 전부 통과.
- Playwright로 로그인(강제 비밀번호 변경 포함)→홈→"마이"탭→내 업체 관리 메인(실제 업체명·소개·주소)→기본정보 관리(실제 소개글·인사말·주소·전화·운영시간·카테고리 로드 확인)→운영시간 수정+카테고리 토글→저장→"승인대기" 배너 노출까지 스크린샷으로 확인. 저장 직후 DB를 직접 조회해 카테고리가 실제로 정확히 반영된 것도 재확인(스크린샷만으로는 칩 색상을 오판할 뻔했는데 DB 직접 조회로 실제 정확함을 확인 — 스크린샷 판독보다 실제 데이터 조회가 더 신뢰할 수 있는 검증 수단이라는 걸 다시 확인).
- 테스트로 바뀐 시드 데이터(카테고리·운영시간·계정 비밀번호/mustChangePassword)는 전부 원래 문서값으로 원복.

### 미해결/후속
- 대표사진/소개사진 업로드, PT-PROF-03~06(휴무일/예약가능시간/예약현황/알림함) 화면은 스코프 밖으로 남겨둠 — 관련 테이블(`ShopPhoto`/`ShopHoliday`/`ShopTimeSlot`/`ShopDailySlot`)은 이미 스키마에 다 있어 다음 작업 때 바로 활용 가능.
- "주소" 필드는 원본 디자인 그대로 비활성 상태(실제 주소 검색 API 연동 전까지는 값 변경 불가) — 실제 주소 검색(카카오/다음 우편번호 API 등) 도입 시 함께 다뤄야 함.

## 컨텍스트 노트 — 푸시 알림 인프라 (Phase 28, 2026-08-13)

### 배경 및 스코프 확정
- "푸쉬 기능 추가하려면 어떻게 해야 하는지 설명해줘"라는 질문으로 시작 — 아직 코드 작업 요청이 아니라 아키텍처 설명 요청이었음. 먼저 `agreedMarketingPush`(User 모델에 이미 있던 필드)로 미루어 푸시가 기획상 예정돼 있었다는 것과, 실제 발송 인프라(토큰 저장/발송 API/클라이언트 SDK)는 전혀 없다는 것을 확인한 뒤 설명함.
- AskUserQuestion으로 두 가지를 확정: ① 적용 범위 — customer-mobile을 우선 구현하되 PushToken 모델은 partner-app으로 나중에 확장 가능하게 설계, ② 첫 발송 트리거 — 인프라부터 구축하고 예약 확정/시공 완료 같은 서비스 알림을 첫 트리거로 연결(마케팅성 알림은 후순위).
- CLAUDE.md 규칙(비트리비얼 작업은 착수 전 Plan+checklist+context-notes)에 따라 실제 구현 착수 전에 이 문서부터 먼저 작성 — 아직 실제 코드 변경은 없음(계획 단계).

### 아키텍처 선택 — Web Push가 아니라 Expo Push Notification Service
- customer-mobile이 순수 웹뷰 셸(RN 자체 UI 없음, `mobile/context-notes.md`의 "웹뷰 하이브리드" 결정 참고)이라, 표준 Web Push(Service Worker) 대신 **Expo Push Notification Service**를 경유하는 구조를 선택. Expo가 FCM(Android)/APNs(iOS) 연동을 대신 처리해줘서 두 플랫폼 자격증명을 백엔드가 직접 다룰 필요가 없음.
- 발송 흐름: `NestJS API`(이벤트 발생) → `Expo Push API`(HTTP POST, `expo-server-sdk`로 래핑) → `FCM/APNs` → 기기.

### PushToken 모델 — 다형(polymorphic) 설계 이유
- 로그인 계정 테이블이 `User`(고객)/`PartnerUser`(시공업체)/`AdminAccount`(딜러·운영사) 3개로 이미 분리돼 있어 단일 FK로 걸 수 없음. `ownerType`('USER'|'PARTNER') + `ownerId`(FK 없는 문자열) 조합으로 다형 참조를 하기로 함 — 지금은 `ownerType='USER'` 경로만 실제로 씀.
- 시스템 컬럼 규칙(CLAUDE.md 7번) 검토: 이 테이블은 관리자가 직접 수정하는 CRUD 대상이 아니라 클라이언트가 자동으로 upsert하는 시스템 테이블이라 `createdBy`/`updatedBy`는 두지 않기로 함 — "행위자" 개념이 없는 자기 자신의 기기 등록이라 CLAUDE.md의 매핑/로그성 테이블 제외 사유와 같은 논리.

### 트리거 분류 — 서비스 필수 vs 마케팅
- `agreedMarketingPush`는 회원가입 시 받는 "마케팅 푸시 수신 동의"(선택 항목)라, 예약 확정/시공 완료처럼 거래 자체의 진행 상태를 알리는 서비스 필수 알림에는 적용하지 않기로 함(동의 여부와 무관하게 발송). 프로모션성 알림을 나중에 추가할 때만 이 필드로 체크 분기 필요.

### 확인된 제약 — EAS 자격증명은 내가 대신 할 수 없는 부분
- `apps/customer-mobile`에 `eas.json`이 아직 없음 — Android는 FCM 서버 키(또는 EAS가 관리하는 FCM V1), iOS는 APNs 키를 EAS 계정에 등록해야 실제 푸시 발송이 동작함. 이건 Expo/Apple 개발자 계정 접근이 필요해 에이전트가 대신 처리할 수 없고, 사용자가 직접 진행하거나 필요한 키 값을 전달해줘야 함 — 이 항목이 없으면 나머지 코드가 다 완성돼도 실제 알림이 기기에 도착하지 않음.

### 미해결/후속
- `ownerType='PARTNER'`(partner-app) 발급/등록 흐름은 이번 범위 밖 — 테이블 구조만 재사용 가능하게 설계해뒀고, 실제 partner-app 클라이언트 연동은 후속 작업.
- 발송 트리거를 예약 확정/시공 완료 2건 이상으로 넓힐지(입찰 마감 임박 등)는 아직 기획 확정 전 — 인프라(모델/서비스/엔드포인트)만 먼저 갖추고 트리거는 요청 시 추가하기로 함.

## 컨텍스트 노트 — 포인트 충전/사용 연계·회원 상세 재구성·쿠폰함 연계 (Phase 29, 2026-08-17~08-18)

### 배경
- 이전 세션에서 포인트홈(CU-PNT-01) API 연동까지는 끝냈지만, 충전(CU-PNT-02)과 예약 결제 시 포인트 사용은 "백엔드가 없다"는 이유로 UI 시뮬레이션 상태로 남겨뒀었음. 이번 요청("포인트 충전, 사용내역까지 연계")으로 그 미해결분을 실제로 마저 연동함.

### 결정
- **`PointsService.adjust()` 단일 진입점**: 관리자 강제부여/차감·신차구매 지급·자기 충전·자기 사용까지 포인트 잔액을 바꾸는 경로가 4개인데, 잔액 갱신+`PointHistory` 기록 로직을 각자 구현하면 나중에 한 곳만 고치고 나머지를 놓치는 사고가 나기 쉬워 처음부터 하나의 사설 메서드로 모으는 쪽을 택함.
- **포인트 차감 → 결제확정 순서**: 예약 결제 시 포인트를 사용하는 트랜잭션에서, 포인트가 부족하면 예약 자체가 결제완료 상태로 넘어가지 않아야 하므로 차감을 먼저 시도하고 성공했을 때만 예약 상태를 바꾸도록 순서를 정함. 실제로 잔액 부족 케이스를 만들어 예약이 그대로 남아있는지 확인함.
- **처리자 표시 — id에서 사람이 읽을 수 있는 이름으로(2단계 피드백)**: `PointHistory.createdBy`는 스키마 주석대로 자기 자신 처리(User.id)와 관리자 처리(AdminAccount.username)가 섞여 저장되는데, 처음엔 이를 구분 없이 "본인"으로 뭉뚱그렸다가 "본인 보다 회원명으로 표시해줘" 피드백을 받고 실제 이름으로 교체. 관리자 처리 건도 raw username이 그대로 보이길래 "admin 대신 사용자명으로 변경" 피드백을 받아 `AdminAccount.findMany({username:{in:[...]}})`로 일괄 조회 후 매핑하는 방식으로 고침 — 한 번에 맞히지 못했던 부분이라 다음에 비슷한 처리자/작성자 표시를 만들 땐 "본인/회원명/관리자명" 3가지 경우를 처음부터 다 고려할 것.
- **등급 산정 로직 공유**: `MemberGradeRulesService`의 산정 기준 로직이 회원 상세(기준정보 탭)와 쿠폰 발행 대상 미리보기(조건별 발행) 양쪽에서 필요해져, 서비스 하나에만 두고 양쪽이 재사용하도록 함(로직 중복 방지).

### 검증
- 실 로그인으로 충전→홈 배지 반영→예약 결제 시 사용→내역 조회까지 curl/직접 테스트, 테스트로 바뀐 포인트 잔액은 시드값으로 원복.

### 미해결/후속
- 등급을 실제로 재계산하는 배치/트리거가 없음 — 설정값과 계산 로직만 존재.

## 컨텍스트 노트 — AD-CS-02·AD-CS-03·AD-NOTI-02 전체 연동 (Phase 30, 2026-08-18)

### 배경 및 스코프 확정
- "AD-CS-02, AD-CS-03, AD-NOTI-02 api 연계 처리" 요청에 착수하기 전, 1:1 문의·FAQ는 이미 customer-app에 목업 화면(`CsFlow.tsx` 등)이 있다는 걸 확인하고 AskUserQuestion으로 "관리자 화면만 만들지 / 고객앱까지 실연동해서 전체 루프를 완성할지" 확인 — **"고객앱까지 전체 연동(추천)"**으로 확정. 이 선택 덕분에 백엔드+admin-app+customer-app 3단 작업이 한 스코프로 묶임.

### 설계 결정
- **문의유형 카테고리 값 — 설계 문서보다 customer-app 실제 렌더를 신뢰**: `INQUIRY_CATEGORY` 공통코드를 새로 시드하면서, 설계 문서상 카테고리 목록과 customer-app의 기존 목업 문구(`csData.ts`의 `INQUIRY_CATEGORIES`)가 다르길래 이 프로젝트의 기존 원칙(설계 문서 prose보다 이미 배포된 실제 렌더를 신뢰)을 그대로 적용해 목업 문구 그대로 시드함.
- **문의 답변 정렬 — PENDING을 상단 고정**: `orderBy: [{status:'desc'}, {createdAt:'desc'}]`로 처리했는데, 이건 'PENDING' > 'ANSWERED'가 알파벳 내림차순이라는 우연한 문자열 특성을 이용한 것 — 상태값 스펠링이 바뀌면 깨지는 암묵적 가정이라 다음에 이 코드를 만지는 사람은 반드시 인지해야 함(주석으로 남겨둠).
- **문의 수정 시 첨부사진 — 전체교체가 아니라 부분 유지**: 처음엔 review/reservation 첨부사진처럼 "수정 시 전체 삭제 후 재등록"으로 갈 수도 있었지만, 사진이 5장까지 붙을 수 있는데 제목 하나 고칠 때마다 기존 사진을 전부 base64로 다시 올려야 한다면 낭비가 크다고 판단해, `photos` 배열에 `data:` 접두사(신규)와 기존 상대경로(유지)를 섞어 보내도록 설계하고 서버가 판별해서 신규만 저장하도록 함. Prisma 서비스 레이어의 `updateMine()`에 이 로직이 있음.
- **UI 버그 3건의 공통 원인 — ag-grid의 커스텀 cellRenderer 래퍼(`ag-react-container`)는 스스로 세로 중앙정렬을 하지 않는다**: "처리 버튼이 top 정렬", "평점 컬럼 정렬 안 맞음" 리포트를 받고 처음엔 `cellClass`만 만졌다가(가로 정렬은 고쳐짐) 세로 정렬은 그대로였음 — 기존에 이미 있던 삭제 아이콘 버튼(`CstItemMgmtPage` 등)들이 전부 `h-full w-full flex items-center justify-center`로 만들어져 있었다는 걸 뒤늦게 대조해서 발견, 같은 패턴을 처리 버튼 자체가 아니라 **감싸는 wrapper div**에 적용해야 한다는 걸 확인함. 다음에 admin-app 그리드에 커스텀 아이콘/버튼 셀을 넣을 땐 `cellClass`(가로) + wrapper `h-full`(세로) 둘 다 필요하다는 걸 기억할 것.

### 검증
- 문의 등록(사진 첨부)→관리자 답변(확인모달 경유)→고객 반영→답변완료 후 수정 차단(400)까지 curl 전 구간, FAQ 등록→공개 엔드포인트 즉시 노출, 후기 블라인드 처리/해제로 실제 후기 3건 노출 변화 확인 후 원복. 테스트 데이터·첨부파일 전부 정리.

### 미해결/후속
- admin-app 전체 이력이 그동안 한 번도 설계 문서에 기록되지 않았다는 걸 이번에 발견 — `admin/checklist.md`·`admin/context-notes.md`를 신설해 사후 재구성함(git log가 10개 커밋뿐이라 파일 헤더 주석·menuConfig.ts의 날짜 명시 메모를 근거로 재구성, 원본 대화 기반이 아니므로 신뢰도가 이 문서보다 낮음 — 상세는 그쪽 문서의 "이 문서의 성격" 참고).

## 컨텍스트 노트 — 푸시 알림 실기기 배포·검증 (Phase 28 마무리, 2026-08-19)

### 배경
- Phase 28(2026-08-13)에서 인프라 코드까지는 완성했지만 `eas.json`/EAS 자격증명이 없어 실제 토큰 발급이 막혀있던 상태 — "이제 미뤄두었던 푸시 기능 작업 진행하자" 요청으로 재개, 사용자가 직접 `eas init`부터 FCM 자격증명까지 대화형으로 진행.

### 겪은 문제와 해결 순서(전부 실제로 순차 발생, 다음에 비슷한 설정을 할 때 참고)
1. **admin-app dist가 오래된 빌드였음** — 이 작업과 별개로 admin-app/customer-app/partner-app 세 앱의 로컬 `dist`가 각각 8/5~8/11 빌드로 멈춰있었던 걸 배포 확인 과정에서 우연히 발견, 전부 재빌드. **다음부터는 배포 요청이 오면 재빌드부터 먼저 하고 시작할 것** — dist가 소스보다 오래된 상태가 이 프로젝트에서 반복적으로 발생함.
2. **`eas credentials` 실행 시 `eas.json` 없음 에러** — `eas init`은 프로젝트 연결(projectId)만 하고 `eas.json`(빌드 프로필)은 별도. 이 프로젝트는 로컬 gradle 빌드만 쓰고 EAS 클라우드 빌드는 안 쓰므로, `eas build:configure`의 풀 대화형 흐름 대신 `eas credentials`가 참조할 최소 `production` 프로필만 담은 `eas.json`을 직접 작성해서 해결.
3. **`google-services.json` 배치 후 prebuild 재실행 필요** — `android/`이 gitignore된 Expo prebuild 산출물이고 이 저장소는 매 빌드마다 prebuild를 다시 안 돌리는 구조([[android-release-apk-build]] 참고)라, `app.json`에 `googleServicesFile`을 연결한 것만으로는 부족하고 `npx expo prebuild -p android --clean`을 명시적으로 다시 돌려야 `android/build.gradle`에 Google Services 플러그인이 실제로 연결됨. 재빌드 후 최종 병합 매니페스트(`android/app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml`)에서 `POST_NOTIFICATIONS`/Firebase 서비스가 실제로 들어갔는지 직접 확인.
4. **api 배포 후 8092가 완전히 죽음** — 이번에 `expo-server-sdk`를 새 npm 의존성으로 추가했는데, 이전에 안내한 배포 절차가 "Prisma 스키마만 바뀐 경우"였던 걸 그대로 재사용해서 `package.json` 변경분을 놓침. 서버에 `Cannot find module 'expo-server-sdk'`로 죽어있었음 → `npm ci --omit=dev` 재실행으로 해결. **의존성 추가 작업을 했으면 다음 배포 안내 시 반드시 "백엔드 의존성이 바뀐 경우" 절차까지 같이 언급할 것** — 이번처럼 이전 세션에 준 절차를 그대로 재사용하면 놓치기 쉬움.
5. **`npm ci` 이후 `.prisma/client` 모듈도 사라짐** — `npm ci`가 `node_modules`를 통째로 새로 설치하면서 이전에 만들어둔 Prisma 생성 클라이언트까지 같이 지워짐 → `npx prisma generate` 재실행으로 해결. 의존성 변경 배포 절차에 이미 있던 단계지만, 사용자가 두 단계를 분리해서 인지하지 못해 한 번 더 명시적으로 안내해야 했음.
6. **customer-app 실제 배포 경로가 문서와 다름** — `server/checklist.md`엔 "root D:/Project/moto_dev"로 문서화돼 있었지만 실제 nginx root는 `D:\Project\moto_dev\customer-app\dist`(하위에 앱별 폴더가 있는 구조). curl로 서버가 서빙 중인 JS 번들 해시를 직접 비교하는 방식으로 "복사했다는데 반영이 안 됨" 문제를 계속 잡아냈고, 결국 사용자가 정확한 경로를 알려줘서 해결 — **다음에 유사 배포 확인 문제가 생기면 매번 "복사했나요?" 되묻기보다, `curl`로 서빙 중인 자산 파일명을 직접 대조하는 방식이 훨씬 빠르고 정확함**(이번에 실제로 유효했던 방법).
7. **웹뷰가 이전 JS를 캐시** — 서버 파일은 최신인데도 기기에서 반영이 안 됨 → 앱 강제종료+재실행만으로는 안 지워지고, **기기 설정에서 앱 캐시/데이터 삭제**까지 해야 웹뷰가 새 번들을 다시 받아옴. `react-native-webview`는 기본적으로 HTTP 캐시를 앱 데이터 안에 영구 보관하는 걸로 보임.
8. **`http.ts`의 빈 응답 파싱 버그 발견** — release 빌드에서는 `console.log`가 `ReactNativeJS` 태그로 logcat에 전혀 안 잡힌다는 걸 이번에 확인(release JS 콘솔이 네이티브 로그로 안 이어짐, RN/Hermes release 최적화 특성으로 추정) → `adb logcat`으로 디버깅하는 대신 **`window.alert()`를 임시로 심어서 단계별 성공/실패를 직접 눈으로 확인하는 방식**으로 전환, 실제로 원인을 빠르게 찾아냄. 이 방식으로 `POST /me/push-token`(void 응답) 클라이언트 파싱 실패를 발견 — DB엔 이미 정상 등록됐는데 클라이언트만 에러로 오인하고 있었음. 원인 확인 후 `http.ts`의 `handle()`을 응답 본문이 비어있으면 파싱을 건너뛰도록 수정하고, 디버그용 `alert()`는 전부 제거.
9. **FCM V1 403 권한 오류(가장 오래 걸린 부분)** — 서버는 정상 등록, 발송 티켓도 "ok"였지만 실제 리시트 조회(`getPushNotificationReceiptsAsync`)에서 `PERMISSION_DENIED: cloudmessaging.messages.create`. **원인**: `eas credentials`로 업로드한 FCM V1 서비스 계정 키(`firebase-adminsdk-fbsvc@<project>.iam.gserviceaccount.com`)가 GCP IAM에 프로젝트 수준 역할이 전혀 없는 상태(신규 Firebase 프로젝트인데도 기본 역할이 자동 부여 안 돼 있었음 — 어떤 조건에서 자동부여가 안 되는지는 이번엔 특정 못함). Google Cloud Console → IAM에서 그 서비스 계정에 **"Firebase Cloud Messaging API Admin"** 역할을 수동으로 추가한 뒤 정상 발송(`getPushNotificationReceiptsAsync` status: ok, 기기 실제 수신 확인)까지 확인. **참고**: 티켓(`status:"ok"`)만으로는 실제 배달을 보장하지 않음 — 항상 `getPushNotificationReceiptsAsync`로 리시트까지 확인해야 진짜 성공 여부를 알 수 있다는 게 이번에 실전으로 확인됨.

### 검증
- 실 계정(leehj/이형준) 실기기 로그인 → `push_tokens` 실제 등록 확인 → `sendPushNotificationsAsync`+리시트 조회로 FCM 배달 확인 → 기기 실제 알림 수신 확인. 테스트 중 남은 초기 토큰 1건은 정리, 최종 실 토큰은 실사용자의 정상 등록 데이터라 유지(삭제하지 않음).

### 미해결/후속
- iOS APNs는 미착수 — Apple Developer Program 필요.
- 이번에 겪은 "IAM 역할이 자동으로 안 붙어있었다"는 현상의 정확한 원인(신규 프로젝트 생성 방식 차이 등)은 밝히지 못함 — 나중에 같은 조직에서 새 Firebase 프로젝트를 또 만들 일이 있으면 처음부터 IAM 역할을 확인하는 습관이 필요.
