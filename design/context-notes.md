# 컨텍스트 노트 — 고객앱 시작(로그인/회원가입)

## 출처
- claude_design MCP 프로젝트 "MotoPay 프로토타입 설계" (projectId: bafa6465-bc6f-49fb-a696-bd359b381650)
- 파일: `MotoPay 시작 로그인 회원가입.dc.html` — 원본은 `.dc.html`(Cardoc 디자인문서 커스텀 엘리먼트 포맷)이라 React로 직접 포팅 불가. 상태 구조·문구·인터랙션만 참고해 React/TS/Tailwind로 재구현함.

## 주요 결정
- **스캐폴딩**: motopay_ptype에 기존 코드가 전혀 없어 신규로 `apps/customer-app`(Vite+React+TS) 생성. 프로그램목록표 v1.29의 소스파일명 컬럼을 그대로 디렉토리/파일명으로 사용(예: `apps/customer-app/src/screens/auth/LoginScreen.tsx`).
- **스타일링**: Tailwind CSS v4(`@tailwindcss/vite` 플러그인 방식, PostCSS 설정 아님). Cardoc 색상/타이포/스페이싱/라운드 토큰을 `src/index.css`의 `:root` + `@theme inline`으로 이식해 `bg-brand`, `text-status-danger` 등 유틸리티 클래스로 사용 가능하게 함.
- **범위**: 사용자 확인 결과 "UI 프로토타입(Mock 상태전환)"으로 한정. 실제 API 연동(`POST /auth/login` 등)은 이번 스코프 밖이며, 프로그램목록표의 "호출 API(대표)" 값은 화면 내 주석/설명으로만 참고.
- **CU-AUTH-08/09**: 원본 설계에서 이용약관·개인정보방침 보기가 동일한 `shViewDoc` 구조를 공유하므로, 공용 `DocViewSheet` 컴포넌트를 만들고 `TermsViewScreen`/`PrivacyViewScreen`이 각자 제목·본문만 넘겨 재사용(프로그램목록표상 파일은 분리되어 있어 두 래퍼 파일은 유지).
- **AuthFlow 컨테이너**: 13개 화면을 하나의 상태 머신(`screen` + `sheet`)으로 관리하는 `AuthFlow.tsx`를 추가(프로그램목록표에는 없는 파일). 원본 프로토타입의 "화면 목록" 사이드바와 동일한 취지로 QA 편의를 위해 포함.

## 미해결/후속 확인 필요
- 실 서비스 전환 시 SignupVerifyScreen/AcctFindScreen/PwdFindScreen의 목업 인증 로직(고정 이름 "홍길동", 고정 아이디 "moto****23")을 실제 본인인증 API 연동으로 교체 필요.
- Cardoc 브랜드 블루(#1B64F2)는 원본 토큰 파일 주석에 "실제 CI 블루 값 확인 필요"라고 명시돼 있어, 실제 배포 전 디자인팀 컨펌 필요.
- (수정됨) AuthFlow의 QA용 "화면 목록" 사이드바는 실제 화면 구성이 아니라는 피드백으로 삭제함. Cardoc 컴포넌트 번들 소스(Button/Input/Checkbox/Switch/ProgressSteps)를 직접 열어 대조하는 방식으로 다수의 스타일 버그(라운드 충돌, 버튼 variant/폭, 폰트 크기)를 발견·수정함 — 새 화면 작업 시에도 추측 대신 번들 소스 확인을 우선할 것.

---

# 컨텍스트 노트 — 고객앱 홈(CU-HOME-01)

## 출처
- 같은 claude_design 프로젝트의 `MotoPay 홈.dc.html`.
- 이미지 에셋 `assets/shop.png`, `assets/zic-m7.png`, `assets/car.png`도 같은 프로젝트에서 가져옴.

## 주요 결정
- **AppShell 분리**: AuthFlow와 HomeScreen이 동일한 반응형 "폰 프레임" 레이아웃(모바일 전체화면 / 데스크톱 420px 카드)을 필요로 해서 `src/components/AppShell.tsx`로 공용화. AuthFlow도 이 컴포넌트를 쓰도록 리팩터링함.
- **화면 간 연결**: 이전까지 로그인 성공·회원가입 완료 시 "(프로토타입 범위 외)" 토스트만 띄우고 끝났는데, Home이 생겼으므로 `AuthFlow`에 `onAuthComplete(name)` prop을 추가해 실제로 `App.tsx`가 `HomeScreen`으로 전환하도록 연결함. 로그인 성공 시에는 실제 인증이 없어 목업 이름 "홍길동"을 사용.
- **상태별 배너**: 원본은 우측 QA용 "상태" 전환 패널이 있었지만(이전 CU-AUTH 작업 때와 동일한 이유로) 실제 화면에는 넣지 않음. 대신 `HomeScreen`이 `banner?: 'default'|'bidding'|'complete'` prop(기본값 `'default'`)을 받도록 해서, 추후 실제 API 연동 시 서버 데이터로 그대로 넘길 수 있게 함.
- **car.png 손상**: DesignSync `get_file`이 응답을 256KB로 캡핑해서 `car.png`(원본 200KB+) 다운로드가 중간에 잘려 PNG가 깨짐(IEND 마커 없음). `shop.png`(39.7KB), `zic-m7.png`(147KB)는 캡 이내라 정상. 임시로 예약시공 카드의 차량 썸네일을 🚗 이모지로 대체함 — **실제 차량 사진 에셋을 다른 경로로 확보하면 교체 필요**.
- **Cardoc accent 토큰 누락**: 이번에 처음으로 프로모션 배너(오렌지 계열)를 구현하면서 `--orange-*`/`--color-accent*` 토큰이 `index.css`에 아직 없었다는 걸 발견. Tailwind 기본 `orange-*` 팔레트(다른 hex)를 그대로 쓸 뻔한 걸 잡아서 Cardoc 값으로 추가함. 향후 새 색상 카테고리를 쓸 때마다 `colors.css` 원본 토큰을 먼저 확인해서 색상별로 이런 누락이 없는지 체크할 것.

---

# 컨텍스트 노트 — 신차패키지(CU-NCPK-01~10)

## 출처
- 같은 claude_design 프로젝트의 `MotoPay 신차패키지.dc.html` → `design/source/MotoPay_신차패키지.dc.html`로 저장.
- 10개 화면(주화면~시공완료·인수확인)과 3개 팝업(틴팅농도/추가옵션/업체프로필)이 한 파일에 `sc-if` 분기로 모두 들어있는 구조. 각 화면의 상태·인터랙션은 파일 하단 `class Component extends DCLogic`의 `state`/`renderVals()`를 읽어 파악함.

## 주요 결정
- **NcpkFlow 컨테이너**: AuthFlow.tsx와 동일하게 화면(`screen`)·팝업(`sheet`) 상태를 하나의 컨테이너에 lift. 원본의 `class Component state`와 1:1 대응(tintLevels/tintOff/tintBase/tintPaid, addOpts, shopIndex, calY/calM/sel/time, pay/pointUse, handover).
- **테스트를 위한 진입점 연결**: 소스만 작성해서는 브라우저로 확인할 방법이 없어, `App.tsx`에 `view: "home"|"ncpk"` 상태를 추가하고 HomeScreen의 신차패키지 배너/인수확인 버튼에서 진입하도록 연결(판단 하에 진행, 원본 디자인의 시각 요소는 변경 없음). 이후 사용자 요청으로 인수확인 버튼은 신차패키지 메인이 아니라 CU-NCPK-10으로 바로 진입하도록 `initialScreen` prop을 추가함.
- **원본 프로토타입의 "목업 로직" 함정**: 틴팅 농도 선택 화면에서 "전체 일괄 적용" 토글이 시각적으로만 존재하고 실제로는 항상 전체 적용되는(단일 `tintLvl` state) 원본 로직을 그대로 포팅했다가, 실제 요구사항(토글 off 시 부위별 독립 선택)과 다르다는 피드백을 받아 `tintLevels: Record<position, level>`로 상태 모델을 바꿈. Cardoc `.dc.html`은 토글이 있어도 실제 분기 로직이 없는 경우가 있으므로 프로그램목록표의 인터랙션 설명과 대조 필요.
- **기본/유상 품목 상호배타**: 프로그램목록표에는 명시되어 있지 않았지만 사용자 요청으로 썬팅 기본 품목 선택 시 고객부담 품목을 "없음"으로, 반대로 유상 품목 선택 시 기본 품목을 "선택 안 함"(공란)으로 서로 초기화하도록 추가.
- **재동기화 워크플로**: "디자인이 업데이트됐다"는 요청이 오면 `/design-sync` 스킬이 아니라 DesignSync `get_file`로 같은 경로를 다시 받아 이전 스크래치 사본과 `diff`, 변경분만 해당 화면 컴포넌트에 반영하는 방식 사용(전체 재작성 안 함). CU-NCPK-10에 "시공 정보 요약 카드"(`svcCar`/`svcVin`/`svcItems`)가 추가된 걸 이 방식으로 확인·반영.

## 미해결/후속 확인 필요
- CU-NCPK-02의 "농도 선택 · 전면 15% 외" 요약 문구는 원본처럼 정적 텍스트라 실제 부위별 선택값(CU-NCPK-03)과 연동되지 않음 — 실제 데이터 연동 시 동적으로 바꿀지 확인 필요.
- 블랙박스/유리막 코팅의 "업그레이드 옵션" 드롭다운은 원본과 동일하게 비인터랙티브(정보 표시만) 상태로 남겨둠 — 썬팅 항목처럼 실제 드롭다운 상호작용이 필요한지 확인 필요.

## 서버 모듈 이전 목업 데이터 분리 (2026-07-21)

- 사용자 요청: 썬팅 기본품목/고객부담품목 데이터를 실제 서버 모듈 작성 전에 JSON 파일로 미리 분리해두고 싶다는 요청.
- **위치**: `apps/customer-app/src/data/tintOptions.json` (프로젝트 루트 `/data`가 아님) — `tsconfig.app.json`의 `include: ["src"]`와 Vite dev 서버의 파일시스템 접근 범위가 앱 루트(`apps/customer-app`) 기준이라, 루트에 두면 타입체크·dev 서버 양쪽에 추가 설정이 필요해져서 회피함.
- **파일 구조**: `{ base: [...], paid: [...] }` 1개 파일로 통합(2개 분리안도 제시했으나 사용자가 통합안 선택). 나중에 API가 기본품목/고객부담품목을 별도 엔드포인트로 나눠 제공하게 되면 그때 분리하면 됨.
- **바인딩 방식**: Vite/TS 정적 JSON import(`import tintOptions from "../../data/tintOptions.json"`) 사용, `TintBaseKey`/`TintPaidKey` 유니언 타입으로 캐스팅. 런타임 `fetch()` 방식은 로딩/에러 상태가 필요해 이 단계에서는 과함 — 나중에 실제 API 연동 시 이 import 한 줄만 교체하면 되는 구조.
- **tsconfig 변경**: `tsconfig.app.json`에 `"resolveJsonModule": true` 추가(기존엔 없어서 JSON import 시 타입 에러 발생).
- `MyPkgCfmScreen.tsx`의 `BASE_DEFS`/`PAID_DEFS` 하드코딩 배열을 이 JSON import로 교체. 로직(상호배타 등)은 변경 없음.
- 이어서 CU-NCPK-04 추가옵션(`AddOptScreen.tsx`)도 동일한 방식으로 `src/data/addOptions.json`에 분리. `id`/`onToggleOpt`가 이미 `string` 기반이라 타입 캐스팅 이슈 없이 바로 적용됨(틴팅 쪽과 달리 좁은 유니언 타입이 없었음).
- **해결**: `ncpTypes.ts`의 `TintBaseKey`/`TintPaidKey`를 좁은 유니언(`"glasstint"|"luma300"` 등)에서 `string`으로 widen함. 실제 옵션 집합의 소스오브트루스가 `tintOptions.json`(추후 API)이라 컴파일타임 유니언으로 고정해두는 게 오히려 데이터-타입 드리프트를 유발했음. `MyPkgCfmScreen.tsx`/`NcpkFlow.tsx`의 `as` 캐스팅·상태 타입은 코드 변경 없이 그대로 유지(타입이 넓어졌을 뿐). `"none"` 같은 매직 스트링 비교 로직도 그대로 동작.
- `addOptions.json`에 항목(`wash`, 신차 세차 지원)을 사용자가 직접 추가 — `AddOptScreen.tsx`는 애초에 `id: string` 기반이라 코드 변경 없이 바로 반영됨.
