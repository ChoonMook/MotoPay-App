# 컨텍스트 노트 — 파트너(시공업체)앱 로그인 PT-AUTH-02~04

## 출처
- claude_design MCP 프로젝트 "MotoPay 프로토타입 설계"(projectId: bafa6465-bc6f-49fb-a696-bd359b381650)의 `MotoPay 시공업체 로그인.dc.html` → `design/source/MotoPay_시공업체_로그인.dc.html`로 저장.
- 상태 구조·문구·인터랙션은 파일 하단 `class Component extends DCLogic`의 `state`/`renderVals()`를 그대로 대조해 이식(`.dc.html`은 React로 직접 포팅 불가 — customer-app 작업 때와 동일한 방식).

## 주요 결정

### 1. 신규 앱(`apps/partner-app`)으로 분리 — customer-app 내부 모드 아님
사용자에게 두 가지 선택지(신규 앱 vs customer-app 내 view 추가)를 물어봤고, 신규 앱 쪽으로 확정됨.
- **근거**: `apps/customer-app`은 이미 실제 백엔드(`apps/api`)와 연동된 프로덕션 단계 코드(로그인/아이디찾기/비밀번호재설정 모두 실 API 호출)이고, 기존 `LoginScreen.tsx`에 "파트너센터 로그인 ›" 링크가 원래부터 플레이스홀더(`onPartnerToast`)로 남겨져 있어 애초에 별도 앱으로 분리될 것을 전제로 설계돼 있었음.
- 프로젝트 개요(`CLAUDE.md`)상으로도 "일반고객, 시공업체가 사용하는 앱"이 명시돼 있어 시공업체 전용 앱이 명확히 별개 대상.
- 시공업체앱은 이후 업체관리·신차패키지 등 다른 화면도 계속 추가될 별개 앱이므로, 지금 분리해두는 게 구조적으로 맞음.

### 2. 스코프: UI 프로토타입(Mock)만, 실제 API 연동 없음
- 사용자 확인 결과 이번 작업은 customer-app 로그인 작업 초기 단계와 동일하게 "Mock 상태전환"으로 한정.
- **후속 참고**: `apps/api`의 `AuthService.login`/`findUsernameByPhone`/`issuePasswordResetToken`/`resetPassword`는 전부 `role` 필터가 없어 `PARTNER` role 유저도 그대로 통과하는 구조(스키마에 이미 `UserRole.PARTNER` 존재) — 실제 연동 시 백엔드 추가 개발 없이 바로 재사용 가능할 것으로 보임(단, 파트너 전용 화면 접근 제어·역할별 라우팅은 별도 설계 필요).

### 3. 스캐폴딩은 customer-app을 그대로 복제
- `package.json`/`vite.config.ts`/`tsconfig.*`/`.oxlintrc.json`/`index.html`/`.gitignore`, Cardoc 토큰 `index.css`, Pretendard 폰트(otf 4종), 공용 UI 프리미티브(`AppShell`, `Button`, `Input`, `Checkbox`, `BottomSheet`, `Toast`, `useToast`)를 1:1로 복사. 디자인시스템 컴포넌트 자체가 고객앱과 동일한 Cardoc 번들이라 변형 없이 재사용.
- `native/backHandler.ts`, `native/bridge.ts`(하드웨어 백버튼·카메라 브릿지)는 이식하지 않음 — 파트너앱을 감쌀 RN 웹뷰 셸(`customer-mobile`과 같은 방식)이 아직 없어 지금 추가하면 죽은 코드가 됨. 파트너앱용 모바일 셸을 만들 때 함께 이식하면 됨.

### 4. 원본 대비 구현 디테일
- 원본 dc.html은 "아이디 찾기"를 PT 화면번호(PT-AUTH-02~04) 밖의 참고용 시트로 표시하면서도 실제로 완전히 구현돼 있음 — 화면 번호가 없다고 생략하지 않고 `AcctFindScreen.tsx`로 그대로 포함(원본 mock 텍스트 "shop****45" 그대로 유지, customer-app의 "moto****23"과 다름).
- 콜센터 팝업(`CallCenterSheet.tsx`)은 바텀시트가 아니라 중앙 모달 — 원본 레이아웃 그대로(`display:flex;align-items:center;justify-content:center`). "전화 걸기" 버튼 클릭 시 원본 mock 로직이 `showToast`만 호출하고 시트를 닫지 않으므로, 모달이 열린 채로 토스트가 겹쳐 뜨는 것이 정상 동작 — 버그 아님(Playwright로 애니메이션 완료 후 상태를 캡처해 확인함, 최초 스크린샷 스크립트에서는 CSS 트랜지션 도중 캡처해 두 상태가 겹쳐 보이는 착시가 있었음).
- 비밀번호 찾기(PT-AUTH-03)는 고객앱 대비 "아이디" 입력 필드가 추가됨(계정을 먼저 특정한 뒤 휴대폰 인증) — 원본 상태 정의에 명시된 차이점.
- `useToast`의 자동 숨김 지연을 2200ms로 설정(customer-app의 2000ms와 다름) — 원본 dc.html의 `setTimeout(() => this.setState({ toast: '' }), 2200)`을 그대로 따름.

## 검증
- `tsc -b && vite build` 프로덕션 빌드 통과, `oxlint` 경고 0건.
- Playwright(이 세션에서 스크래치 디렉터리에 `--no-save`로 임시 설치, 캐시된 Chromium 브라우저 재사용 — 저장소에는 반영 안 됨)로 로그인→아이디찾기→로그인복귀→비밀번호찾기→비밀번호재설정 자동전환→완료 토스트→콜센터 팝업→전화걸기 토스트까지 전체 플로우 스크린샷 확인, 콘솔 에러 0건.

## 미해결/후속 확인 필요
- 파트너 홈(로그인 성공 후 랜딩 화면)이 아직 없어 `App.tsx`가 `AuthFlow`만 렌더링 — 로그인 성공 토스트("로그인되었어요. 파트너 홈으로 이동합니다")는 원본 mock 문구 그대로 유지했지만 실제 이동은 없음.
- 실제 API 연동, 파트너앱용 모바일(RN 웹뷰) 셸, 나머지 파트너앱 화면(업체관리·신차패키지 등)은 모두 후속 작업.

## 고객앱 ↔ 파트너앱 실제 전환 연결 (2026-07-26)

- 사용자 요청: customer-app 로그인 화면의 "시공업체이신가요? 파트너센터 로그인 ›" 링크를 토스트 플레이스홀더가 아니라 실제 partner-app 로그인 화면으로 전환되게 해달라는 요청.
- **두 앱의 dev 포트를 고정**: `apps/customer-app/vite.config.ts`에 `server:{port:5173}`, `apps/partner-app/vite.config.ts`에 `server:{port:5174}` 명시 추가(기존엔 둘 다 미지정 → 동시 실행 시 Vite가 자동으로 포트를 밀어 올려서 어느 앱이 몇 번인지 매번 달라짐, 하드코딩된 교차 링크가 불안정해짐). 이제 `npm run dev`만 각자 실행하면 항상 같은 포트로 뜸.
- `apps/customer-app/src/config.ts`(신규) — `PARTNER_APP_URL`을 `import.meta.env.DEV` 분기로 정의. 기존 `src/api/config.ts`의 `API_BASE_URL`(백엔드 서버 주소)과 같은 패턴이지만, 이건 백엔드가 아니라 "다른 프런트엔드 앱 주소"라 별도 파일로 분리(다른 성격의 설정을 같은 파일에 섞지 않음). 운영 URL은 아직 파트너앱이 배포되지 않아 플레이스홀더(`https://partner.motopay.example.com`) — `customer-mobile/src/config.ts`의 `WEB_URL` 플레이스홀더 선례와 동일한 방식.
- `LoginScreen.tsx`의 prop을 `onPartnerToast`(토스트만 띄우던 콜백) → `onOpenPartner`로 이름 변경(더 이상 토스트가 아니므로), `AuthFlow.tsx`에서 `window.location.href = PARTNER_APP_URL`로 실제 브라우저 이동시키도록 구현.
- **검증**: 두 dev 서버를 동시에 띄우고 Playwright로 고객앱 스플래시→로그인→"파트너센터 로그인 ›" 클릭 시 실제로 `http://localhost:5174`(파트너앱 로그인 화면, "파트너" 뱃지 확인)로 URL이 바뀌는 것까지 확인. 콘솔 에러 없음. `tsc -b && vite build` 통과.
- **반대 방향(파트너→고객)도 후속 요청으로 대칭 구현**: `apps/partner-app/src/config.ts`(신규)에 `CUSTOMER_APP_URL` 추가(dev: `localhost:5173`, prod: **실제 운영 값** `http://221.141.3.91:8090` — `customer-mobile/src/config.ts`의 `WEB_URL` prod 값과 동일한 실제 배포 서버, 가짜 플레이스홀더 아님). `LoginScreen.tsx`의 `onCustomerToast`(토스트) → `onOpenCustomer`로 이름 변경, `AuthFlow.tsx`에서 `window.location.href = CUSTOMER_APP_URL`로 이동. Playwright로 파트너앱 로그인→"고객앱 로그인 ›" 클릭→`localhost:5173`(고객앱 스플래시)로 전환 확인, 콘솔 에러 없음, `tsc -b && vite build` 통과.

## 파트너 홈 PT-HOME-01 구현 (2026-07-26)

### 출처
- 같은 claude_design 프로젝트의 `MotoPay 시공업체 홈.dc.html` → `design/source/MotoPay_시공업체_홈.dc.html`로 저장.

### 주요 결정
- **customer-app `HomeScreen.tsx`/`homeIcons.tsx`와 동일한 구조로 이식**: 상단 앱바(46px 상태바 아래 52px 고정) + 스크롤 바디(top 98px, bottom 66px) + 하단내비(66px) 레이아웃 문법, `useToast` 훅, 아이콘 컴포넌트 패턴(`IconProps.color`, SVG 인라인)까지 전부 동일한 컨벤션 재사용. 원본 dc.html 자체가 "고객앱 홈과 동일한 레이아웃 문법" 이라고 명시하고 있어 그대로 따름.
- **로그인 성공 시 실제로 Home 진입 연결**: 원본 mock은 로그인 버튼 클릭 시 `showToast('로그인되었어요. 파트너 홈으로 이동합니다', 'success')`만 하고 끝났는데, 이제 Home 화면이 생겼으므로 customer-app 스캐폴딩 때의 선례(로그인/홈 화면 첫 결선 시 "AuthFlow에 onAuthComplete 콜백 추가해 App.tsx가 실제로 HomeScreen 전환하게 함")를 그대로 따라 연결함. `AuthFlow`에 `onAuthComplete: () => void` prop 추가, `App.tsx`에 `loggedIn` state 추가 — customer-app의 `user` state와 동일한 조건부 렌더링 구조(`AppShell`은 로그인 후 분기에서 `App.tsx`가 감싸고, `AuthFlow`는 자체적으로 `AppShell`을 감싸는 것도 동일).
  - 이 과정에서 로그인 성공 토스트는 제거함(실제 화면 전환이 있으니 토스트로 성공을 알릴 필요가 없어짐 — customer-app의 실제 API 연동 로그인도 성공 시 토스트 없이 바로 `onAuthComplete` 호출).
- **`bidStats`의 "시공대기" 값 색상(`#0E9A96`)은 Cardoc 토큰에 없는 원본 전용 커스텀 컬러** — 스탯 타일 배경은 모두 동일한 `bg-gray-100`(sunken)이고 숫자 텍스트 색상만 달라지는 구조라, 이 값 하나만 Tailwind 화살괄호(`text-[#0E9A96]`)로 처리하고 나머지(착수대기/시공중/완료/신규요청/참여중)는 기존에 정의된 토큰 유틸리티(`text-accent-strong`/`text-brand`/`text-status-success`)를 그대로 재사용.
- **오늘의 시공 일정 상태 칩 3종**은 원본의 인라인 `statusMeta` 색상 조합이 이미 정의된 토큰 페어와 정확히 일치(방문예정=brand/brand-subtle, 시공중=accent-strong/accent-subtle, 완료=status-success/status-success-bg)라 별도 커스텀 컬러 없이 그대로 매핑.
- **`today` 날짜("2026.07.02")는 정적 mock 텍스트 그대로 유지**(실시간 날짜로 바꾸지 않음) — 이번 스코프가 "UI 프로토타입(Mock)"으로 확정돼 있어(로그인 화면 작업 때 사용자 확인), 원본 목업 값을 임의로 동적 로직으로 바꾸는 건 스코프를 벗어난 판단이라고 봄. 실제 데이터 연동 시 자연스럽게 교체될 지점.
- **`sectionItems`/`specDetail`은 캔버스 우측 설명 패널 전용 콘텐츠**(디자인 문서의 "홈 구성요소"/"화면 상세 정의" 메타 정보)라 실제 앱 화면에는 포함하지 않음 — customer-app 세션에서도 "QA용 화면목록 사이드바는 실제 화면 구성이 아니다"라는 이유로 제외했던 것과 동일한 판단.

### 검증
- `tsc -b && vite build` 통과, `oxlint` 경고 0건.
- Playwright로 로그인(아이디/비밀번호 입력 후 로그인)→홈 화면 진입(인사말 확인)→신차패키지 "완료" 스탯 탭(토스트 확인)→오늘 일정 "박지훈" 카드 탭(토스트 확인)→하단내비 "예약관리" 탭(토스트 확인)까지 스크린샷으로 확인, 콘솔 에러 0건.

### 미해결/후속 확인 필요
- 하단내비의 예약관리/정산/마이, 카드 "바로가기", 스탯 타일, 일정 카드 탭은 전부 토스트 플레이스홀더 — 실제 하위 화면(업체관리, 신차패키지 시공관리 목록, 정산 등)은 아직 없음.

## 로그인 실제 API 연동 + 최초 로그인 강제 비밀번호 변경 (2026-07-27)

- 사용자 요청으로 로그인이 UI 프로토타입(Mock)에서 실제 API 연동으로 전환됨 — 처음 이 화면들을 만들 때 "이번 스코프는 role-agnostic한 고객 `/auth/*` 재사용 가능"이라고 남겨뒀던 메모는 실제로는 사용 안 함: 검토 결과 신규 전용 `PartnerUser` 테이블 + `/partner-auth/*` API로 완전히 분리하는 쪽으로 결정함(사용자 확인). 백엔드 설계 근거·JWT realm 분리·마이그레이션 이슈 등 상세 내용은 `server/context-notes.md`("파트너(시공업체) 사용자 테이블 + 로그인 API" 섹션)에 정리, 여기서는 프론트 쪽 결정만 기록.
- `src/api/{config.ts,tokenStorage.ts,http.ts,partnerAuth.ts}` 신규 — customer-app의 동일 이름 파일들과 1:1 대응하는 패턴(같은 백엔드를 공유하므로 `config.ts`의 dev/prod URL도 customer-app과 동일한 값).
- `FirstLoginPwdChangeScreen.tsx`(신규) — 원본 dc.html에는 없던 화면(원본은 로그인 후 화면 자체가 없었음 — PT-HOME-01이 이번에 처음 연결됨). "최초 로그인 강제 변경"이라는 신규 요구사항을 위해 `PwdResetScreen.tsx`(비밀번호 찾기 흐름의 재설정 화면)와 같은 규칙-체크 UI를 재사용하되, ① BottomSheet가 아니라 전체화면(닫기 버튼 없음 — 건너뛸 수 없어야 하므로) ② "현재 비밀번호" 입력란과 "현재 비밀번호와 다르게 설정" 규칙을 추가한 별도 컴포넌트로 새로 작성(기존 `PwdResetScreen`은 비밀번호 찾기 흐름 전용으로 그대로 둠 — 토큰 기반 재설정과 인증된 상태의 현재비번 확인은 성격이 달라 억지로 합치지 않음).
- `AuthFlow.tsx`: 로그인 성공 시 서버 응답의 `mustChangePassword`를 보고 `screen` state를 `"login" | "firstLoginPwdChange"`로 분기. 강제변경 완료(`PATCH /partner-auth/me/password` 성공) 시에만 `onAuthComplete()` 호출 — 실패하면 화면에 그대로 머물고 에러 토스트만 표시.
- **검증 중 테스트 계정 원복 필요성 발견**: Playwright로 로그인→강제변경까지 실제로 수행하면 시드 계정(`shopowner01`)의 비밀번호와 `mustChangePassword`가 실제로 바뀌어버림 — 검증 끝난 뒤 시드 스크립트 문서값(`Initial1234!`, `mustChangePassword:true`)으로 다시 원복해둠. 앞으로 이 계정으로 다시 테스트할 때 이 문서와 실제 DB 상태가 어긋나지 않도록 항상 원복까지 세트로 할 것.

## 내 업체 관리 PT-PROF-01·02 API 연계 (2026-07-27)

- 사용자 요청: "내 업체 관리 메인 및 기본정보 관리 api 연계진행". 착수 전 디자인(`MotoPay 시공업체 업체관리.dc.html`, PT-PROF-01~08 8개 화면)을 먼저 열어 요청 범위(01·02)와 나머지(03~08)를 명확히 구분함. 백엔드(스키마 갭·API 설계) 상세 근거는 `server/context-notes.md`("내 업체 관리 메인·기본정보 관리 API 연계" 섹션) 참고, 여기는 프론트 결정만 기록.
- **로그아웃만 스코프 밖인데 실제로 구현**: 메인 화면 부가메뉴 3개(알림함/비밀번호변경/로그아웃) 중 앞의 둘은 새 화면이 필요해 토스트로 남겨뒀지만, 로그아웃은 같은 화면 안의 확인 모달(`LogoutConfirmModal.tsx`)만 있으면 완결되는 기능이라 실제로 구현함 — 이게 없으면 로그인 후 앱에서 나갈 방법이 아예 없어지는 실사용 결함이었음.
- **이 프로젝트 최초의 Textarea 프리미티브** 추가(`components/ui/Textarea.tsx`) — 소개글·인사말처럼 멀티라인 입력이 필요한 화면이 처음이라, Cardoc 디자인시스템 번들(`_ds_bundle.js`)에서 `Textarea.jsx` 소스를 직접 확인해 패딩·라운드·포커스링 값을 그대로 이식.
- 카테고리 토글 UI는 새 백엔드 엔드포인트 없이 `GET /common-codes/CAR_INST`(전체 카테고리 목록) + `GET /shops/me`의 `categories`(현재 활성 목록) 두 응답을 프론트에서 조합해 구성.
- "승인대기 중이에요" 배너는 실제 관리자 승인 워크플로우가 없어 저장 성공 시 세션 동안만 켜지는 순수 프론트 로컬 state(`basicSaved`)로 처리 — 가짜 백엔드 플래그를 만들지 않음.
- **검증 중 스크린샷 오판 사례**: 카테고리 칩 저장 결과를 스크린샷으로만 확인했을 때 PPF가 꺼진 것처럼 보였으나, DB를 직접 조회하니 실제로는 정확히 반영돼 있었음(스크린샷 색상 판독 오류) — 시각적 확인과 실제 데이터 조회가 다른 결론을 낼 수 있다는 걸 재확인, 애매하면 DB/API 응답을 직접 찍어보는 쪽이 더 신뢰할 수 있음.
- 테스트로 변경된 시드 데이터(카테고리·운영시간·계정 비밀번호)는 전부 문서값으로 원복.
