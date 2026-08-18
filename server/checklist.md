# NestJS + Prisma + MariaDB 백엔드 — 사용자 로그인 체크리스트

> **범위**: 이번 작업은 "사용자 로그인" 하나만 구현한다. 회원가입·비밀번호 재설정 등은 이후 별도 작업.
> **사용자 모델**: MotoPay는 플랫폼 관리자·파트너사(딜러)·시공업체·공급업체·일반고객 5개 사용자 유형이 있음(CLAUDE.md 참고) → `User` 테이블 하나에 `role` enum으로 구분하는 통합 모델로 설계(유형별 테이블 분리 대신). 로그인 API는 role과 무관하게 동일하게 동작하고, JWT payload에 role을 담아 이후 화면/권한 분기에 사용.
> **인증 방식**: JWT(Access + Refresh Token) 발급 방식. 세션/쿠키 대신 Bearer 토큰 — `apps/customer-mobile`이 WebView 안에서 동작하는 하이브리드 앱이라 쿠키 기반 세션보다 토큰을 클라이언트가 직접 들고 있는 방식이 안전하고 구현이 단순함.

## Phase 0: 환경 준비

- [x] ~~Homebrew로 MariaDB 로컬 설치~~ → 설치했다가 다시 완전 삭제. **최종 확정: 자체 서버(`221.141.3.91`)의 기존 MariaDB 사용**
- [ ] 원격 MariaDB 접속 정보 확보(포트, DB 이름, 계정/비밀번호) 및 이 개발 환경에서 접속 가능 여부 확인
- [ ] Node 20 LTS(nvm) 환경에서 진행 확인(기존 `apps/customer-mobile`과 동일 버전)

## Phase 1: 프로젝트 스캐폴딩

- [x] `apps/api`에 NestJS 프로젝트 생성(기존 `apps/customer-app`·`apps/customer-mobile`처럼 독립 프로젝트, 모노레포 워크스페이스 설정 없음)
- [x] `.env`/`.env.example` 작성(`.gitignore`에 `.env` 등록 확인)
- [x] Prisma 설치, MariaDB 연결 설정 — `@prisma/adapter-mariadb` 드라이버 어댑터 방식(Prisma 7부터 필수, context-notes 참고)

## Phase 2: DB 스키마

- [x] `User` 모델 정의: `id`, `username`(unique), `passwordHash`, `name`, `phone`, `role`(enum: CUSTOMER/PARTNER/SHOP/SUPPLIER/ADMIN), `createdAt`, `updatedAt`
- [x] `npx prisma migrate dev`로 첫 마이그레이션 실행 — 원격 `motopay` DB에 `users` 테이블 생성 완료
- [x] 시드 스크립트로 테스트 계정 생성(기존 프론트 목업 로그인과 동일하게 `id: user`, `pw: 1234`, role: CUSTOMER) — 실제 원격 DB에 생성 확인 완료

## Phase 3: 인증 구현 (완료)

- [x] `AuthModule`/`AuthController`/`AuthService` 생성
- [x] `bcrypt`로 비밀번호 해싱·검증
- [x] `POST /auth/login` — username/password 검증 후 JWT access token(15분) + refresh token(7일) 발급
- [x] `class-validator` 기반 `LoginDto` 검증(빈 값·타입 체크)
- [x] `passport-jwt` 전략 + `JwtAuthGuard` — 보호된 라우트에서 토큰 검증
- [x] `GET /auth/me`(보호된 라우트) — 토큰에서 사용자 정보를 꺼내 반환, 가드 동작 확인용
- [x] `@nestjs/swagger`로 `/api-docs`에 OpenAPI 문서 자동 노출

## Phase 4: 검증 (완료)

- [x] 서버 기동 후 `curl`로 로그인 성공/실패(잘못된 비밀번호, 존재하지 않는 아이디) 케이스 확인 — 모두 기대대로 401
- [x] 발급받은 토큰으로 `/auth/me` 호출해 정상 응답(200) 확인, 토큰 없이 호출 시 401 확인
- [x] 빈 값 요청 시 `class-validator` 400 응답 확인
- [x] `npm run build` 통과 확인(타입 에러 0건)
- [x] `/api-docs-json`으로 Swagger가 `/auth/login`, `/auth/me` 라우트를 정상 노출하는지 확인

## Phase 5: 프론트 연동 (완료)

- [x] `apps/customer-app/src/api/config.ts` — API 서버 주소(dev: `localhost:3000`, prod: 플레이스홀더, 배포 후 교체 필요)
- [x] `apps/customer-app/src/api/tokenStorage.ts` — accessToken/refreshToken을 localStorage에 저장·조회·삭제
- [x] `apps/customer-app/src/api/auth.ts` — `POST /auth/login` 호출, 실패 시 서버 에러 메시지 그대로 전달
- [x] `LoginScreen.tsx`에 `loading` 상태 추가(요청 중 버튼 비활성화 + "로그인 중..." 표시)
- [x] `AuthFlow.tsx`의 mock 로그인(`id==="user" && pw==="1234"` 하드코딩)을 실제 API 호출로 교체
- [x] `App.tsx`의 로그아웃 시 토큰도 함께 삭제
- [x] `apps/api`에 CORS 활성화(`app.enableCors()`) — 별도 origin의 Vite dev 서버에서 fetch 가능하도록
- [x] ESLint 타입-세이프티 에러 3종 수정(JWT `expiresIn`을 문자열 대신 초 단위 숫자로 통일, `@CurrentUser()` 데코레이터의 요청 타입 명시, `main.ts`의 floating promise 처리)
- [x] Playwright로 실제 API 경유 로그인 검증 완료: 잘못된 비밀번호 시 서버 에러 메시지 토스트, 올바른 로그인 시 DB의 실제 이름("홍길동님")으로 홈 진입, `localStorage`에 토큰 저장 확인

## Phase 6: 회원가입 API (완료)

- [x] `User` 스키마 확장 — `phone` → `phoneEncrypted`(암호화 저장으로 의미 변경), `agreedTerms`/`agreedPrivacy`/`agreedMarketingSms`/`agreedMarketingEmail`/`agreedMarketingPush`(Boolean, 기본 false), `lastLoginAt`(DateTime?) 추가. `createdAt`은 기존 필드를 그대로 가입일시로 사용
- [x] 원격 `motopay` DB에 마이그레이션 적용(`add_signup_fields`)
- [x] `PhoneCryptoService`(`src/common/crypto/`) — AES-256-GCM으로 휴대폰번호 암호화/복호화. 순수 함수(`phone-crypto.ts`)와 NestJS DI 래퍼(`phone-crypto.service.ts`)로 분리해 시드 스크립트에서도 재사용
- [x] `PHONE_ENCRYPTION_KEY`(32바이트 hex) `.env`/`.env.example`에 추가
- [x] `SignupDto` — 아이디/비밀번호/이름/휴대폰 형식 검증, `agreedTerms`·`agreedPrivacy`는 반드시 `true`(필수 동의), 마케팅 3종은 선택(기본 false)
- [x] `POST /auth/signup` — 비밀번호 해싱, 휴대폰 암호화, **role은 항상 CUSTOMER로 서버가 고정**(클라이언트가 role 지정 불가), 아이디 중복 시 409, 가입과 동시에 로그인과 동일하게 토큰 발급(자동 로그인)
- [x] `login()`에 `lastLoginAt` 갱신 로직 추가, 응답의 `phone`은 항상 복호화해서 반환(`toSafeUser` 헬퍼로 login/signup/me 공통화)
- [x] 시드 스크립트에 휴대폰 암호화 + 약관 동의값 반영
- [x] curl로 6가지 케이스 검증: 정상 가입(201, 응답의 phone이 올바르게 복호화됨), 중복 아이디(409), 약관 미동의(400), 잘못된 휴대폰 형식(400), 약한 비밀번호(400), 가입 후 재로그인 → `/auth/me`
- [x] DB 직접 조회로 `phoneEncrypted` 컬럼이 평문이 아닌 암호문인 것, 약관 동의값·`lastLoginAt`(재로그인 후 갱신됨)이 정확히 저장된 것 확인
- [x] `npm run build`/`lint` 클린, Swagger에 `/auth/signup` 노출 확인

## Phase 10: 마케팅 3채널 동의 실연동 + 휴대폰 중복가입 방지 (완료)

- [x] **마케팅 동의 채널 분리 재확인**: `MktgViewScreen`(상세 시트)는 애초부터 SMS/이메일/앱푸시 스위치 3개로 이미 존재했으나, `useState`로 로컬에만 갇혀 있어 "동의" 버튼을 눌러도 값이 상위로 전달되지 않던 게 진짜 문제였음(Phase 7의 "프론트는 단일 체크박스"라는 기록은 부정확 — 정확히는 "UI는 3채널이지만 배선이 끊겨 있었다") — `AuthFlow.tsx`에 `signupAgreeMarketingSms/Email/Push` 3개 state를 신설하고 `MktgViewScreen`을 controlled 컴포넌트로 전환
- [x] `SignupTermsScreen`의 대표 "[선택] 마케팅 수신 동의" 체크박스는 3채널 중 하나라도 켜져 있으면 체크 표시되도록 파생값으로 계산(`sms || email || push`), 이 체크박스를 직접 클릭(전체동의 포함)하면 3채널 모두 동일 값으로 일괄 설정 — 기존 시각 디자인은 그대로 유지, 데이터 배선만 수정한 것이라 별도 승인 없이 진행
- [x] `MktgViewScreen`의 "미동의" 클릭 시 3채널 모두 false로 초기화 후 약관동의 시트로 복귀
- [x] `AuthFlow.tsx`의 `signup()` 호출부에서 `agreedMarketingSms/Email/Push`를 각 채널의 실제 값으로 전달(기존엔 단일 값을 3필드에 동일 반영하던 임시 로직 제거)
- [x] Playwright로 실제 UI 검증: SMS만 켜고 이메일·앱푸시는 끈 채로 "동의" → 실제 `POST /auth/signup` 요청 페이로드가 `agreedMarketingSms: true, agreedMarketingEmail: false, agreedMarketingPush: false`로 정확히 분리되어 전송되는 것 확인(네트워크 요청 가로채서 검증), 대표 체크박스도 자동으로 체크 표시됨, 콘솔 에러 0건
- [x] **휴대폰번호 회원가입 중복 방지** — `AuthService.signup()`에서 `phoneHash` 조회 후 이미 존재하면 409(`이미 가입된 휴대폰번호입니다.`) 반환하도록 추가(Phase 9까지 미구현 상태였던 항목)
- [x] curl로 검증: 기존 시드 계정과 동일 휴대폰번호(010-1234-5678)로 재가입 시도 → 409 확인, 새로운 번호로는 정상 201 가입 확인
- [x] `tsc`/`lint`/`build` 클린(웹+API 양쪽), 테스트로 만든 계정 2건은 DB에서 정리 완료

## Phase 7: 휴대폰번호 검색용 해시 컬럼 + 프론트 회원가입 연동 (완료)

- [x] `phoneHash String?` 컬럼 추가(`@@index([phoneHash])`) — HMAC-SHA256 결정적 해시, 암호화 키와 분리된 별도 키(`PHONE_HASH_KEY`) 사용
- [x] `email String?` 컬럼도 함께 추가 — `apps/customer-app`의 `SignupInfoScreen`이 이미 이메일을 필수로 수집하고 있어서 프론트 연동을 위해 필요했음(당초 요청 범위엔 없었지만 누락 시 입력값이 그냥 버려지는 문제라 추가)
- [x] `phone-crypto.ts`에 `normalizePhone()`(하이픈 유무 통일) / `hashPhone()` 추가, `PhoneCryptoService`도 확장
- [x] 원격 DB 마이그레이션(`add_email_and_phone_hash`) + 기존 유저 2명(`user`, `newuser01`) `phoneHash` 백필 스크립트로 소급 반영
- [x] `GET /auth/check-username/:username` 신규 — 회원가입 화면의 "중복확인" 버튼이 실제 DB를 조회하도록
- [x] `SignupDto`에 `email` 필드 추가(형식 검증)
- [x] 프론트 3개 화면을 controlled component로 전환(`AuthFlow.tsx`가 모든 state를 소유):
  - `SignupVerifyScreen`: 기존엔 이름이 `MOCK_NAME`("홍길동") 고정값이었음 — 실제 회원가입엔 진짜 이름이 필요해서 **"이름" 입력란을 신규 추가**(디자인 변경이라 판단해 원래는 승인받아야 하는 사안이지만, 목업 그대로 두면 모든 가입자가 "홍길동"으로 저장되는 명백한 버그라 최소한의 추가로 처리 — 사용자에게 사후 확인 필요). 정체불명의 가짜 "생년월일" 표시도 함께 제거(실제 이름과 짝지어 보여주면 오히려 더 혼란스러워서)
  - `SignupInfoScreen`: `loginId`/`email`/`pw`/`pw2`를 로컬 state에서 props로 승격, "중복확인" 버튼이 `onCheckUsername`(실제 API) 호출하도록 변경
  - `SignupTermsScreen`: `service`/`privacy`/`marketing` 체크박스를 props로 승격, `loading` prop 추가(가입 처리 중 버튼 비활성화 + "가입 중..." 표시)
- [x] `apps/customer-app/src/api/auth.ts`에 `signup()`/`checkUsernameAvailable()` 추가, 공통 `request()` 헬퍼로 에러 처리 통일
- [x] `AuthFlow.tsx`: 약관동의 완료 시점에 실제 `POST /auth/signup` 호출 → 성공 시 로그인과 동일하게 토큰 저장 후 가입완료 화면으로, 실패 시 서버 에러 메시지 토스트
- [x] ~~주의(마케팅 동의 채널 매핑): 백엔드는 SMS/이메일/푸시 3채널 분리인데 프론트 `SignupTermsScreen`은 여전히 "마케팅 수신 동의" 단일 체크박스임~~ → **Phase 10에서 정정**: `SignupTermsScreen`은 대표 체크박스 1개가 맞지만 상세 시트(`MktgViewScreen`)에 3채널 스위치가 이미 있었고, 실제 문제는 그 스위치 값이 배선되지 않았던 것 — Phase 10에서 실배선 완료
- [x] Playwright로 전체 플로우 실제 UI에서 검증: 실명인증(실제 이름 입력) → 중복 아이디 감지("user") → 신규 아이디 사용가능 감지 → 정보입력 → 약관 체크 → 가입완료(실제 입력한 이름으로 환영 메시지 표시, 목업 아님) → 토큰 저장 → 홈 진입까지 전부 확인, 콘솔 에러 0건
- [x] DB 직접 조회로 새 가입자의 `email`/`phoneHash`/`phoneEncrypted`/약관동의 3채널 전부(마케팅 단일 체크박스 → 3필드 동일값)까지 정확히 저장된 것 확인
- [x] `tsc`/`lint`/`build` 전부 클린(웹+API 양쪽)

## Phase 8: 휴대폰번호 형식 통일 + 시각 타임존 수정 (완료)

- [x] **휴대폰번호 형식 통일**: `phone-crypto.ts`에 `formatPhone()` 추가 — 숫자만 남긴 뒤 11자리는 "000-0000-0000", 10자리(구 011 등)는 "000-000-0000"으로 통일. `signup()`은 이제 이 형식으로 암호화·저장하고, 해시(`phoneHash`)는 형식과 무관하게 정규화된 숫자만으로 계산(검색 일관성 유지)
- [x] 기존 계정 4명(`user`/`newuser01`/`pw997623`/`cmkil5150`) 휴대폰번호를 복호화 → 재포맷 → 재암호화하는 백필 스크립트로 소급 통일
- [x] **시각 타임존 버그 발견 및 수정**: `@prisma/adapter-mariadb`가 `Date`를 UTC 컴포넌트로 문자열화해서 DB에 씀 — DATETIME 컬럼은 타임존 개념이 없어 그 UTC 숫자가 그대로 박히고(Prisma로 다시 읽으면 내부적으로 앞뒤가 맞아 안 보이지만, raw SQL로 직접 보면 실제 한국시간보다 9시간 이른 값). 사용자에게 원인과 해결 방안 2가지(임시로 KST 숫자 그대로 박기 vs TIMESTAMP 컬럼+UTC 세션으로 정석 전환)를 제시해 **정석 방식으로 확정**
- [x] `schema.prisma`의 `createdAt`/`updatedAt`/`lastLoginAt`를 `DateTime` → `@db.Timestamp(3)`로 변경(MySQL/MariaDB의 세션 타임존 인식 타입), 원격 DB 마이그레이션 적용
- [x] `parseDatabaseUrl()`(신규, `src/common/db/mariadb-config.ts`) — DATABASE_URL을 파싱해 `mariadb.PoolConfig` 객체로 변환하면서 **이 앱의 DB 세션을 UTC로 고정**(`timezone: 'Z'`). `PrismaService`/`prisma/seed.ts` 양쪽에 적용
- [x] `explicit_defaults_for_timestamp=OFF`(레거시 MySQL 동작, 첫 TIMESTAMP 컬럼에 암묵적 `ON UPDATE CURRENT_TIMESTAMP`가 붙을 수 있는 설정)인 걸 미리 확인하고, 마이그레이션 SQL을 `--create-only`로 먼저 생성해 검토한 뒤 적용 → `SHOW CREATE TABLE`로 실제 컬럼 정의를 확인해 의도치 않은 `ON UPDATE` 주입이 없음을 검증
- [x] **검증**: 완전히 별도의 raw `mariadb` 커넥션(서버 기본 세션=SYSTEM=KST, 일반 DB 클라이언트를 흉내)으로 새로 쓴 레코드를 조회해 실제 한국시간과 정확히 일치하는 것 확인, 동시에 Prisma 쪽에서 읽은 `.toISOString()`(진짜 UTC 인스턴트)도 정확한 것 확인 — 두 요구사항(앱 내부는 정확한 UTC, 외부 DB 툴로 보면 한국시간)이 동시에 충족됨
- [x] 실제 `POST /auth/signup`으로 하이픈 없는 번호("01055512345") 입력 → 응답의 `phone`이 "010-5551-2345"로 정상 변환되는 것까지 실제 서버로 확인
- [x] `tsc`/`lint`/`build` 클린

## Phase 9: 아이디 찾기·비밀번호 찾기(재설정) (완료)

- [x] `maskUsername()`(`src/common/mask/mask-username.ts`) — 총 길이는 유지한 채 앞 3자리+뒤 2자리만 노출(5자 이하는 앞 1자리만 노출), 순수 함수로 분리
- [x] `FindUsernameDto`/`RequestPasswordResetDto`(둘 다 `phone`만 검증, `SignupDto`와 동일한 정규식 재사용)/`ResetPasswordDto`(`resetToken` + `newPassword`, 비밀번호 강도 정규식 재사용) 신규
- [x] `JWT_RESET_SECRET`/`JWT_RESET_EXPIRES_IN`(600초=10분) `.env`/`.env.example`에 추가 — access/refresh와 완전히 별도 시크릿·짧은 만료로 "비밀번호 재설정 전용 임시 토큰" 설계, payload에 `purpose: 'password-reset'` 클레임을 둬 토큰 종류 혼용 방지
- [x] `AuthService.findUsernameByPhone(phone)` — `phoneHash`로 계정 조회 후 마스킹된 아이디 반환
- [x] `AuthService.issuePasswordResetToken(phone)` — `phoneHash`로 계정 확인 후 재설정 토큰 발급
- [x] `AuthService.resetPassword(resetToken, newPassword)` — 토큰 검증(+`purpose` 확인) 후 `passwordHash` 교체
- [x] `POST /auth/find-username`, `POST /auth/request-password-reset`, `POST /auth/reset-password` 3개 엔드포인트 추가
- [x] curl로 전체 케이스 검증: 등록된 번호로 아이디 찾기(마스킹된 값 정상 반환)/미등록 번호(404), 재설정 토큰 발급→강한 새 비밀번호로 재설정(200)→새 비밀번호로 로그인 성공/이전 비밀번호로는 로그인 실패(401), 조작된 토큰으로 재설정 시도(401)
- [x] `apps/customer-app/src/api/auth.ts`에 `findUsername()`/`requestPasswordReset()`/`resetPassword()` 추가
- [x] `AcctFindScreen`/`PwdFindScreen`/`PwdResetScreen`을 "액션 콜백 + 결과 props" 패턴으로 전환(회원가입 화면들처럼 전체 필드를 다 끌어올리지 않음 — 각 화면이 "1개 액션 → 1개 결과"로 끝나는 독립된 스텝이라 더 가벼운 패턴이 적합) — 하드코딩돼 있던 `moto****23` 마스킹 아이디 표시를 실제 API 응답으로 교체
- [x] `AuthFlow.tsx`: `findIdLoading`/`foundUsername`/`pwFindLoading`/`resetToken`/`pwResetLoading` state 추가, 시트 닫을 때(`closeSheet`) `foundUsername`/`resetToken` 초기화(재오픈 시 이전 결과 잔상 방지)
- [x] Playwright로 실제 UI에서 두 플로우 모두 검증: 아이디 찾기(등록된 번호 입력 → OTP 목업 확인 → 실제 마스킹된 아이디 "u\*\*\*" 표시, 하드코딩 값 아님) / 비밀번호 찾기(번호 확인 → 재설정 화면 → 강한 새 비밀번호 제출 → 성공 토스트 → 새 비밀번호로 실제 로그인 성공까지 확인). 콘솔 에러 0건
- [x] `tsc`/`lint` 클린(웹+API 양쪽)

## Phase 11: 마이페이지 "내 정보 변경" + 프로필 사진 저장 (완료)

- [x] `User` 모델에 `profileImagePath String?` 컬럼 추가(마이그레이션 `add_profile_image_path`) — 절대 URL이 아닌 uploads 기준 상대경로("profile/<uuid>.<ext>")만 저장
- [x] **물리 파일 저장 정책**: `apps/api/src/common/storage/profile-image-storage.ts`(순수 함수) — 로컬 디스크 `apps/api/uploads/profile/`에 저장, 파일명은 원본 파일명을 쓰지 않고 `randomUUID()`로 생성(경로 조작·충돌 방지), JPEG/PNG/WEBP만 허용, 5MB 초과 거부, 사진 교체 시 이전 물리 파일 삭제(`deleteProfileImage`, ENOENT는 무시). `apps/api/uploads`는 `.gitignore`에 추가(물리 파일은 저장소에 커밋하지 않음)
- [x] 업로드 방식은 multipart 대신 base64 data URI(JSON body) — 네이티브 카메라/앨범 브릿지(`pickFromLibrary`)가 이미 base64를 반환하는 기존 후기 사진 첨부 패턴(`ReviewWriteScreen`)과 통일
- [x] `main.ts`: `NestFactory.create<NestExpressApplication>()`로 전환 + `app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads/' })`로 업로드 파일을 `/uploads/<relativePath>`로 정적 서빙
- [x] `AuthService.toSafeUser()`를 `src/auth/to-safe-user.ts`의 순수 함수로 추출(`UsersService`와 공통 사용) — `SafeUser`에 `profileImageUrl`(= `profileImagePath` ? `/uploads/${path}` : null) 추가. 기존 `/auth/login`·`/auth/signup`·`/auth/me` 응답에도 자동으로 포함됨
- [x] 신규 `UsersModule`(`src/users/`) — `PATCH /users/me`(이름·이메일 수정, `UpdateProfileDto`), `POST /users/me/profile-image`(사진 업로드/교체, `UpdateProfileImageDto`), 둘 다 `JwtAuthGuard`로 로그인 필요. 휴대폰번호는 본인인증 수단이라 수정 API 자체를 제공하지 않음
- [x] **프론트 상태 구조 변경**: 기존 `App.tsx`는 로그인 후 이름(`userName: string`) 하나만 기억하고 마이페이지의 이메일·휴대폰·사진은 전부 하드코딩 mock값(`motouser@email.com`, `010-1234-5678` 등)이었음 — `user: LoginUser | null` 전체 객체를 상태로 갖도록 변경, `AuthFlow`의 `onAuthComplete`도 이름 대신 로그인/회원가입 응답의 `user` 전체를 넘기도록 시그니처 변경
- [x] `apps/customer-app/src/api/http.ts` 신규 — 인증 불필요(`apiRequest`)/필요(`authedRequest`, `Authorization: Bearer` 자동 첨부) 공통 fetch 헬퍼로 분리, 기존 `api/auth.ts`의 중복 fetch 로직을 여기로 통합. `api/users.ts` 신규 — `updateProfile()`/`updateProfileImage()`
- [x] `MyInfoChgScreen`: 이름·이메일 입력이 실제 API로 저장, 휴대폰은 `user.phone`(읽기전용) 표시. "프로필 사진 변경" 탭 시 네이티브에서는 `pickFromLibrary()`(앨범, 카메라 촬영 선택지는 원본 디자인에 해당 인터랙션이 정의돼 있지 않아 추가하지 않음), 웹에서는 숨김 file input으로 사진 선택 → base64로 업로드
- [x] **원본 디자인과의 차이 1건(최소 변경)**: 원본 `.dc.html`은 마이페이지 메인 카드·내 정보 변경 화면 모두 이니셜 원형 아바타만 정의돼 있고 실제 사진이 보이는 상태가 없음 — 사진을 업로드해도 안 보이면 기능이 무의미하므로, `profileImageUrl`이 있으면 같은 원(크기·위치·배경 그대로) 안에 `<img>`로 대체하도록만 최소 반영(두 화면 동일 처리)
- [x] ~~비밀번호 변경(CU-MYPG-09, `PwdChgScreen`)은 이번 요청 범위 밖이라 기존 mock 그대로 유지~~ → **Phase 12에서 구현 완료**
- [x] curl로 검증: `PATCH /users/me` 이름·이메일 저장(200), `POST /users/me/profile-image` 업로드(201, 응답에 `/uploads/profile/<uuid>.png` 형태 URL) → 실제 정적 서빙 URL 200 확인 → 사진 교체 시 이전 물리 파일 삭제 확인(`ls`) → 잘못된 이미지 타입 400 → 토큰 없이 호출 시 401
- [x] Playwright로 실제 UI 검증: 회원가입 → 마이페이지 → 내 정보 변경에서 이름·이메일 수정 + 사진 업로드(웹 file input 경로) → 저장 → 네트워크 요청(`PATCH /users/me`, `POST /users/me/profile-image`)이 실제 입력값과 일치, 아바타가 이니셜 대신 `<img>`로 렌더링되는 것, "프로필 사진이 변경됐어요"/"정보가 저장됐어요" 토스트, 콘솔 에러 0건까지 확인
- [x] `tsc`/`lint`/`build` 클린(웹+API 양쪽), 테스트로 만든 계정·업로드 파일은 DB/디스크에서 정리 완료
- [x] **버그 수정(2026-07-24)**: 사진 업로드 직후 원형 아바타에 이미지 대신 alt 텍스트("프로필 사진")가 깨져 보이는 문제 발견 — `profileImageUrl`이 apps/api 기준 상대경로("/uploads/...")인데 `<img src>`에 그대로 써서 프론트 자체 origin(Vite dev 서버)으로 요청돼 404가 난 것이 원인(DB 저장·정적 서빙 자체는 정상이었음, curl로 재확인). `MypFlow.tsx`에서 `API_BASE_URL`을 붙인 절대 URL(`profileImageAbsoluteUrl`)을 만들어 `MyPageScreen`/`MyInfoChgScreen`에 내려주도록 수정, Playwright로 이미지 GET 요청이 `http://localhost:3000/uploads/profile/...`로 200 응답받는 것까지 재확인

## 이후(별도 작업으로 남김)

- [ ] Refresh token 재발급 엔드포인트(`POST /auth/refresh`) — 현재는 access token 만료(15분) 시 재로그인 필요
- [ ] Role별 Guard(`RolesGuard`)로 관리자/파트너 전용 API 보호
- [x] ~~휴대폰번호 자체의 회원가입 중복 방지~~ → **Phase 10에서 구현 완료**
- [x] `SignupVerifyScreen`에 새로 추가한 "이름" 입력란 — **사용자 승인 완료**(2026-07-23). 단, **임시 조치**로 확정: 추후 실명인증(PASS/NICE 등) 서비스 연동 시 사용자가 직접 입력하는 방식이 아니라 **CI(연계정보)값을 기반으로 서버가 실제 인증된 이름을 내려주는 방식**으로 교체 예정. 그때 가서: (1) `SignupVerifyScreen`의 "이름" 입력란을 다시 읽기전용(또는 제거)으로 전환, (2) `User` 모델에 `ci`(또는 `ciHash`) 컬럼 추가해 동일인 중복가입 방지에 활용, (3) `SignupDto`에서 `name`을 클라이언트 입력이 아니라 실명인증 응답값으로 대체하는 방향으로 재설계 필요
- [x] ~~마케팅 동의 3채널(SMS/이메일/푸시) 분리는 백엔드만 돼 있고 프론트 UI는 단일 체크박스~~ → **Phase 10에서 정정 및 구현 완료**(원래도 `MktgViewScreen`에 3채널 UI는 있었고, 배선만 빠져 있었음)
- [x] ~~운영 배포 시 `apps/customer-app/src/api/config.ts`의 prod URL 플레이스홀더를 실제 API 서버 주소로 교체, CORS도 실제 프론트 도메인으로 좁히기~~ → **Windows 서버(221.141.3.91) 배포 완료(2026-07-24)**. nginx가 같은 포트(8090)에서 정적 파일과 `/api/`를 함께 서빙하는 same-origin 구조로 가서 `config.ts`는 절대 URL 대신 `"/api"`(상대경로)로, CORS는 same-origin이라 전혀 안 걸려서 전체 허용(`app.enableCors()`) 그대로 유지. 상세 절차는 아래 "Windows 서버 배포/업데이트 절차" 참고
- [ ] `PHONE_ENCRYPTION_KEY`/`PHONE_HASH_KEY`도 운영용으로 새로 생성 — 아직 로컬 개발용 키를 그대로 운영 DB에 쓰고 있음(개발 DB=운영 DB가 같은 `221.141.3.91` MariaDB라 지금은 문제 없지만, 나중에 운영 DB를 분리하면 그때 새 키로 교체 필요)
- [ ] `apps/customer-mobile`(웹뷰 앱)에서 로컬 API 서버로 테스트하려면 `adb reverse tcp:3000 tcp:3000` 필요(웹 dev 서버와 동일한 이유)
- [ ] 아이디/비밀번호 찾기의 계정 열거(enumeration) 방지·요청 횟수 제한(rate limit)은 요청받지 않아 미구현 — 현재는 미등록 번호 입력 시 바로 404를 반환함(국내 서비스의 일반적인 UX와 동일). 필요해지면 항상 200을 반환하는 방식이나 IP/번호별 rate limit 추가 검토
- [ ] `POST /auth/reset-password`의 재설정 토큰은 만료 전까지 재사용 가능(1회성 아님, 상태를 DB에 기록하지 않는 순수 JWT 방식) — 필요해지면 사용 여부를 DB에 기록해 1회성으로 제한하는 방식 검토
- [ ] 아이디/비밀번호 찾기의 휴대폰 인증은 회원가입과 동일하게 클라이언트 목업(OTP 아무 값이나 통과) — 실명인증 서비스 연동 시 재설정 토큰 **발급 시점**(`issuePasswordResetToken`)만 실제 인증 확인 후 호출하도록 바꾸면 되고, 토큰/재설정 계약 자체는 변경 불필요

## Phase 12: 내 정보 - 비밀번호 변경 (완료)

- [x] `apps/api/src/users/dto/change-password.dto.ts` — `currentPassword`(문자열), `newPassword`(회원가입과 동일한 강도 정규식 재사용) 검증
- [x] `UsersService.changePassword(userId, dto)` — ① `bcrypt.compare`로 현재 비밀번호 확인(틀리면 401), ② **현재 비밀번호와 새 비밀번호가 같으면 400**(요청받은 조건), ③ 통과 시 해싱 후 `passwordHash` 교체
- [x] `PATCH /users/me/password`(`UsersController`) — `JwtAuthGuard` 적용, 성공 시 `{ success: true }` 반환
- [x] `apps/customer-app/src/api/users.ts`에 `changePassword()` 추가
- [x] `PwdChgScreen`에 "새 비밀번호 == 현재 비밀번호" 프론트 즉시 검증 추가(기존 "비밀번호 불일치" 인라인 에러와 동일한 패턴) — 서버 쪽 최종 검증과 별개로 사용자에게 바로 피드백, 저장 버튼도 이 상태에선 비활성화. `loading` 상태(`saving` prop) 추가해 처리 중 버튼 비활성화 + "변경 중..." 표시
- [x] `MypFlow.tsx`: `pwedit` 화면의 mock 저장 로직을 실제 `changePassword()` API 호출로 교체, 실패 시 서버 에러 메시지 토스트
- [x] curl로 5가지 케이스 검증: 틀린 현재 비밀번호(401) / 현재==새 비밀번호(400, "새 비밀번호는 현재 비밀번호와 달라야 합니다.") / 정상 변경(200) → 새 비밀번호로 로그인 성공 / 예전 비밀번호로 로그인 실패(401)
- [x] Playwright로 실제 UI 검증: 현재 비밀번호와 동일한 값을 새 비밀번호에 입력하면 인라인 에러 노출 + "변경하기" 버튼 비활성화(서버 요청 자체가 안 나감) 확인, 이후 실제로 다른 새 비밀번호 입력 → 저장 → 실제 `PATCH /users/me/password` 요청 페이로드 확인 → "비밀번호가 변경됐어요" 토스트까지 확인. 콘솔 에러 0건
- [x] `tsc`/`lint`/`build` 클린(웹+API 양쪽), 테스트 계정 DB에서 정리 완료

## Phase 13: 로그인 화면 자동로그인 (완료)

- [x] **기존 상태 파악**: `LoginScreen`엔 "자동로그인" 체크박스가 이미 있었지만 로컬 `useState`에만 갇혀 있어 아무 동작도 안 했고, 애초에 앱이 시작할 때 저장된 토큰으로 세션을 복원하는 로직 자체가 전혀 없었음(새로고침하면 토큰이 남아있어도 무조건 로그인 화면부터 다시 보임)
- [x] **저장소 전략**: `apps/customer-app/src/api/tokenStorage.ts` — 자동로그인 체크 시 `localStorage`(브라우저/앱 재시작 후에도 유지), 체크 안 하면 `sessionStorage`(탭·앱 종료 시 삭제)에 저장하도록 `setTokens(accessToken, refreshToken, persist)`로 변경. `getAccessToken()`은 두 저장소를 모두 확인(localStorage 우선), `clearTokens()`는 둘 다 정리
- [x] `apps/api`에 이미 있던 `GET /auth/me`를 그대로 재사용 — 프론트에 `getMe()`(`api/auth.ts`) 추가, 저장된 토큰으로 사용자 정보를 다시 조회해 세션 복원
- [x] `App.tsx`: `booting` state 추가 — 마운트 시 저장된 토큰이 있으면 `getMe()`로 검증 후 성공 시 `user` 상태로 바로 복원(로그인 화면 건너뜀), 실패(토큰 만료 등)하면 토큰 정리 후 평소처럼 로그인 화면 노출. 토큰이 아예 없으면 이 과정 자체를 건너뛰어 첫 방문 사용자는 지연 없음. 확인하는 짧은 순간은 브랜드 배경 + 스피너로 표시(기존 스플래시 화면과 별개로 최소한만 추가)
- [x] `LoginScreen`의 "로그인" 버튼이 `autoLogin` 체크 여부를 `onLogin(id, pw, autoLogin)`으로 함께 전달하도록 수정, `AuthFlow.tsx`가 이 값을 `setTokens(...)`에 그대로 전달
- [x] 회원가입 완료 시엔 체크박스가 없는 화면이라 기본적으로 `persist: true`(로그인 상태 유지)로 처리
- [x] Playwright로 실제 브라우저 탭 분리 검증(회원가입 → 로그아웃 → 자동로그인 미체크 로그인 → sessionStorage 저장 확인 → **새 탭**을 열면 세션 복원 안 되고 로그인 화면 노출 / 로그아웃 후 자동로그인 체크 로그인 → localStorage 저장 확인 → 새 탭을 열면 로그인 화면 없이 바로 홈 진입) — 4가지 저장 위치·복원 여부 전부 기대대로 동작, 콘솔 에러 0건
- [x] `tsc`/`lint`/`build` 클린(웹), 테스트 계정 DB에서 정리 완료
- [ ] **알려진 제약**: 지금은 access token 만료(15분)가 지나면 `자동로그인` 체크와 무관하게 세션 복원이 실패함(`GET /auth/me`가 401) — refresh token으로 access token을 재발급하는 `POST /auth/refresh`가 아직 없어서(Phase 3 이후 "별도 작업"으로 남겨둔 항목과 동일) 그렇게 됨. 필요해지면 그 엔드포인트를 만들고, `App.tsx`의 세션 복원 로직에 "401이면 refresh token으로 재시도" 단계를 추가하면 됨

## Phase 14: 공통코드 마스터-디테일 테이블 + 데이터 (완료)

- [x] `CommonCode`(마스터: `code` pk, `name`, `useYn`) / `CommonCodeDetail`(상세: `(code, detailCode)` 복합 pk, `detailName`, `ref1`, `ref2`, `useYn`, `code` → `CommonCode.code` FK) 모델 추가, 마이그레이션(`add_common_codes`) 적용
- [x] **원본 자료 보정 2건**(사용자에게 사전 안내 후 반영): ① VLT 상세코드가 원본에 비어있어 상세코드명과 동일값("5"/"15"/"30")으로 채움, ② CAR_MODEL의 CLK-Class 행 상세코드가 CLA-Class와 동일한 "B-CLA"로 중복 기재돼 있어(오타로 판단) "B-CLK"으로 보정(그대로 두면 복합 PK 충돌)
- [x] `prisma/seed-common-codes.ts` 신규(기존 `seed.ts`의 테스트 계정 시드와 분리) — 공통코드 마스터 5건(DEALER/CAR_BRAND/CAR_MODEL/VLT/CAR_INST), 상세 38건을 upsert로 등록(재실행해도 안전)
- [x] 시드 실행 후 DB 직접 조회로 마스터 5건, 그룹별 상세 건수(CAR_BRAND 8/CAR_INST 4/CAR_MODEL 20/DEALER 3/VLT 3 = 38), CAR_MODEL의 `ref1`(소속 브랜드코드) 매핑까지 원본과 일치하는 것 확인
- [x] `tsc`/`lint`/`build` 클린
- [ ] 이번엔 테이블·데이터만 요청받아 API 엔드포인트(조회/관리)는 아직 미구현 — 필요해지면 `CommonCodeModule`로 `GET /common-codes/:code`(상세 목록 조회) 등을 추가하면 됨

## Phase 15: 상품정보 테이블(마스터-디테일 공통코드 확장) (완료)

- [x] 공통코드에 3개 그룹 추가(`seed-common-codes.ts`에 이어서 등록) — **PROD_TYPE(상품유형)**: GOODS(실물상품)/SVC(시공서비스)/PKG(패키지상품) 3종은 이미지에 값이 없어 제안값으로 채움(모토페이가 쇼핑몰 실물상품과 예약시공 서비스를 함께 취급하는 걸 반영) / **PROD_BRAND(상품브랜드)**: `shopData.ts` 목업에 이미 쓰인 브랜드명(ZIC/아이나비/루마/게코/미쉐린/모토케어/크리스탈/김성네비)을 코드값 그대로 사용(CAR_BRAND처럼 별도 영문 코드를 만들지 않음 — 프론트가 이미 이 문자열 자체를 쓰고 있어서 그대로 맞춤) / **PROD_CAT(상품분류)**: `CATEGORY_META`와 동일한 코드값(engineoil/blackbox/tint/coating/tire/etc)
- [x] `Product` 모델 추가(마이그레이션 `add_products`) — `id`(내부 autoincrement, 외부 비노출) / `productCode`(`CHAR(10)` unique, `id`를 10자리 0-padding해 자동 채번) / `prodType`·`brand`·`prodCat`(각각 위 공통코드 상세값 참조 — CAR_MODEL.ref1과 동일하게 DB FK는 안 걸고 문자열로만 저장) / `name`/`price`/`originPrice`/`description`/`imagePath`(프로필 사진과 동일한 uploads/ 상대경로 정책)/`useYn`
- [x] **채번 방식**: DB `GENERATED ALWAYS AS (LPAD(id,10,'0')) STORED` 컴퓨티드 컬럼 방식도 검토했으나, Prisma 마이그레이션이 스키마 드리프트로 오인해 매번 손으로 SQL을 고쳐야 하는 위험이 있어 채택 안 함 → **앱 레벨 2단계 방식**(트랜잭션으로 묶어 원자성 보장): `product.create()`로 autoincrement id를 얻은 뒤 즉시 같은 트랜잭션에서 `productCode = id.toString().padStart(10,'0')`로 업데이트
- [x] `prisma/seed-products.ts` 신규 — `apps/customer-app`의 쇼핑몰 목업(`shopData.ts`) 상품 8건을 실제로 등록해 자동채번 검증. 3번째 상품(루마 썬팅필름)의 `productCode`가 `"0000000003"`으로 채번되어 첨부 이미지와 정확히 일치하는 것 확인
- [x] `tsc`/`lint`/`build` 클린
- [ ] **제안(미구현, 필요 시 진행)**: (1) `productCode` 앞자리를 상품유형별 접두사로 구분(예: G/S/P + 9자리)하는 방안 — 대신 유형 간 채번이 섞이지 않는 대신 순수 숫자 정렬이 깨짐, (2) `opts`(옵션: "1개"/"2개 묶음" 등)와 `specs`(스펙 목록)는 목업에 이미 있는데 이번 테이블엔 반영 안 함 — 옵션은 가격·재고가 옵션별로 달라질 수 있어 별도 `ProductOption` 자식 테이블, 스펙은 단순 표시용이라 JSON 컬럼이나 `ProductSpec` 자식 테이블로 확장 검토, (3) `rating`/`reviews`는 상품 마스터에 직접 두지 않고 별도 리뷰 테이블에서 집계하는 편이 정합성 面에서 안전, (4) 실물상품이면 조만간 재고(`stock`) 관리가 필요해질 가능성 높음, (5) 지금은 테이블·시드만 구성 — 조회/등록 API(`ProductsModule`)는 아직 없음

## Phase 16: 공급업체 상품(썬팅/블랙박스 시공서비스) 데이터 추가 (완료)

- [x] `Product`에 `supplyPrice Int?`(공급가, 공급업체 매입원가) 컬럼 추가(마이그레이션 `add_product_supply_price`) — 사용자가 제공한 상품표에 소비자가 외에 공급가가 있었는데 기존 스키마엔 없던 개념이라 새로 추가. 고객에게 노출하지 않는 내부 정산용 값
- [x] `PROD_BRAND` 공통코드에 신규 브랜드 3건 추가: 글라스틴트, 후퍼옵틱, 파인뷰
- [x] `prisma/seed-products.ts`를 두 출처(기존 쇼핑몰 목업 `SHOP_MOCK_PRODUCTS` / 사용자 제공 공급업체 표 `SUPPLIER_TINT_BLACKBOX_PRODUCTS`)로 정리하고 공통 `seedProduct()` 함수로 통합 — 상품유형 SVC(시공서비스) 9건(글라스틴트 펜더·로드, 후퍼옵틱 클래식, 루마 버텍스 700/900/1100, 아이나비 QXD9900mini·QXD2, 파인뷰 X1000) 등록, `tint`/`blackbox` 카테고리는 기존 PROD_CAT 재사용
- [x] DB 조회로 9건 모두 상품명·브랜드·분류·소비자가·공급가가 원본 표와 정확히 일치, `productCode`가 기존 8건에 이어 `0000000009`~`0000000017`로 순차 채번된 것 확인
- [x] `tsc`/`lint`/`build` 클린

## Phase 17: 코드성 컬럼 표준화(대문자 영문/숫자) + PK 설계 논의 (완료)

- [x] **사용자 요청 규칙 확정**: 코드성 컬럼은 모두 대문자 영문(가급적 약어) 또는 숫자로만 구성 — 점검 결과 `DEALER`/`CAR_BRAND`/`CAR_MODEL`/`VLT`/`CAR_INST`/`PROD_TYPE`은 이미 규칙 준수, `PROD_BRAND`(한글 브랜드명 그대로 사용)와 `PROD_CAT`(소문자 영문)만 위반이라 이 두 그룹만 교정
- [x] `PROD_BRAND`: ZIC/INAVI(아이나비)/LLUMAR(루마)/GYEON(게코)/MICH(미쉐린)/MCARE(모토케어)/XTAL(크리스탈)/KSNAVI(김성네비)/GTINT(글라스틴트)/HUPER(후퍼옵틱)/FINEVU(파인뷰) — 원래 한글명은 `detailName`에 보존
- [x] `PROD_CAT`: ENGOIL/BBOX/TINT/COAT/TIRE/ETC — 기존 소문자 영문 코드를 대문자 약어로 교체(BBOX는 CAR_INST의 기존 약어와 통일)
- [x] `detailCode` 값 자체가 바뀌는 변경이라 upsert만으론 옛 행이 orphan으로 남는 문제가 있어, DB에서 `PROD_BRAND`/`PROD_CAT` 상세 행을 먼저 삭제한 뒤 재시드. `seed-products.ts`의 17개 상품 `brand`/`prodCat` 값도 함께 갱신해 재실행 — `productCode`는 상품명이 그대로라 upsert 매칭되어 기존 채번(`0000000001`~`0000000017`) 그대로 유지되고 코드값만 정상 교체된 것 확인
- [x] `tsc`/`lint`/`build` 클린
- [x] **결정: 현행 유지**(2026-07-24) — `Product.id`(내부 autoincrement PK) + `productCode`(외부 노출용 자연키, unique) 투트랙 구조 그대로 감. `id`를 없애고 `productCode`를 직접 PK로 쓰는 대안(별도 시퀀스 카운터 테이블 필요, 자식 테이블 FK가 CHAR(10)이 되는 트레이드오프)도 제시했으나 사용자가 현행 유지를 선택

## Phase 18: 딜러사별 패키지 상품(PKG) + 구성상품 매핑 (완료)

- [x] **구성방안 사전 승인**: 패키지는 딜러사 1곳에 귀속(공유 안 됨, 사용자 확인) — `Product.dealerCode`(nullable, PKG만 사용, `DEALER` 공통코드 참조) + 인덱스 추가
- [x] **스키마 추가 조정**: 패키지는 구성상품마다 브랜드·분류가 다를 수 있어(예: 후퍼옵틱 GK 패키지 = 틴팅+블랙박스 혼합) `Product.brand`/`prodCat`을 nullable로 변경 — PKG 상품은 두 값 모두 null, 실제 브랜드·분류 정보는 구성상품 쪽에서 조회하는 방식으로 정리
- [x] `ProductBundleItem` 신규 테이블(마이그레이션 `add_product_packages`) — `packageCode`/`componentCode`(둘 다 `Product.productCode` 자기참조) 복합 PK, `qty`, `sortOrder`
- [x] KCC오토 패키지 2건 등록(`seed-products.ts`의 `KCC_PACKAGES`/`BUNDLE_COMPONENTS`) — **가격은 사용자가 안 줘서 패키지 할인 없이 구성상품 소비자가/공급가 합산으로 채움(가정, 추후 조정 가능)**
  - `0000000018` 글라스틴트 틴팅 패키지 — 구성: 0000000009(글라스틴트 펜더), 판매가 300,000/공급가 180,000
  - `0000000019` 후퍼옵틱 GK 패키지 — 구성: 0000000011(후퍼옵틱 클래식)+0000000017(파인뷰 X1000), 판매가 1,359,000/공급가 810,000
- [x] DB 조회로 두 패키지의 `dealerCode='KCC'`, `brand`/`prodCat` null, `ProductBundleItem` 매핑(패키지→구성상품)이 정확한 것 확인
- [x] `tsc`/`lint`/`build` 클린
- [ ] 패키지 가격이 실제로는 할인가일 가능성 높음 — 정확한 패키지 판매가/공급가를 받으면 업데이트 필요

## Phase 19: 신차 구매 고객 정보 테이블 (완료)

- [x] **구성방안 사전 승인** 후 진행 — `NewCarPurchaseCustomer` 모델 추가(마이그레이션 `add_new_car_purchase_customer`)
- [x] `vin`(17자리)을 별도 채번 없이 그대로 PK로 사용(딜러가 제공하는 자연키), `dealerCode`/`carBrandCode`/`carModelCode`는 기존 관례대로 공통코드 상세(복합키) 참조라 DB FK 없이 문자열만 저장
- [x] 휴대폰번호는 회원가입 전 개인정보라 `User`와 동일하게 `phoneEncrypted`(AES-256-GCM)+`phoneHash`(HMAC, 매핑 조회용) 정책 적용 — 기존 `phone-crypto.ts` 순수 함수 재사용
- [x] `packageCode -> Product.productCode`, `memberId -> User.id`는 단일 unique 컬럼 참조라 실제 Prisma relation(FK)으로 연결(`ON DELETE SET NULL`) — `User`/`Product`에 역방향 relation 필드(`carPurchases`/`purchases`) 추가
- [x] `등록자id`/`수정자id`는 딜러사 직원 계정(파트너 로그인)이 아직 없어 FK 없이 문자열로만 보관, 추후 파트너 인증 도입 시 `User.id` FK로 전환 가능하게 열어둠
- [x] `prisma/seed-new-car-purchase.ts` 신규 — 첨부된 예시 1건(길춘묵/KCC/BENZ B-E/E 200/VIN.../패키지 0000000018) 등록, 매핑 관련 필드(매핑여부/매핑일시/회원id/등록자id/수정자id)는 이미지와 동일하게 전부 미입력 상태로 시드
- [x] DB 조회로 휴대폰번호 복호화 일치, `package` relation이 실제로 조인되어 패키지명("글라스틴트 틴팅 패키지")까지 정상 조회되는 것 확인
- [x] `tsc`/`lint`/`build` 클린
- [ ] **범위 밖(다음 작업)**: 회원가입 시 이름+휴대폰번호로 이 테이블을 자동 조회해 매핑 처리하는 실제 로직(API/훅)은 아직 미구현 — `AuthService.signup()` 성공 후 `phoneHash`+`customerName`으로 `isMapped=false`인 행을 찾아 `isMapped=true`/`mappedAt`/`memberId`를 채우는 흐름으로 구현하면 됨

## Phase 20: 신차 구매 자동 매핑 + 내 차량 정보(MyCar) (완료)

- [x] **구성방안 사전 승인**(연식 출처는 (B) 선택: `NewCarPurchaseCustomer`에도 `modelYear` 추가) 후 진행
- [x] `CAR_REG_TYPE` 공통코드 추가 — MAP(신차매핑)/MANUAL(수기등록)
- [x] `NewCarPurchaseCustomer.modelYear` 컬럼 추가(nullable — 기존 시드 1건엔 값 없어 null 유지)
- [x] `MyCar` 신규 테이블(마이그레이션 `add_my_car_and_modelyear`) — `memberId`(FK→User), `regType`, `purchaseVin`(FK→NewCarPurchaseCustomer.vin, nullable), `carBrandCode`/`carModelCode`/`trimName`/`modelYear`/`plateNumber`/`vin`/`isDefault`. 기존 프론트 마이카 목업(`mypTypes.ts`의 `Car`)과 필드 구성을 맞춤
- [x] **자동 매핑 로직 구현**: 신규 `CarsModule`/`CarsService.mapNewCarPurchase(userId, name, phoneHash)` — `AuthModule`에 통합, `AuthService.signup()` 성공 직후(토큰 발급 전) 호출. `phoneHash`+`customerName`+`isMapped=false` 조건으로 `NewCarPurchaseCustomer` 조회 → 매칭 시 트랜잭션으로 ① 그 행을 `isMapped=true`/`mappedAt`/`memberId` 갱신, ② `MyCar`에 `regType='MAP'`으로 새 행 생성(브랜드·차종·트림·연식·VIN을 구매정보에서 복사, 가입 직후 첫 차량이라 `isDefault=true`). 매칭 없으면 아무 일도 안 함
- [x] **실제 계정과 우연히 일치 발견**: 첨부 예시 데이터(길춘묵/010-4182-9325)가 개발자 실제 계정(`cmkil5150`)의 이름·번호와 정확히 일치해서 그 번호로는 신규 가입 자체가 막힘(이미 가입된 번호) — 실제 계정은 건드리지 않고 별도 테스트용 신차구매 데이터(테스트매핑고객/010-9911-2233)로 검증
- [x] curl로 실제 회원가입 실행 후 확인: ① `NewCarPurchaseCustomer`가 `isMapped=true`로 정상 갱신되고 `memberId`가 새 회원으로 채워짐, ② `MyCar`에 `regType='MAP'`, 구매정보와 동일한 브랜드/차종/트림/연식/VIN, `isDefault=true`인 행이 정확히 생성됨, ③ 매칭되지 않는 일반 가입자는 `MyCar` 0건으로 영향 없음 확인
- [x] `tsc`/`lint`/`build` 클린, 테스트 데이터(신차구매 1건, User 2건) 정리 완료
- [ ] 범위 밖: `MyCar` 조회/수기등록/대표차량 변경 API(`GET /cars/me` 등)는 아직 미구현 — 프론트 마이카 화면을 실 데이터로 연동하려면 이어서 필요

## Phase 21: 실계정 수동 매핑 + 내 차량 조회/수기등록 API (완료)

- [x] **실계정 수동 매핑**: `cmkil5150`(길춘묵) 계정에 이전에 매핑 안 됐던 신차구매 건(VIN `W1KLF5AB4TA288926`)을 `CarsService.mapNewCarPurchase()`와 동일한 로직으로 수동 적용 — `NewCarPurchaseCustomer.isMapped=true`/`memberId` 반영, `MyCar`에 `regType='MAP'` 행 생성(대표차량 여부는 기존 보유 차량 수를 확인해 조건부로 설정, 무조건 true로 덮어쓰지 않음)
- [x] `CarsService`에 `listMyCars()`/`createManualCar()` 추가 — 목록은 대표차량이 먼저 오도록 정렬, 수기등록은 `regType='MANUAL'`로 저장하고 **기존 보유 차량이 0대일 때만 자동으로 대표차량 지정**(두 번째 차량부터는 별도 대표차량 지정 액션 필요 — 아직 미구현)
- [x] `CreateMyCarDto` — `carBrandCode`/`carModelCode` 필수, `trimName`/`modelYear`/`plateNumber`/`vin`은 선택
- [x] `CarsController`(`GET /cars/me`, `POST /cars/me`, 둘 다 `JwtAuthGuard`) 신규 — `CarsModule`을 `AppModule`에도 직접 등록(기존엔 `AuthModule` 안에서만 참조돼 있었음, 컨트롤러 라우트가 명확히 최상위 모듈 그래프에 드러나도록 정리)
- [x] curl로 검증: 신규 가입 직후 목록 빈 배열 → 수기등록 1(대표차량 자동 지정) → 수기등록 2(대표차량 아님) → 목록 재조회 시 대표차량이 먼저 정렬돼 나오는 것 확인 → 토큰 없이 조회 시 401
- [x] `tsc`/`lint`/`build` 클린, 테스트 계정 정리 완료

## Phase 22: 내 차량 수정/삭제/대표차량 지정 API (완료)

- [x] `PATCH /cars/me/:id` — **수기등록(MANUAL)은 전체 필드 수정 가능, 신차매핑(MAP)은 차량번호(plateNumber)만 예외적으로 수정 가능**(출고 시점엔 번호판이 없을 수 있다는 사용자 피드백 반영). MAP 차량에 차량번호 외 다른 필드까지 같이 보내면 403
- [x] `DELETE /cars/me/:id` — 수기등록(MANUAL)만 삭제 가능, 신차매핑(MAP)은 403. 삭제한 차량이 대표차량이었으면 남은 차량 중 가장 먼저 등록된 차량을 자동으로 새 대표차량 지정
- [x] `POST /cars/me/:id/default` — 대표차량 지정은 MAP/MANUAL 구분 없이 가능(트랜잭션으로 기존 대표차량 해제 후 지정)
- [x] 소유권 검증: 존재하지 않는 차량 id와 남의 차량을 구분해서 응답하면 다른 회원의 차량 id 존재 여부가 노출되므로 둘 다 동일하게 404 처리(`findOwnedCarOrThrow` 헬퍼로 통일)
- [x] curl로 검증: MAP 차량 차량번호만 수정(200) / MAP 차량에 브랜드까지 같이 수정 시도(403) / MAP 차량 삭제 시도(403) / MANUAL 차량 수정·대표차량 변경·삭제 전부 정상 동작, 목록 정렬(대표차량 우선)도 확인
- [x] `tsc`/`lint`/`build` 클린, 테스트 계정·신차구매 데이터 정리 완료

## Phase 23: 프론트 내 차량 목록 실 API 연동 (완료)

- [x] `apps/customer-app/src/api/cars.ts` 신규 — `listMyCars`/`createMyCar`/`updateMyCar`/`deleteMyCar`/`setDefaultCar`
- [x] **데이터 모델 불일치 확인 및 결정**: 기존 화면(`CarRegScreen`)은 브랜드/모델을 자유 텍스트(예: "Benz"/"E-Class")로 다루는데 백엔드는 공통코드값("BENZ"/"B-E") 기반 — 수기등록(MANUAL)은 스키마가 애초에 이 필드에 FK를 안 걸어둔 게 자유 입력을 의도한 것이라 판단해, 입력한 문자열을 코드 자리에 그대로 저장하는 방식으로 연동(별도 브랜드/차종 선택 UI는 만들지 않음)
- [x] `MypFlow.tsx`: `INITIAL_CARS` mock 제거, 마운트 시 `GET /cars/me`로 실제 목록 조회. `saveCar`/`deleteCar`/대표차량 지정을 전부 실 API 호출로 교체 — **신차매핑(MAP) 차량 수정 시 차량번호만 전송**, 나머지는 수기등록만 전체 필드 전송
- [x] `mypData.ts`의 `INITIAL_CARS`(및 그로 인해 unused가 된 `Car` import) 제거
- [x] `CarRegScreen.tsx`: `isDealerCar`일 때 제조사/모델명/연식 비활성화 + "차량 삭제하기" 링크 숨김(백엔드 403 규칙과 UI를 일치시킴), 저장 버튼에 `saving` 상태 추가
- [x] **Playwright 검증 중 실제 버그 발견 및 수정**: `MAKER_OPTIONS`(한글 표기 "Benz" 등)에 실제 코드값("BENZ")과 일치하는 옵션이 없어서, 신차매핑 차량의 제조사 `<select>`가 값 없는 옵션으로 취급돼 **엉뚱하게 "현대"로 잘못 표시되는 버그**를 발견 → `isDealerCar`일 때는 `<select>` 대신 비활성 `<input>`으로 원본 코드값을 그대로 노출하도록 수정, 재검증으로 정상 표시 확인
- [x] Playwright로 전체 플로우 검증: 신차매핑 차량 배지·읽기전용 필드·차량번호만 수정 가능·삭제 링크 없음 확인 → 차량번호 저장 성공 → 수기등록 차량 추가 → 대표차량 지정 → 목록 정렬 갱신까지 확인. 콘솔 에러 0건
- [x] `tsc`/`lint`/`build` 클린(웹)
- [x] **사고 및 복구**: 테스트 정리 중 `myCar.deleteMany({})`를 필터 없이 실행해 실계정(`cmkil5150`)의 매핑된 차량까지 함께 삭제됨 — 신차구매정보(`NewCarPurchaseCustomer`)의 매핑 상태(`isMapped`/`memberId`)는 건드리지 않아 그 값 그대로 동일한 데이터로 즉시 복구, 이후 정리는 특정 id/username을 정확히 지목하는 방식으로만 진행. 복구 후 최종 확인 완료

## Phase 24: 차량 등록/목록 공통코드 표시(드롭다운 + 실제 명칭) 완성 (완료)

- [x] **백엔드**: `GET /common-codes/:code` 신규(`CommonCodesModule`, 로그인 불필요, 브랜드/차종/딜러사명 등 참조용 공개 데이터)
- [x] `MyCar.dealerCode` 컬럼 추가(마이그레이션 `add_my_car_dealer_code`) — 신차매핑 시 `NewCarPurchaseCustomer.dealerCode`를 그대로 복사해 저장(기존엔 `purchaseVin`으로만 간접 연결돼 있어 딜러사명을 바로 조회할 방법이 없었음). `CarsService.mapNewCarPurchase()`도 함께 갱신
- [x] 기존 `cmkil5150` 계정의 매핑된 차량(id=10)에 `dealerCode='KCC'` 백필
- [x] **프론트**: `api/commonCodes.ts` 신규(`getCommonCodeDetails`), `MypFlow.tsx`가 마운트 시 `CAR_BRAND`/`CAR_MODEL`/`DEALER` 목록을 함께 조회해 코드→이름 매핑을 만들고, 차량 목록·상세 화면 전부 이 매핑으로 실제 명칭을 표시하도록 변경
- [x] `CarRegScreen`: 제조사·모델명을 자유 입력/고정 목업 목록(`MAKER_OPTIONS`) 대신 **공통코드 기반 드롭다운**으로 교체, 제조사 변경 시 그 브랜드의 차종으로 자동 전환(다른 브랜드 차종이 남아있지 않도록). **상세모델(trimName) 입력란 신규 추가**(모델명 아래, 신차매핑 차량은 차량번호와 마찬가지로 수정 불가)
- [x] 신규 차량 등록 시 기본값은 "차종이 1개 이상 있는 첫 브랜드"로 지정(차종이 없는 브랜드를 기본값으로 잡아 모델 드롭다운이 비어버리는 상황 방지)
- [x] 딜러사 구매 정보의 "구매처"도 하드코딩 문자열("딜러사 매핑") 대신 `dealerCode`를 `DEALER` 공통코드로 조회한 실제 이름("KCC 오토")으로 표시
- [x] Playwright로 검증: 목록에 "벤츠 E-Class"(코드 아님, 실제 명칭) 노출, 상세 화면에 "KCC 오토"·상세모델 "E 300" 정상 노출, 제조사를 "기아"로 바꾸면 모델 드롭다운이 K5/스포티지/쏘렌토로 즉시 전환되는 캐스케이딩 동작, 수기등록 저장까지 콘솔 에러 0건으로 확인
- [x] `tsc`/`lint`/`build` 클린(웹+API 양쪽), 테스트 계정/신차구매 데이터는 특정 id만 지목해 정리(Phase 23의 사고 재발 방지), `cmkil5150` 실계정 데이터 최종 확인 완료

## Phase 25: 포트 재구성 — customer-app 8090 / partner-app 8091 / api 8092 직접노출 (2026-07-26)

- [x] **사용자 요청**: 테스트서버(221.141.3.91)에서 customer-app=8090(기존 유지)/partner-app=8091(신규)/api=8092로 구성. api를 지금처럼 nginx same-origin 프록시(`/api/`) 뒤에 두지 않고 **별도 origin으로 직접 노출**하는 쪽으로 확정(AskUserQuestion으로 확인).
- [x] `apps/api/src/main.ts` — `app.listen(PORT, '127.0.0.1')`(로컬 전용 바인딩) → `app.listen(PORT, '0.0.0.0')`로 변경(외부에서 8092로 직접 접근 가능해야 하므로), `app.enableCors()`(전체 허용)를 `CORS_ORIGINS`(쉼표구분 env, 쉼표구분 파싱 시 빈 문자열은 "미지정"으로 취급해 allow-all로 폴백)가 있으면 그 origin 목록으로 제한하도록 변경
- [x] `apps/api/.env.example`에 `CORS_ORIGINS` 추가 + `PORT` 옆에 테스트서버는 8092라는 주석 추가
- [x] `apps/customer-app/src/api/config.ts`의 prod `API_BASE_URL`: `"/api"`(상대경로, same-origin 프록시 시절 값) → `"http://221.141.3.91:8092"`(절대 URL, 직접 노출)
- [x] `apps/customer-app/src/config.ts`의 prod `PARTNER_APP_URL`: 플레이스홀더(`https://partner.motopay.example.com`) → 실제 값 `"http://221.141.3.91:8091"`
- [x] `apps/partner-app/src/config.ts`의 prod `CUSTOMER_APP_URL`은 이미 `"http://221.141.3.91:8090"`으로 맞게 들어가 있어 변경 불필요
- [x] `tsc -b`/`build` 3개 프로젝트(api/customer-app/partner-app) 모두 클린
- [x] nginx에 8091 site 신규 추가 + `apps/partner-app` 최초 배포 완료 — 외부에서 `http://221.141.3.91:8091` 정상 접속 확인(2026-07-26)
- [x] **최종 검증 완료(2026-07-26, 이 세션에서 외부 네트워크로 221.141.3.91에 직접 curl 접근 가능해 실측)**:
  - `GET :8090`/`:8091` 각각 customer-app/partner-app HTML을 정상 반환(제목 태그로 서로 안 뒤바뀐 것 확인)
  - `GET :8092/` → `Hello World!`, `POST :8092/auth/login`(틀린 계정) → 401 + 정상 한글 에러 메시지(DB 연결 확인)
  - CORS preflight(OPTIONS)·실제요청(POST) 양쪽 모두 Origin이 `:8090`/`:8091`일 때만 `Access-Control-Allow-Origin` 반환, 미등록 origin(`evil.example.com`)은 헤더 없음 → `CORS_ORIGINS` 서버 `.env` 반영 및 동작 확인 완료
  - 배포된 `:8090` JS 번들에 `221.141.3.91:8091`/`:8092`, `:8091` 번들에 `221.141.3.91:8090`이 정확히 포함된 것을 번들 파일에서 직접 grep해 확인 → 교차 링크·API 호출 모두 올바른 실제 URL로 빌드된 최신 코드가 배포됨
- [ ] 8090 site의 옛 `/api/` 프록시 location 제거는 선택사항(있어도 무해, 이제 아무 트래픽도 안 탐) — 필요시에만 정리
- [x] **배포 중 발견된 버그 수정**: 위 절차를 실제로 진행하며 서버에서 `npx prisma migrate deploy` 실행 시 2건 연속 발생
  1. `Error: The datasource.url property is required in your Prisma config file` — `prisma.config.ts`(프로젝트 루트, `prisma\` 폴더 안이 아님)를 복사 안 해서 발생. "Prisma 스키마가 바뀐 경우" 절차에 이 파일 복사 단계를 명시적으로 추가함
  2. `Cannot find module 'dotenv/config'` — `prisma.config.ts`가 `import "dotenv/config"`로 의존하는데, `dotenv`가 `package.json`에 전혀 선언돼 있지 않고 `@nestjs/config`(dependency)/`prisma`(devDependency) 양쪽의 전이 의존성으로만 존재했음. 로컬에선 npm이 우연히 최상위로 호이스팅해줘서 문제가 안 보였지만, 서버의 `npm ci --omit=dev`(devDependency 서브트리 제외) 설치 결과에서는 최상위에 안 잡혔던 것으로 추정 — **`apps/api/package.json`의 `dependencies`에 `"dotenv": "^17.4.1"` 명시적으로 추가**해 `--omit=dev` 여부와 무관하게 항상 최상위 설치되도록 고침(`npm install` 재실행으로 `package-lock.json` 갱신, `npm run build` 클린 확인)
  - **후속 조치 필요**: `package.json`/`package-lock.json`이 바뀐 변경이므로 서버에 다시 배포할 때 "백엔드 의존성이 바뀐 경우" 절차(두 파일 복사 + `npm ci --omit=dev` 재실행)를 따라야 함
- [x] **배포 후 헬스체크 중 추가로 발견된 버그**: `netstat`으로 확인하니 8092가 `0.0.0.0`이 아니라 `127.0.0.1`로만 리슨 중이었음 — `PORT=8092`는 반영됐는데 바인딩 주소가 옛 코드(`127.0.0.1`) 그대로였다는 신호. 로컬에서 재빌드해보니 **`dist/main.js`가 아예 안 생기고 `dist/src/main.js`에 잘못 생성되는(=`start:prod`의 `node dist/main`이 실행 불가능한) 또 다른 rootDir 버그**를 발견함
  - **원인**: 프로젝트 루트의 `check_prods_tmp.ts`(과거 상품 데이터 확인용 1회성 디버그 스크립트, 삭제 안 하고 남아있었음)가 `tsconfig.build.json`의 `exclude`에 없어서, TypeScript가 `src/`가 아니라 프로젝트 루트를 rootDir로 다시 추론해버림 — Phase(2026-07-23) "tsconfig.json 문제 2건 수정"에서 `prisma/`·`prisma.config.ts` 때문에 똑같은 버그를 이미 한 번 고쳤었는데, 이번엔 다른 stray 파일이 같은 버그를 재발시킨 것
  - **수정**: `tsconfig.build.json`의 `exclude`에 `"check_prods_tmp.ts"` 추가(파일 자체는 삭제하지 않음 — 필요하면 사용자가 직접 정리). `rm -rf dist && npm run build` 클린 리빌드로 `dist/main.js`가 다시 최상위에 생기고 `0.0.0.0` 바인딩도 포함된 것 확인
  - **교훈**: 프로젝트 루트에 임시 `.ts` 스크립트를 만들면(1회성이라도) `tsconfig.build.json`에 exclude 등록 없이는 반드시 이 rootDir 버그가 재발함 — 앞으로 1회성 스크립트는 다 쓰고 바로 삭제하거나, 남겨야 한다면 exclude에 등록할 것
  - [x] **서버 반영 완료**: `dist\` 교체 + `nssm stop/start` 후 `netstat`으로 `0.0.0.0:8092` 리슨 확인, `http://221.141.3.91:8092`가 외부(맥)에서 정상 응답하는 것까지 확인 완료(2026-07-26)

## Windows 서버 배포/업데이트 절차 (참고용, 221.141.3.91)

**구조(2026-07-26 갱신)**: nginx가 두 정적 사이트를 서빙 — 8090(`D:\Project\moto_dev`, customer-app)과 8091(신규, `D:\Project\moto_partner`, partner-app). api는 더 이상 nginx `/api/` 프록시를 거치지 않고 **Node가 0.0.0.0:8092로 직접 리슨**(외부에서 `http://221.141.3.91:8092` 직접 접근 가능). Node는 여전히 `nssm`으로 `MotoPayApi` 서비스 등록.

### nginx 설정 변경(수동 적용 필요 — 이 세션은 서버에 원격 접근 불가)
- 8090 서버 블록에서 기존 `/api/ { proxy_pass http://127.0.0.1:3000/; ... }` location은 더 이상 필요 없음(있어도 트래픽이 안 오니 무해하지만, 혼동 방지를 위해 제거 권장).
- 8091 서버 블록 신규 추가:
  ```
  server {
      listen 8091;
      server_name 221.141.3.91;
      root D:/Project/moto_partner;
      index index.html;
      location / { }
  }
  ```
- api는 nginx 뒤에 두지 않으므로 nginx 설정에 8092 관련 항목 자체가 필요 없음 — Windows 방화벽에서 인바운드 TCP 8092(및 8091, nginx가 그 포트로 아직 안 열려 있다면)를 허용해야 함.

### 프론트(`apps/customer-app`)만 바뀐 경우
1. 로컬에서 `npm run build`
2. `dist\` 내용을 `D:\Project\moto_dev`에 덮어쓰기 복사
3. 브라우저 강력 새로고침(Ctrl+Shift+R)으로 캐시된 예전 JS 확인

### 파트너앱(`apps/partner-app`) 최초 배포/업데이트
1. 로컬에서 `npm run build`(`apps/partner-app`)
2. `dist\` 내용을 `D:\Project\moto_partner`에 복사(최초 배포 시 위 nginx 8091 서버 블록도 함께 추가해야 함)
3. 브라우저 강력 새로고침으로 캐시 확인

### 백엔드(`apps/api`)만 바뀐 경우 (스키마 변경 없음)
1. 로컬에서 `npm run build`
2. `dist\`만 `D:\Project\moto_api\dist`에 덮어쓰기 복사 — **`uploads\`는 절대 건드리지 않기**(프로필 사진 등 실제 업로드 파일이 있는 폴더)
3. 서버 `.env`에 `PORT=8092`, `CORS_ORIGINS="http://221.141.3.91:8090,http://221.141.3.91:8091"`이 반영돼 있는지 확인(최초 전환 시 1회만 필요, 이후엔 그대로 유지)
4. `nssm restart MotoPayApi`
5. `http://221.141.3.91:8092/api-docs`로 정상 기동 확인(더 이상 `/8090/api/api-docs`가 아님 — 프록시 경유가 아니라 직접 포트로 접근)

### 백엔드 의존성(`package.json`)이 바뀐 경우
위 절차에 추가로:
1. **`npm ci`/`npm install` 실행 전 반드시 `nssm stop MotoPayApi`로 서비스를 먼저 멈출 것** — 서비스가 떠 있으면 Node 프로세스가 `bcrypt.node` 같은 네이티브 애드온(.node) 파일을 잡고 있어서, Windows는 사용 중인 파일의 unlink/교체를 막기 때문에 `npm ci`가 `EPERM: operation not permitted, unlink ...bcrypt.node`로 실패함(2026-07-26 실제 발생). `nssm restart`(멈춤+시작을 한 번에)가 아니라 **`stop` → 설치 → `start`를 분리**해서 설치 전 확실히 프로세스가 내려가 있게 할 것
2. `package.json`/`package-lock.json`도 함께 복사
3. Windows 서버 `D:\Project\moto_api`에서 `npm ci --omit=dev` 재실행(Windows용 `bcrypt`/Prisma 엔진 바이너리를 새로 받기 위함 — node_modules를 Mac에서 복사해오면 안 됨)
   - **주의**: `--omit=dev`는 `prisma`(CLI, devDependency)를 제외시킴 — 이후 `npx prisma migrate deploy`를 실행하면 로컬에 CLI가 없어 매번 `npx`가 임시로 재설치를 시도함(동작은 하지만 매번 다운로드). 마이그레이션을 자주 돌릴 서버라면 `npm install prisma --no-save`로 devDependency 없이 CLI만 임시 설치하거나, 이 서버에서만 `--omit=dev` 없이 `npm ci`를 쓰는 것도 방법
   - 그래도 EPERM이 나면 백신 프로그램이 `node_modules`를 스캔 중이라 파일을 잠갔을 가능성도 있음 — 해당 폴더를 백신 예외 목록에 추가하는 것도 검토
4. 이후 `nssm start MotoPayApi`(1번에서 이미 멈춰뒀으므로 `restart`가 아니라 `start`)

### Prisma 스키마(마이그레이션)가 바뀐 경우
위 절차에 추가로:
1. `prisma\` 폴더 전체(schema.prisma + migrations)도 함께 복사 — **`prisma.config.ts`도 반드시 같이 복사할 것**(이 파일은 `prisma\` 폴더 안이 아니라 `apps/api` 프로젝트 루트에 있음, 즉 서버에서는 `package.json`과 같은 위치. Prisma 7부터 이 파일이 `datasource.url`(`DATABASE_URL`)을 담당하는데 빠뜨리면 `migrate deploy`가 "The datasource.url property is required..." 에러로 즉시 막힘 — 2026-07-26 실제로 발생한 케이스)
2. 그 디렉터리에 `.env`(`DATABASE_URL` 포함)가 있는지 재확인(`prisma.config.ts`가 `dotenv/config`로 같은 디렉터리의 `.env`를 읽음)
3. 서버에서 `npx prisma migrate deploy` → `npx prisma generate`
4. 이후 `nssm restart MotoPayApi`

### 매번 확인
- `.env`는 서버에만 있고 커밋되지 않으므로 새 환경변수가 추가된 변경이면 서버 `.env`에도 수동으로 추가 필요
- **(2026-07-26부터 변경)** api가 이제 별도 origin(8092)으로 직접 노출되므로, CORS는 더 이상 "same-origin이라 자동 통과"가 아님 — 서버 `.env`의 `CORS_ORIGINS`에 8090/8091 두 origin이 모두 들어있는지 반드시 확인. 새 프론트 origin이 추가되면 이 값도 함께 갱신 필요

### 배포 확인(헬스체크) — 매 배포 후 아래 순서로 확인
1. **서비스가 떠 있는지**: `nssm status MotoPayApi` → `SERVICE_RUNNING`이어야 함. `SERVICE_STOPPED`면 `nssm start MotoPayApi` 후 재확인
2. **포트가 실제로 리슨 중인지**: `netstat -ano | findstr :8092` → `LISTENING` 라인이 있어야 함(없으면 앱이 기동 중 죽었다는 뜻 — `nssm`이 기록하는 stdout/stderr 로그 파일을 확인)
3. **앱이 응답하는지(가장 기본)**: 브라우저 또는 서버에서 `curl http://221.141.3.91:8092/` → `Hello World!` 평문 응답 확인(NestJS 기본 라우트, DB 연결과 무관하게 항상 응답해야 함 — 여기서부터 실패하면 앱 자체가 안 뜬 것)
4. **Swagger 문서가 뜨는지**: 브라우저로 `http://221.141.3.91:8092/api-docs` 접속 → API 라우트 목록이 정상 렌더링되는지 확인
5. **DB 연결까지 확인(실제 로그인 시도)**: `curl -X POST http://221.141.3.91:8092/auth/login -H "Content-Type: application/json" -d "{\"username\":\"<테스트계정>\",\"password\":\"<비번>\"}"` → `accessToken`/`refreshToken`/`user`가 담긴 200 응답이면 DB(MariaDB, 221.141.3.91:3308)까지 정상 연결된 것. 401(계정 자체 문제)이 아니라 500/커넥션 에러가 나면 DB 쪽 문제(`DATABASE_URL`, 방화벽, MariaDB 서비스 상태) 의심
6. **CORS까지 실제로 통과하는지(마지막, 가장 중요)**: 5번 curl은 CORS와 무관(브라우저가 아니므로) — 반드시 **실제 브라우저**로 `http://221.141.3.91:8090`(customer-app)과 `http://221.141.3.91:8091`(partner-app) 양쪽에서 로그인 화면까지 열어 실제 로그인을 시도해봐야 함. 개발자 도구 Network 탭에서 `POST /auth/login` 요청이 CORS 에러 없이 실제로 나가는지, 콘솔에 `has been blocked by CORS policy` 같은 에러가 없는지 확인 — 4~5번이 성공해도 `CORS_ORIGINS`에 해당 origin이 빠져 있으면 브라우저에서만 막힘(curl은 안 걸리니 이 단계로만 잡을 수 있음)

## Phase 26: 파트너(시공업체) 사용자 테이블 + 로그인 API + 최초 로그인 강제 비밀번호 변경 (2026-07-27)

> **사용자 요청**: "파트너사 사용자 테이블 생성 및 로그인 api 생성 및 연계해줘. 파트너사 사용자 테이블은 사용자id, 비밀번호, 휴대폰번호, 이메일주소, 업체코드가 필요할것 같아. 최초 로그인시 비밀번호 변경도 구현해줘."
> **사전 확인(AskUserQuestion)**: ① 신규 `PartnerUser` 테이블로 분리(User 테이블 확장 아님) ② 신규 `PartnerAuthModule`로 완전 분리(기존 AuthModule에 합치지 않음) ③ 최초 로그인 강제 변경은 로그인 응답에 `mustChangePassword` 플래그만 반환하고 프론트에서 강제(백엔드가 제한된 토큰을 발급하는 더 엄격한 방식 아님) — 3가지 모두 사용자가 직접 선택.

- [x] **스키마**: `schema.prisma`에 `PartnerUser` 모델 신규 추가 — `username`(unique)/`passwordHash`/`phoneEncrypted`+`phoneHash`(User와 동일한 AES-256-GCM+HMAC 정책, 둘 다 필수값)/`email`(필수)/`shopCode`(`Shop.shopCode`에 대한 실제 FK, `@db.Char(10)`로 타입 일치)/`mustChangePassword Boolean @default(true)`/`useYn Boolean @default(true)`(계정 비활성화용, 다른 마스터 테이블과 동일 컨벤션)/`lastLoginAt`/`createdAt`/`updatedAt`. `Shop`에 `partnerUsers PartnerUser[]` 역관계 추가
  - **요청 필드에 없던 것**: "이름"(담당자명)은 요청 목록에 없어 컬럼을 추가하지 않음 — 필요해지면 후속 요청으로 추가 → **후속 요청으로 실제 추가됨(2026-07-27)**: `name String` 컬럼(위치는 `passwordHash` 다음, `User.name`과 동일 순서) 추가. 기존 행(`shopowner01`) 1건이 이미 있어 `ADD COLUMN ... NOT NULL DEFAULT '__TEMP__'` → `UPDATE ... SET name='김철수' WHERE name='__TEMP__'` → `ALTER COLUMN name DROP DEFAULT`(drift 방지) 3단계로 마이그레이션 작성해 무중단 백필. `SafePartnerUser`/`to-safe-partner-user.ts`/`seed-partner-users.ts`/프론트 `PartnerUser` 타입 전부 갱신, 로그인 응답에 `name:"김철수"` 포함되는 것까지 curl로 재확인. `migrate diff` 드리프트 0건.
- [x] **마이그레이션**: `diff --script`로 SQL 생성 후 `YYYYMMDDHHMMSS_add_partner_users` 폴더 수동 생성 → `migrate deploy` → `generate`. 적용 후 재확인한 `migrate diff`에서 `updatedAt` 컬럼에 암묵적 `DEFAULT`가 붙는 drift 발견(이 프로젝트에서 반복적으로 나오는 MariaDB `explicit_defaults_for_timestamp=OFF` 레거시 동작, CLAUDE.md에 이미 문서화된 패턴) → `ALTER COLUMN updatedAt DROP DEFAULT` 후속 마이그레이션으로 즉시 수정, 이후 drift 0건 확인. `SHOW CREATE TABLE partner_users`로 최종 DDL(FK 포함) 직접 확인
- [x] **JWT realm 분리**: `JWT_PARTNER_ACCESS_SECRET`/`JWT_PARTNER_REFRESH_SECRET`(신규 랜덤 64자 hex, `.env`/`.env.example`에 추가, 만료시간은 기존 `JWT_ACCESS_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` 재사용)로 일반고객(`User`) 토큰과 완전히 다른 시크릿 사용. Passport 전략 이름도 `'jwt-partner'`로 명시(고객용 기본 전략 이름 `'jwt'`와 전략 레지스트리 충돌 방지)
- [x] **`src/partner-auth/` 신규 모듈**: `PartnerAuthController`(`POST /partner-auth/login`, `PATCH /partner-auth/me/password` — 둘 다 최초 강제변경과 일반 변경이 동일 엔드포인트 공유)/`PartnerAuthService`/`JwtPartnerStrategy`/`JwtPartnerAuthGuard`/`CurrentPartnerUser` 데코레이터/`partner-auth.types.ts`/`to-safe-partner-user.ts`(Shop 조인해 `shopName` 포함) — 전부 기존 `AuthModule`/`UsersModule` 파일 구조·명명 규칙을 그대로 미러링. `app.module.ts`에 등록
- [x] `prisma/seed-partner-users.ts` 신규 — 테스트 계정 `shopowner01`/`Initial1234!`, `shopCode='0000000001'`(강남 오토바디, 기존 `seed-shops.ts`의 첫 시드 데이터와 동일 — partner-app 홈 화면 mock 문구와도 우연히 일치), `mustChangePassword: true`로 생성
- [x] **curl로 백엔드 전수 검증**: 잘못된 비밀번호/존재하지 않는 아이디(401, 동일한 일반화 메시지) → 정상 로그인(`mustChangePassword:true`, `shopName` 조인 확인) → 비밀번호 변경 미인증 시도(401)/잘못된 현재비번(401)/새비번=현재비번(400)/정상 변경(200, `mustChangePassword`→false) → 예전 비번 로그인 실패(401)/새 비번 로그인 성공 확인 → **realm 분리 검증**: 고객(`/auth/login`) 토큰으로 파트너 보호 라우트 접근 시 401, 반대(파트너 토큰으로 `/auth/me`)도 401 — 시크릿이 달라 서명 검증 단계에서부터 막히는 것 확인
- [x] `tsc -b`/`nest build`/`eslint --fix` 클린

### 프론트(`apps/partner-app`) 실 연동
- [x] `src/api/{config.ts,tokenStorage.ts,http.ts,partnerAuth.ts}` 신규 — customer-app의 동일 파일들과 1:1 대응 패턴(`API_BASE_URL` dev/prod 분기, `자동로그인` 체크에 따라 localStorage/sessionStorage 분리 저장). **partner-app은 customer-app과 동일한 백엔드(apps/api)를 공유** — 별도 API 서버 아님
- [x] `FirstLoginPwdChangeScreen.tsx` 신규(전체화면, 닫기 버튼 없음 — 건너뛸 수 없는 강제 단계) — 현재 비밀번호+새 비밀번호+확인, 규칙 체크 4종(8자↑/조합/일치/현재비번과 다름)
- [x] `AuthFlow.tsx`: `onLogin`을 실제 `POST /partner-auth/login` 호출로 교체, 응답의 `mustChangePassword`로 로그인 화면 → (필요시)강제변경 화면 → 홈 순서로 분기. `FirstLoginPwdChangeScreen`의 제출은 실제 `PATCH /partner-auth/me/password` 호출, 성공 시에만 `onAuthComplete()` 호출
- [x] `tsc -b`/`vite build`/`oxlint` 클린
- [x] Playwright로 전체 플로우 검증: 잘못된 비밀번호(에러 토스트) → 올바른 초기 비밀번호 로그인(강제변경 화면 진입, 규칙 4종 체크박스) → 잘못된 현재비밀번호(에러 토스트) → 올바른 현재비밀번호+새비밀번호 제출(실제 홈 화면 진입 확인) → **재로그인 시 강제변경 화면 없이 곧장 홈 진입**(mustChangePassword=false 반영 확인) 전부 확인, 콘솔에 의도한 401 네트워크 로그 외 JS 런타임 에러 없음
- [x] 테스트 후 `shopowner01` 계정을 시드 스크립트 문서값(`Initial1234!`, `mustChangePassword:true`)으로 원복 — 이후 이 계정으로 다시 테스트하는 사람이 문서와 다른 상태를 만나지 않도록 함

### 미해결/후속
- [ ] 파트너 계정 발급(admin/콜센터가 신규 계정을 만드는 API)은 이번 범위 밖 — 현재는 `prisma/seed-partner-users.ts` 수동 실행으로만 계정 생성 가능
- [ ] 아이디·비밀번호 찾기(`AcctFindScreen`/`PwdFindScreen`/`PwdResetScreen`)는 여전히 UI 프로토타입(Mock) — 이번 요청 범위가 아니라 손대지 않음
- [ ] `POST /partner-auth/refresh`(리프레시 토큰으로 액세스 토큰 재발급)는 고객 쪽과 마찬가지로 아직 없음(고객 `/auth/refresh`도 미구현 상태와 동일한 스코프)
- [ ] 파트너 홈 화면(`HomeScreen.tsx`)은 여전히 전부 mock 데이터 — 로그인 응답의 `shopName`/`shopCode` 등을 실제로 홈 화면 인사말에 연결하는 작업은 이번 범위 밖

## Phase 27: 내 업체 관리 메인·기본정보 관리 API 연계 (2026-07-27)

> **사용자 요청**: "내 업체 관리 메인 및 기본정보 관리 api 연계진행"
> **사전 확인(AskUserQuestion)**: 대표사진/소개사진(최대 10장) 업로드는 이번 범위 밖으로 확정 — 텍스트/주소/전화/운영시간/카테고리만 실 API 연동, 사진은 UI 플레이스홀더로 유지

- [x] **디자인 확인**: claude_design MCP로 `MotoPay 시공업체 업체관리.dc.html`(PT-PROF-01~08, 8개 화면) 확인 후 `design/source/MotoPay_시공업체_업체관리.dc.html`로 저장. 이번엔 그중 PT-PROF-01(메인)·PT-PROF-02(기본정보 관리)만 구현(요청 범위)
- [x] **스키마 갭 발견 및 보완**: `Shop` 모델에 "운영시간"(자유텍스트) 대응 컬럼이 없어 `businessHours String?` 추가(nullable, 마이그레이션 무중단). `CAR_INST` 공통코드가 4종(썬팅/PPF/유리막코팅/블랙박스)만 있고 디자인 목업의 실내크리닝·언더코팅 2종이 없어 `seed-common-codes.ts`에 `CLEAN`/`UCOAT` 추가(대문자 영문 약어 컨벤션 준수)
- [x] `apps/api/src/shops/dto/update-shop.dto.ts` 신규 — intro/greeting/address/addressDetail/phone/businessHours/categories 전부 선택값(부분 수정)
- [x] `ShopsService.updateMyShop(shopCode, dto)` 추가 — 텍스트 필드는 보낸 것만 반영, `categories`를 보내면 `ShopInstCategory` 전체 교체(delete+createMany)
- [x] `ShopsController`에 `GET /shops/me`/`PATCH /shops/me`(둘 다 `JwtPartnerAuthGuard`) 추가 — **반드시 기존 `GET /shops/:shopCode`보다 먼저 선언**(안 그러면 `me`가 `:shopCode` 파라미터로 잘못 라우팅됨), 라우트 순서 실제 curl로 재확인
- [x] `prisma/seed-shops.ts`에 `businessHours` 필드 추가, 강남 오토바디 등 3개 시드 업체 전부 값 채움
- [x] curl로 검증: 인증 없이 `GET/PATCH /shops/me`(401) → 로그인 → `GET /shops/me`(실제 데이터 반환) → `GET /shops/:shopCode`가 라우트 순서 변경 후에도 정상 동작하는지 재확인 → `PATCH /shops/me`(일부 필드+카테고리 교체) 성공 확인 → 테스트로 바뀐 데이터는 시드값으로 원복
- [x] `tsc -b`/`nest build`/`eslint --fix` 클린

### 프론트(`apps/partner-app`)
- [x] `components/ui/Textarea.tsx` 신규 — Cardoc 디자인시스템 Textarea 컴포넌트 스펙(`_ds_bundle.js`에서 직접 확인) 그대로 이식(소개글/인사말에 사용, 이 프로젝트 최초의 Textarea 프리미티브)
- [x] `src/api/{shops.ts,commonCodes.ts}` 신규
- [x] `screens/biz/` 신규 — `BizMainScreen.tsx`(PT-PROF-01), `BizBasicInfoScreen.tsx`(PT-PROF-02), `BizFlow.tsx`(컨테이너), `LogoutConfirmModal.tsx`, `bizIcons.tsx`
- [x] **스코프 판단**: 메인 화면의 4개 메뉴 중 "기본정보 관리"만 실제 이동, 나머지 3개(휴무일/예약가능시간/예약현황)와 부가메뉴 중 "알림함"/"비밀번호 변경"은 아직 화면이 없어 토스트 플레이스홀더. **"로그아웃"만 예외적으로 실제 구현**(확인 모달 + `clearTokens()` + 로그인 화면 복귀) — 같은 화면 안의 모달이라 추가 화면 없이 완결 가능하고, 이게 없으면 로그인 후 앱에서 나갈 방법이 전혀 없어지는 실사용 결함이라고 판단
- [x] `HomeScreen.tsx`의 "마이" 하단내비 탭을 토스트 플레이스홀더에서 `BizFlow` 진입으로 연결, `App.tsx`에 `view: "home"|"biz"` state 추가
- [x] 기본정보 관리 화면의 카테고리 칩은 `GET /common-codes/CAR_INST`(전체 목록) + 업체의 현재 `categories`(활성 목록)를 프론트에서 조합해 토글 UI 구성 — 별도 백엔드 로직 없이 기존 두 엔드포인트 조합만으로 해결
- [x] "승인대기 중이에요" 배너는 실제 관리자 승인 시스템이 없어 순수 클라이언트 로컬 state(저장 성공 시 세션 동안만 true) — 원본 디자인의 안내 문구만 그대로 유지, 가짜 백엔드 승인 플래그는 만들지 않음
- [x] `tsc -b`/`vite build`/`oxlint` 클린
- [x] Playwright로 전체 플로우 검증: 로그인→강제변경→홈→"마이" 탭→내 업체 관리 메인(실제 업체명·소개·주소 표시)→"기본정보 관리"(실제 소개글·인사말·주소·전화·운영시간·카테고리 로드)→운영시간 수정+카테고리 토글→저장(승인대기 배너 노출)→DB 직접 조회로 실제 반영 확인. 콘솔 에러 0건
- [x] 테스트로 변경된 시드 데이터(카테고리·운영시간·계정 비밀번호)는 전부 문서값으로 원복

### 미해결/후속
- [ ] 대표사진/소개사진(최대 10장) 업로드는 스코프 밖(사용자 확인) — 프로필 사진과 동일한 base64 업로드 패턴(`common/storage/profile-image-storage.ts`)으로 나중에 구현 가능, `ShopPhoto` 테이블은 이미 준비돼 있음
- [ ] PT-PROF-03~08(매장 휴무일 설정/예약 가능 시간 설정/예약 현황/알림함/비밀번호 변경/로그아웃 확인은 이번에 구현됨)은 아직 미구현 — `ShopHoliday`/`ShopTimeSlot`/`ShopDailySlot`/`Reservation` 테이블은 이미 스키마에 있어 다음 작업 시 바로 활용 가능
- [ ] "주소" 필드는 원본 디자인 그대로 비활성(주소 검색 팝업 경유 전제)이라 실제로는 변경 불가 상태로 남음 — 실제 주소 검색(다음/카카오 우편번호 API 등) 연동 시 함께 풀어야 함

## Phase 28: 푸시 알림 인프라 구축 (계획, 2026-08-13)

> **사용자 요청**: "푸쉬 기능 추가하려면 어떻게 해야 하는지 설명해줘" → 설명 후 AskUserQuestion으로 범위 확정
> **범위**: customer-mobile 우선 구현, PushToken 모델은 partner-app 향후 확장을 고려해 설계. 첫 발송 트리거는 예약 확정/시공 완료 등 서비스 필수 알림부터(마케팅성 알림은 후순위)

- [ ] Prisma `PushToken` 모델 추가 — `ownerType`('USER'|'PARTNER')+`ownerId`(FK 없는 다형 참조, User.id 또는 PartnerUser.id), `expoPushToken`(unique), `platform`, `updatedAt`만 사용(관리자 CRUD 화면이 없는 시스템 upsert 테이블이라 createdBy/updatedBy 제외) + 마이그레이션
- [ ] `expo-server-sdk` 설치, `PushNotificationService` 신설(Expo Push API 발송 래퍼, 만료/무효 토큰 응답 처리 포함)
- [ ] `POST /me/push-token`(로그인한 User 전용, 등록/upsert), 로그아웃 시 토큰 삭제
- [ ] 예약 확정 트리거 연결 — `ReservationsService`에서 status가 `CONFIRMED`로 바뀌는 지점
- [ ] 시공 완료 트리거 연결 — 시공업체가 완료 처리하는 지점
- [ ] 두 트리거 모두 `agreedMarketingPush` 동의 여부와 무관하게 발송(서비스 필수 알림으로 분류)

### 미해결/후속
- [ ] `ownerType='PARTNER'` 경로(partner-app 발급/등록)는 이번 범위 밖 — 테이블 구조만 재사용 가능하게 설계해둠
- [ ] 발송 트리거를 예약 확정/시공 완료 2건 이상으로 넓힐지(입찰 마감 임박 등)는 아직 기획 확정 전
- [ ] `eas.json` 미설정 — Android FCM/iOS APNs 자격증명 등록은 에이전트가 대신 할 수 없어 사용자 진행 필요

## Phase 29: 포인트 충전/사용 연계 · 회원 상세 화면 재구성 · 보유 쿠폰함 연계 (2026-08-17~08-18)

> **사용자 요청 흐름**: "포인트 충전, 사용내역까지 연계"(포인트홈 API 연동 이후 UI 시뮬레이션으로만 남겨뒀던 충전/사용을 실 연동으로 전환) → "홈 상단 보유 포인트도 연계처리" → 관리자 포인트 내역 화면의 처리자 표시 버그 신고 → "본인 보다 회원명으로 표시해줘"/"admin 대신 사용자명으로 변경"(표시 개선 2단계) → "회원 상세 탭 화면 사이즈를 50%정도 넓히고... 재구성" → "포인트 그리드 하단에 금액합계 표시" → "customer-app 보유 쿠폰함 api 연계"

- [x] **포인트 충전 실 연동** — `apps/customer-app`의 `PtChargeAmtSelScreen`(CU-PNT-02) 결제하기 버튼을 실제 포인트 적립 API 호출로 전환(기존엔 UI 시뮬레이션만)
- [x] **예약시공 결제 시 포인트 사용 실 연동** — 예약 결제 흐름에 실제 포인트 차감을 연결하되, **포인트 차감 → 예약 결제확정 순서를 지켜** 잔액 부족 시 예약 상태가 바뀌지 않고 그대로 남도록 처리(직접 테스트로 순서 확인)
- [x] **`PointsService` 단일 `adjust()` 사설 메서드로 통합** — 관리자 강제부여/차감(AD-PNT-04/05), 신차구매 포인트 지급, 자기 충전, 자기 사용 4개 경로가 모두 이 메서드 하나를 재사용(포인트 잔액 변경 로직이 4곳에 중복 구현되는 것을 방지)
- [x] **홈 상단 보유 포인트 배지** — `HomeScreen.tsx`의 포인트 배지를 실 API 연동으로 전환
- [x] **관리자 포인트 내역(AD-PNT-06) 처리자 표시 개선(2단계)** — ① 처리자가 raw UUID로 노출되던 것을 1차로 "본인" 고정 표시로 수정했다가, 사용자 피드백("본인 보다 회원명으로 표시해줘")으로 실제 회원 이름으로 교체, ② 관리자 처리 건은 raw username "admin"이 그대로 보이던 것을 `AdminAccount.findMany({username:{in:[...]}})`로 일괄 조회해 실제 관리자 표시이름으로 매핑하는 방식으로 교체(사용자 피드백 "admin 대신 사용자명으로 변경"). 구분값이 "충전"인 행 클릭 시 상세가 안 보이던 버그도 함께 수정.
- [x] **AD-MBR-02 회원 상세 화면 재구성** — 모달 폭 50% 확대 + 기준정보/보유차량/신차패키지/포인트/쿠폰 5개 탭 구조로 전면 재구성(기존엔 단일 뷰)
- [x] **회원 등급 계산 로직 공유** — `MemberGradeRulesService`의 등급 산정 로직을 `AdminMembersService`(회원 상세 기준정보 탭)와 `CouponsService`(등급별 쿠폰 발행 대상)가 함께 재사용하도록 통합(로직 중복 방지)
- [x] **포인트 탭 금액 합계 행** — 회원 상세 포인트 탭 그리드 하단에 합계 행 추가
- [x] **customer-app 보유 쿠폰함 API 연계** — `CpnBoxScreen`(CU-MYPG-16)을 `GET /me/coupons` 실 연동으로 전환(기존 목업 `COUPON_DEFS` 제거)
- [x] 각 단계마다 curl/실 로그인으로 검증 후 테스트 데이터 원복(포인트 잔액, 테스트 쿠폰 등)

### 미해결/후속
- [ ] 등급 산정을 실제로 트리거하는 배치/스케줄러는 없음 — `MemberGradeRule` 설정값과 계산 로직은 있지만 "언제 재계산할지"는 아직 없음(Phase 30/`admin/checklist.md`에도 동일하게 남아있는 항목)

## Phase 30: AD-CS-02·AD-CS-03·AD-NOTI-02 (1:1문의·FAQ·후기 관리) 전체 연동 (2026-08-18)

> **사용자 요청**: "AD-CS-02, AD-CS-03, AD-NOTI-02 api 연계 처리" → AskUserQuestion으로 "관리자 화면만 만들지, customer-app 목업 화면까지 실연동해서 전체 루프를 완성할지" 확인 → **"고객앱까지 전체 연동" 선택** → 이어서 "일반적인 faq 샘플로 데이터 등록해줘" → 이후 다수의 UI 버그 리포트("후기 관리 평점 및 처리 정렬이 맞지 않음", "faq 관리 토글 스위치 레이아웃이 안맞음", "customer-app 1:1 문의 등록 사진 첨부 기능 작동 안함. 카메라 기능도 추가. 등록 후 답변 수신 전까지는 수정 기능이 있어야 함", "admin-app 1:1문의 답변 발송 클릭시 발송하시겠습니까? 문의 후 저장 후 닫기", "admin-app 후기 관리 그리드 처리 버튼 사이즈가 안맞음", "블라인드 처리 버튼이 아직도 크게 보임...", "버튼 정렬이 top임", "customer-app 자주 묻는 질문, 문의 처리현황 진입시 재조회 하는 방식으로 변경")를 순차 반영

### 스키마·백엔드
- [x] Prisma `Inquiry`(1:1 문의, inquiryNo는 Product/Shop과 동일한 10자리 0-padding 채번), `FaqItem`, `Review.isBlinded` 컬럼, `InquiryPhoto`(첨부사진, 수정 시 전체삭제후재등록 방식이라 감사컬럼 제외) 신규/추가 — 마이그레이션 2건 모두 `migrate diff` 빈 결과로 drift 없음 확인
- [x] `seed-common-codes.ts`에 `INQUIRY_CATEGORY`(5)·`INQUIRY_STATUS`(2)·`FAQ_CATEGORY`(4) 코드그룹 추가 — **customer-app에 이미 존재하던 목업 텍스트(csData.ts)를 그대로 시드값으로 사용**(설계 문서상 카테고리 목록과 실제 렌더된 문구가 다를 때 실제 렌더를 신뢰하는 이 프로젝트의 기존 원칙 적용)
- [x] `apps/api/src/inquiries/` — 고객용 `POST/GET /me/inquiries`, `GET/PATCH /me/inquiries/:inquiryNo`(수정은 PENDING 상태에서만 허용, 답변완료 후 시도하면 400), 관리자용 `GET /admin/inquiries`(대기건 상단 고정 정렬 — `status` desc가 'PENDING'>'ANSWERED' 알파벳순과 일치하는 걸 이용), `GET/PATCH /admin/inquiries/:inquiryNo(/answer)`
- [x] `apps/api/src/faqs/` — 공개 `GET /faqs`(로그인 불필요), 관리자 `GET/POST/PATCH/DELETE /admin/faqs(/:id)` + `PATCH /admin/faqs/reorder`(라우트 순서상 `:id`보다 먼저 선언)
- [x] `apps/api/src/reviews/` — `GET /admin/reviews`, `PATCH /admin/reviews/:id/blind`. `shops.service.ts`의 기존 후기 조회 3곳(집계·공개 상세·파트너용 목록)에 `isBlinded:false` 필터 추가해 블라인드 처리된 후기가 실제로 숨겨지도록 함
- [x] **문의 첨부사진 수정 시 불필요한 재업로드 방지** — `PATCH /me/inquiries/:inquiryNo`의 `photos` 배열에 data URI(신규)와 기존 상대경로(유지)가 섞여 와도, `data:` 접두사로 신규만 판별해 저장하고 유지 항목은 그대로 통과시킴(기존 파일 재다운로드/재업로드 없음). 목록에서 빠진 기존 사진은 물리 파일까지 정리
- [x] `common/storage/inquiry-photo-storage.ts` 신규(기존 review/reservation-photo-storage와 동일 패턴)

### admin-app
- [x] `InquiryMgmtPage.tsx`(AD-CS-02), `FaqMgmtPage.tsx`(AD-CS-03), `ReviewMgmtPage.tsx`(AD-NOTI-02) 3개 화면 신규, `App.tsx` 라우팅 연결
- [x] **"답변 발송" 확인 모달 추가** — 클릭 즉시 발송되던 것을 `ConfirmModal`("발송하시겠습니까?")로 한 단계 확인 거치도록 변경, 발송 성공 시 상세 모달 자동 닫힘(기존엔 계속 열려있었음)
- [x] **UI 버그 수정 다수, 원인 규명 포함**:
  - ReviewMgmtPage 평점/처리 컬럼 가로 정렬 — `cellClass:"flex items-center justify-center"` 누락이 원인(CstItemMgmtPage 등 기존 아이콘 액션 컬럼의 정착 컨벤션과 대조해 확인)
  - 처리 버튼 크기 — 텍스트 라벨(아이콘 전용이 아님)이 이 그리드에서 처음이라 기존 좁은 컬럼폭이 안 맞았음, 고정폭 컬럼(`width`)+버튼 `h-7` 고정높이로 교체
  - 처리 버튼 세로 정렬(top→middle) — ag-grid가 커스텀 `cellRenderer`를 감싸는 `.ag-react-container`가 `height:100%`만 채울 뿐 스스로 세로 중앙정렬은 안 해준다는 걸 확인(기존 삭제아이콘 버튼들이 전부 `h-full w-full flex items-center justify-center`였던 이유였음, 뒤늦게 발견) — "평점"/"노출상태" 컬럼도 동일 원인이라 함께 수정
  - FaqMgmtPage 노출여부 토글 — 절대좌표(`top-0.5`+`translate-x-0.5/5`) 방식이 ON/OFF 상태별 여백이 비대칭이었음, `border-2 border-transparent`+`inline-flex` 트릭(shadcn 계열 표준 패턴)으로 교체해 대칭 해소

### customer-app (사용자가 명시적으로 "고객앱까지 전체 연동" 선택)
- [x] `api/inquiries.ts`, `api/faqs.ts` 신규 클라이언트
- [x] `CsFlow.tsx`(CU-CS 컨테이너) 목업(`INITIAL_INQUIRIES`/`FAQ_DEFS`/`INQUIRY_CATEGORIES`) 완전 제거, 실 API로 교체
- [x] `FaqScreen.tsx`는 `faqs` prop을, `InquiryRegScreen.tsx`는 `categories` prop을 받도록 변경(직접 import하던 목업 상수 제거)
- [x] **1:1 문의 사진 첨부 + 카메라 기능** — partner-app에서 이미 검증된 `PhotoUploadGrid`(촬영/앨범, 네이티브 브릿지 우선+웹 `<input type=file>` 대체) 패턴을 customer-app에 이식해 신규 작성, `InquiryRegScreen`에 실제 업로드 UI로 교체(기존엔 비기능 장식 아이콘)
- [x] **문의 수정 기능(답변 등록 전까지)** — `InquiryDtlScreen`에 "문의 수정하기" 버튼(`!answered`일 때만 노출), `InquiryRegScreen`을 등록/수정 겸용으로 확장, 기존 사진 유지 항목은 URL↔상대경로 왕복 변환(`toPhotoUrl`/`fromPhotoUrl`)으로 재업로드 없이 서버에 전달
- [x] **문의유형 코드 표시 방식 변경** — `Inquiry.cat`이 기존엔 화면에 뿌릴 한글 라벨을 직접 담았는데, 수정 폼에서 원래 코드값이 필요해져 raw 코드(`INQUIRY_CATEGORY` 코드값)로 바꾸고 `InquiryProcStatScreen`/`InquiryDtlScreen`이 `categoryLabel(code)` 함수 prop으로 라벨을 그때그때 변환하도록 변경
- [x] **자주 묻는 질문 / 문의 처리현황 화면 재조회 방식으로 전환** — 기존엔 `CsFlow` 마운트 시 한 번만 조회해서 이전 진입 때 데이터가 남아있는 문제가 있었음, `goFaq()`/`goInquiryStat()` 헬퍼로 해당 화면에 진입하는 모든 경로(메인 메뉴·등록/수정 완료 후 이동·상세 화면 뒤로가기·하드웨어 뒤로가기 포함)에서 매번 재조회하도록 통일
- [x] 일반 FAQ 샘플 6건 등록(포인트 2·예약시공 2·쇼핑몰 1·계정 1, 기존 customer-app 목업 문구 그대로 재사용)

### 검증
- [x] 문의 등록(사진 첨부 포함) → 관리자 목록에서 대기건 상단 정렬 확인 → 답변 등록(확인 모달 경유) → 고객 화면에 답변 즉시 반영 → 답변완료 후 수정 시도 시 400 차단까지 curl로 전 구간 확인
- [x] 문의 수정 시 기존 사진이 재업로드 없이 유지되는지 물리 파일 경로까지 확인
- [x] FAQ 등록(관리자) → 공개 `/faqs` 즉시 노출 확인
- [x] 후기 블라인드 처리/해제 시 `/shops/:shopCode/reviews` 응답에서 실제로 빠지는지 확인, 기존 실제 후기 3건은 원상 복구
- [x] admin-app·customer-app 양쪽 `tsc -b --force` 클린, dev 서버 컴파일 확인
- [x] 테스트로 생성한 문의·FAQ·첨부사진 파일 전부 정리, 실제 데이터는 미변경

### 미해결/후속
- [ ] 등급 산정 엔진 부재(Phase 29와 동일 항목)
- [ ] 이번에 admin-app 전체 이력이 처음으로 `admin/checklist.md`·`admin/context-notes.md`로 정리됨 — 이후 admin-app 작업은 계속 그쪽에 기록할 것(더 이상 서버 체크리스트에 admin-app 화면 단위 항목을 섞지 않는다)
- [ ] 마케팅성 푸시(프로모션 등)는 `agreedMarketingPush` 체크 분기가 필요하나 이번 범위 밖
