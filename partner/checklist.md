# 파트너(시공업체)앱 로그인 PT-AUTH-02~04 구현 체크리스트

> **범위**: 시공업체 파트너센터 로그인 화면만(PT-AUTH-02~04). UI 프로토타입(Mock 상태전환)으로 한정 — 실제 `apps/api` 연동은 스코프 밖(사용자 확인됨). 실제 API 연동을 진행할 때는 이미 role-agnostic한 `/auth/login`, `/auth/find-username`, `/auth/reset-password`를 그대로 재사용 가능.

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 시공업체 로그인.dc.html`) 가져와 `design/source/MotoPay_시공업체_로그인.dc.html`로 저장
- [x] 신규 `apps/partner-app`(Vite+React+TS+Tailwind v4) 스캐폴딩 — `apps/customer-app`과 동일한 구성(package.json/vite.config.ts/tsconfig 3종/index.html/.oxlintrc.json), Cardoc 토큰 `index.css`·Pretendard 폰트 이식
- [x] 공용 UI 프리미티브(`AppShell`, `Button`, `Input`, `Checkbox`, `BottomSheet`, `Toast`, `useToast`)를 customer-app에서 그대로 복사(디자인시스템 컴포넌트 스펙 자체가 동일하므로 변경 없음)
- [x] PT-AUTH-02 `LoginScreen.tsx` — 아이디/비밀번호, 자동로그인(기본 체크), 아이디·비밀번호 찾기 링크, "파트너 계정은 자체 가입 불가 → 콜센터 문의" 배너, "고객이신가요? 고객앱 로그인" 링크. SNS 로그인·회원가입 진입점 없음(원본 설계 의도)
- [x] 아이디 찾기(참고용, PT 화면번호 외) `AcctFindScreen.tsx` — 원본 dc.html에 실제로 구현돼 있어 그대로 포함, 마스킹 아이디 `shop****45`
- [x] PT-AUTH-03 `PwdFindScreen.tsx` — 아이디 + 휴대폰 인증(고객앱과 달리 아이디 필드 추가), 인증 완료 시 재설정 화면으로 자동 전환
- [x] PT-AUTH-04 `PwdResetScreen.tsx` — 새 비밀번호 규칙 체크(8자 이상/영문·숫자·특수문자 조합/일치), 완료 시 성공 토스트
- [x] 콜센터 안내 팝업 `CallCenterSheet.tsx` — 중앙 모달(바텀시트 아님), 전화번호 1588-0000, 전화 걸기 버튼(클릭해도 모달은 닫히지 않음 — 원본 mock 로직 그대로)
- [x] `AuthFlow.tsx` 컨테이너로 로그인 화면 + 4개 시트(아이디찾기/비밀번호찾기/비밀번호재설정/콜센터) 상태 전환 연결, `App.tsx`는 현재 스코프상 AuthFlow만 렌더링
- [x] `npm install` / `tsc -b` / `vite build` 프로덕션 빌드 통과 / `oxlint` 통과(경고 0건)
- [x] Playwright(스크래치 설치, `--no-save`)로 전체 플로우(로그인 화면 → 아이디찾기 인증 → 로그인하기 복귀 → 비밀번호찾기 인증 → 비밀번호재설정 자동전환 → 완료 토스트 → 콜센터 팝업 → 전화걸기 토스트) 스크린샷 확인, 콘솔 에러 0건
- [x] 고객앱 ↔ 파트너앱 실제 전환 연결 — 두 앱 dev 포트 고정(5173/5174), 각 앱 `src/config.ts`에 상대 앱 URL 정의, 로그인 화면 하단 링크가 토스트 대신 `window.location.href`로 실제 이동(양방향)
- [x] **실제 API 연동 완료(2026-07-27)** — 애초 계획(고객 `/auth/*` 재사용)과 달리, 파트너 전용 `PartnerUser` 테이블 + `/partner-auth/*` API로 신규 구현(백엔드 설계·검증은 `server/checklist.md` Phase 26 참고). `src/api/{config.ts,tokenStorage.ts,http.ts,partnerAuth.ts}` 신규, `AuthFlow.tsx`의 로그인이 실제 `POST /partner-auth/login` 호출
- [x] **최초 로그인 강제 비밀번호 변경 구현** — `FirstLoginPwdChangeScreen.tsx`(신규, 전체화면·닫기 불가) 추가, 로그인 응답의 `mustChangePassword` 플래그로 분기, `PATCH /partner-auth/me/password` 연동. Playwright로 로그인→강제변경→홈, 재로그인 시 강제변경 생략까지 전체 플로우 검증 완료

## 파트너 홈 PT-HOME-01 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 시공업체 홈.dc.html`) 가져와 `design/source/MotoPay_시공업체_홈.dc.html`로 저장
- [x] `HomeScreen.tsx`(`src/screens/home/`) — 상단 앱바(MotoPay+파트너 뱃지+알림벨), 인사말, 확인 대기 알림 배너, 신차패키지 시공관리 카드(착수대기/시공중/완료 3스탯), 예약시공 입찰 카드(신규요청/참여중/시공대기 3스탯), 오늘의 시공 일정 리스트(상태 칩 3종), bottom navigation(홈/예약관리/정산/마이) 그대로 이식
- [x] `homeIcons.tsx` — 하단내비 4종 + 알림벨·안내원·패키지·태그 아이콘, customer-app `homeIcons.tsx`와 동일한 컨벤션(SVG 인라인, `IconProps.color`)
- [x] `AuthFlow.tsx`에 `onAuthComplete` prop 추가해 로그인 성공 시 실제로 `HomeScreen`으로 전환(그동안 "로그인되었어요" 토스트만 뜨고 끝나던 부분을 customer-app 선례와 동일하게 실제 연결), `App.tsx`에 `loggedIn` state 추가
- [x] `tsc -b` / `vite build` / `oxlint` 통과(경고 0건)
- [x] Playwright로 로그인→홈 진입, 카드 스탯 탭·오늘 일정 탭·하단내비 탭 각각 토스트 확인, 콘솔 에러 0건
- [x] **하단내비 "마이" 탭 실제 연결(2026-07-27)** — 토스트 플레이스홀더 → `BizFlow`(내 업체 관리) 진입으로 교체. 나머지(예약관리/정산, 카드 "바로가기")는 여전히 스코프 밖(토스트 플레이스홀더)

## 내 업체 관리 PT-PROF-01(메인)·02(기본정보 관리) 구현 체크리스트

> **범위**: PT-PROF-01(메인)·02(기본정보 관리)만. PT-PROF-03~08(휴무일/예약가능시간/예약현황/알림함/비밀번호변경/로그아웃확인은 예외적으로 구현됨)은 스코프 밖. 대표사진/소개사진 업로드도 사용자 확인 후 스코프 밖으로 확정(텍스트/주소/전화/운영시간/카테고리만 실 연동). 백엔드 설계·검증 상세는 `server/checklist.md` Phase 27 참고.

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 시공업체 업체관리.dc.html`, PT-PROF-01~08 8개 화면) 확인 후 `design/source/MotoPay_시공업체_업체관리.dc.html`로 저장
- [x] `components/ui/Textarea.tsx` 신규(이 프로젝트 최초의 Textarea 프리미티브, Cardoc 번들에서 스펙 직접 확인 후 이식)
- [x] `src/api/{shops.ts,commonCodes.ts}` 신규
- [x] `screens/biz/BizMainScreen.tsx`(PT-PROF-01) — 업체 프로필 요약(실 데이터) + 4개 메뉴 카드(기본정보 관리만 실제 이동) + 부가메뉴 3종(알림함·비밀번호변경은 토스트, 로그아웃만 실제 구현) + 하단내비(마이 active, 홈만 실제 이동)
- [x] `screens/biz/BizBasicInfoScreen.tsx`(PT-PROF-02) — 대표사진/소개사진은 플레이스홀더만, 소개글·인사말·상세주소·전화·운영시간 실 입력 + 시공가능 카테고리 토글(`GET /common-codes/CAR_INST` 전체목록 + 업체 활성목록 조합), 저장 시 `PATCH /shops/me` 호출 + "승인대기" 배너(순수 프론트 로컬 state)
- [x] `screens/biz/BizFlow.tsx`(컨테이너) — `GET /shops/me`로 업체 데이터 로드, 메인↔기본정보 화면 전환, 로그아웃 확인 모달 상태 관리
- [x] `screens/biz/LogoutConfirmModal.tsx` — 중앙 모달, 확인 시 `clearTokens()` + 로그인 화면 복귀
- [x] `HomeScreen.tsx`의 "마이" 탭에 `onOpenMyPage` prop 연결, `App.tsx`에 `view: "home"|"biz"` state 추가
- [x] `tsc -b`/`vite build`/`oxlint` 클린
- [x] Playwright로 전체 플로우(로그인→강제변경→홈→마이 탭→업체관리 메인(실 데이터)→기본정보 관리(실 데이터 로드)→운영시간 수정+카테고리 토글→저장→승인대기 배너) 검증, DB 직접 조회로 저장 결과까지 재확인. 콘솔 에러 0건
- [ ] PT-PROF-03~06(휴무일/예약가능시간/예약현황/알림함), 대표사진/소개사진 업로드는 스코프 밖 — 관련 테이블은 이미 스키마에 있어 후속 작업 시 바로 활용 가능
