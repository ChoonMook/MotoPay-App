# 고객앱 시작(로그인/회원가입) CU-AUTH-01~13 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 시작 로그인 회원가입.dc.html`) 가져와 `design/source/`에 저장
- [x] Cardoc 디자인시스템 토큰(colors, typography, spacing, radius) 확인 및 `apps/customer-app/src/index.css`에 이식
- [x] Pretendard 폰트 로컬 복사 및 @font-face 등록
- [x] apps/customer-app Vite+React+TS 스캐폴딩 생성
- [x] Tailwind CSS v4(@tailwindcss/vite) 설정
- [x] 공용 UI 프리미티브: Button, Input, Checkbox, Switch, ProgressSteps, BottomSheet
- [x] CU-AUTH-01 StartLoginSignupScreen (스플래시)
- [x] CU-AUTH-02 LoginScreen (로그인 + SNS 4종)
- [x] CU-AUTH-03 PwdFindScreen (비밀번호 찾기)
- [x] CU-AUTH-04 PwdResetScreen (비밀번호 재설정, 규칙 체크)
- [x] CU-AUTH-05 SignupVerifyScreen (실명인증)
- [x] CU-AUTH-06 SignupInfoScreen (정보입력)
- [x] CU-AUTH-07 SignupTermsScreen (약관동의)
- [x] CU-AUTH-08 TermsViewScreen / CU-AUTH-09 PrivacyViewScreen (DocViewSheet 공용)
- [x] CU-AUTH-10 MktgViewScreen (마케팅 수신 동의)
- [x] CU-AUTH-11 SignupDoneScreen (가입완료)
- [x] CU-AUTH-12 AcctFindScreen (아이디 찾기)
- [x] CU-AUTH-13 SnsLinkConfirmScreen (SNS 계정 연결)
- [x] AuthFlow 컨테이너로 13개 화면 상태 전환 연결 (QA용 화면목록 사이드바는 실제 화면 구성이 아니라는 피드백으로 제거)
- [x] "파트너센터 로그인 ›" 링크를 토스트 플레이스홀더에서 `apps/partner-app`(신규)로의 실제 브라우저 이동(`window.location.href`)으로 연결 (2026-07-26, `partner/context-notes.md` 참고)
- [x] 색상 토큰 순환 참조 버그 수정 (`--color-brand` 등이 자기 자신을 참조해 무효화되던 문제)
- [x] Button/Input radius를 원본 스펙(버튼·인풋 8px, 카드 12px, 시트 20px)에 맞게 수정
- [x] SNS 아이콘을 실제 SVG(카카오/네이버/Gmail/Apple)로 통일 (`snsIcons.tsx` 공용화), Gmail만 테두리
- [x] 버튼 variant를 원본 상태정의(`variant:'outline'|'secondary'|'primary'`)와 1:1 대조해 전수 수정
- [x] 원본 `.dc.html` 전체 13개 섹션을 라인 단위로 대조해 폰트 크기·spacing·margin을 정밀 수정
- [x] 실명인증 목업 데이터를 원본과 동일하게 수정 (홍길동/1990.05.21/010-1234-5678), 정보입력 화면의 이름·연락처 필드를 disabled로 수정
- [x] 정보입력 화면에 원본과 동일한 이메일/비밀번호 정규식 검증, 아이디 3단계 안내 문구, helperText 추가
- [x] 약관 전문(이용약관/개인정보처리방침) 본문을 원본 정확한 텍스트로 교체
- [x] OTP 인증번호 카운트다운 타이머(180초) 추가 (`useOtpTimer` 공용 훅, 아이디찾기·비밀번호찾기·실명인증 3곳에 적용)
- [x] tsc -b 타입체크 통과
- [x] vite build 프로덕션 빌드 통과
- [ ] 브라우저 수동 QA (dev 서버는 기동 확인만 함, 실제 클릭 플로우 시각 검증은 미수행)
- [ ] 실제 API 연동 (이번 스코프는 UI 프로토타입/Mock 상태전환으로 한정, 사용자 확인됨)

## 고객앱 홈 CU-HOME-01 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 홈.dc.html`) 가져와 `design/source/`에 저장
- [x] 이미지 에셋(shop.png, zic-m7.png) 다운로드 및 로컬 복사 — car.png는 최초 도구 응답 256KB 캡에 걸려 손상됐으나, 사용자가 Downloads/car.png로 정상본을 제공해 교체 완료
- [x] Cardoc accent(오렌지) 컬러 토큰 누락분(`--orange-*`, `--color-accent*`) index.css에 추가
- [x] HomeScreen.tsx(상태바·앱바·인사말·상태별 배너 3종·빠른메뉴·예약시공 진행현황·프로모션·하단내비) 구현
- [x] homeIcons.tsx로 하단내비 4종 + 빠른메뉴 4종 아이콘 원본 SVG 그대로 이식
- [x] AppShell 공용 레이아웃으로 AuthFlow/HomeScreen 반응형 래퍼 중복 제거
- [x] AuthFlow의 로그인 성공·회원가입완료 → HomeScreen 전환 실제 연결 (그동안 "프로토타입 범위 외" 플레이스홀더였던 부분)
- [x] tsc -b 타입체크 통과 / vite build 통과
- [x] Playwright로 배너 3종 상태 각각 스크린샷 확인
- [x] car.png 정상본(Downloads/car.png) 확보 및 교체 완료
- [x] HomeScreen의 3개 배너를 상태 전환이 아닌 순서대로(기본→시공완료→견적도착) 항상 노출하도록 변경 (사용자 요청)
- [x] 로그인 성공 시 목업 자격증명(user/1234) 검증 후에만 HomeScreen 랜딩, 그 외엔 에러 토스트

## 공용 Toast 컴포넌트 갱신

- [x] Cardoc 디자인시스템 번들에서 갱신된 Toast 컴포넌트(`components/feedback/Toast.jsx`) 재확인
- [x] `--status-warning`/`--status-warning-bg` 토큰 누락분 index.css에 추가 (Toast의 warning tone에 필요)
- [x] `src/components/ui/Toast.tsx` 신규 작성 — tone(default/success/warning/danger)별 아이콘 도트, inline-flex 알약형(max-width 360px), rounded-xl(12px), shadow-lg
- [x] AuthFlow.tsx / HomeScreen.tsx의 개별 toast 마크업(전체 너비 바 형태)을 새 Toast 컴포넌트로 교체 — 중앙 정렬된 알약형으로 시각적으로 달라짐
- [x] tsc -b / vite build 통과, Playwright로 auth·home 양쪽 렌더링 확인
- [x] `showToast(msg)`가 tone을 받지 않아 항상 default(아이콘 없음)로만 뜨던 버그 수정 — `src/components/ui/useToast.ts` 공용 훅으로 통합하며 `tone` 파라미터 추가
- [x] 완료성 액션에 success, 로그인 실패에 danger tone 지정: 인수확인하기·비밀번호 재설정·SNS 계정연결(success), 로그인 실패(danger). 순수 네비게이션성 토스트는 default 유지
- [x] Playwright로 success(초록 체크)·danger(빨강 느낌표) 아이콘 노출 확인

## 신차패키지 CU-NCPK-01~10 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 신차패키지.dc.html`) 가져와 `design/source/`에 저장
- [x] CU-NCPK-01 PkgScreen (주화면 - 진행중 예약 카드 + 플로우 소개 + 하단내비)
- [x] CU-NCPK-02 MyPkgCfmScreen (보유 패키지 확인 - 차량정보 + 시공항목 + 업그레이드)
- [x] CU-NCPK-03 TintLvlSelScreen (틴팅 농도 선택 팝업, `screens/ncp/mypkgcfm/`)
- [x] CU-NCPK-04 AddOptScreen (추가옵션 팝업)
- [x] CU-NCPK-05 PtnSelScreen (시공업체 선택)
- [x] CU-NCPK-06 CoProfScreen (업체 프로필 팝업)
- [x] CU-NCPK-07 CstSchedRsvScreen (시공 일정 예약 - 달력/시간대)
- [x] CU-NCPK-08 UpgDiffPayScreen (업그레이드 차액 결제)
- [x] CU-NCPK-09 RsvCfmScreen (예약 확정)
- [x] CU-NCPK-10 CstDoneHandoverScreen (시공완료·인수확인)
- [x] NcpkFlow 컨테이너로 10개 화면 + 3개 팝업 상태 전환 연결 (AuthFlow.tsx와 동일 패턴)
- [x] App.tsx에 `view`/`ncpkEntryScreen` 상태 추가해 HomeScreen 배너(→main)·인수확인 버튼(→handover)에서 각각 진입점 다르게 연결
- [x] tsc -b 타입체크 통과 / vite build 통과
- [x] Playwright로 전체 플로우(로그인→신차패키지→보유패키지확인→틴팅농도→추가옵션→업체선택→프로필→일정예약→결제→확정→인수확인) 스크린샷 확인
- [x] 버그 수정: 틴팅 농도 선택에서 "전체 일괄 적용" off 시 부위별 독립 선택 안 되던 문제 (`tintLvl` 단일값 → `tintLevels` 부위별 Record로 교체)
- [x] 기능 추가: 썬팅 기본 품목/고객부담 품목 상호배타 처리 (한쪽 선택 시 반대쪽 자동 초기화)
- [x] 디자인 재동기화: CU-NCPK-10에 "시공 정보 요약 카드"(시공 차량·VIN·품목별 기본/업그레이드 태그) 추가분 반영
- [x] 서버 모듈 이전 단계: 썬팅 기본품목/고객부담품목 데이터를 `src/data/tintOptions.json`으로 분리, `resolveJsonModule` 활성화 후 정적 import로 바인딩
- [x] 서버 모듈 이전 단계: CU-NCPK-04 추가옵션 데이터를 `src/data/addOptions.json`으로 동일한 방식으로 분리

## 포인트 CU-PNT-01,02,06,07 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 포인트.dc.html`) 가져와 `design/source/`에 저장
- [x] `uploads/MotoPay_프로그램목록표_v1_36.xlsx`에서 CU-PNT-01/02/06/07 소스파일명 확인 (`screens/point/*`)
- [x] CU-PNT-01 PtScreen (주화면 - 보유포인트·등급 히어로 + 충전/내역/등급혜택 메뉴 + 최근 내역 + 하단내비)
- [x] CU-PNT-02 PtChargeAmtSelScreen (충전 금액선택 - 금액칩 4종/기타금액 + 결제수단 선택 + 결제하기)
- [x] CU-PNT-06 PtHistScreen (내역조회 - 잔액 요약 + 유형 필터 4종 + 내역 리스트)
- [x] CU-PNT-07 GradeBenefitScreen (등급혜택 - 현재등급 히어로 실적 프로그레스 + 등급별 혜택 비교 카드 3종)
- [x] PointFlow 컨테이너로 4개 화면 상태 전환 연결 (RsvFlow.tsx와 동일 패턴), 뒤로가기 헤더는 `common/CommonHeader.tsx` 재사용
- [x] App.tsx에 `view="point"` 추가, HomeScreen 빠른메뉴 "포인트" 타일을 실제 진입점으로 연결 (기존 토스트 플레이스홀더 → onOpenPoint)
- [x] 원본 dc.html의 카드결제(CU-PNT-03)/무통장입금(CU-PNT-04)/포인트사용(CU-PNT-05) 화면은 프로그램목록표상 삭제/병합되어 별도 화면 없음 — 결제수단 상관없이 결제하기 탭 시 즉시 적립 처리(인라인 PG 시뮬레이션)로 구현, 원본 JS의 해당 분기 로직도 동일하게 즉시 적립으로 단순화되어 있음을 확인
- [x] tsc -b 타입체크 통과 / vite build 통과 / oxlint 통과(신규 경고 없음)
- [x] Playwright로 전체 플로우(홈→포인트→충전금액선택→결제→내역조회 자동이동→필터→등급혜택) 스크린샷 확인, 콘솔 에러 없음

## 쇼핑몰 CU-SHOP-01~12 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 쇼핑몰.dc.html`) 가져와 `design/source/`에 저장
- [x] `uploads/MotoPay_프로그램목록표_v1_37.xlsx`에서 CU-SHOP-01~12 소스파일명 확인(v1.36→v1.37 업데이트분, `screens/shop/*`)
- [x] 캔버스-프로그램목록표 구조 불일치 4건을 사용자에게 확인 받아 결정: ① 검색(10)·카테고리목록(02) 화면을 프로그램목록표대로 `ProdSearchCatScreen.tsx` 1개로 통합, ② 배송지선택 1개 화면을 `AddrChgScreen`(팝업)+`NewAddrInputScreen`(등록화면) 2개로 분리, ③ 캔버스에 없는 배송완료확인(09)·취소반품신청(10) 화면을 프로그램목록표 스펙대로 신규 구현, ④ 프로그램목록표엔 없지만 캔버스에 완성돼 있던 찜 목록 화면도 추가 스코프로 함께 구현
- [x] CU-SHOP-01 ShopScreen (주화면 - 프로모션배너·카테고리바로가기·베스트상품그리드·하단내비, 헤더에 찜·검색·장바구니 아이콘)
- [x] CU-SHOP-02 ProdSearchCatScreen (검색창+최근/인기검색어+카테고리칩+정렬칩+상품리스트 통합화면)
- [x] CU-SHOP-03 ProdDtlScreen (상품상세 - 이미지캐러셀·가격·옵션시트·수량스테퍼·설명·스펙·리뷰, 장바구니담기/바로구매)
- [x] CU-SHOP-04 CartScreen (장바구니 - 전체선택·수량조절·삭제, 선택상품만 합산)
- [x] CU-SHOP-05 OrderPayScreen (주문/결제 - 배송지카드·포인트사용·쿠폰시트·결제수단, RSVC/NCPK 결제화면과 동일 패턴)
- [x] CU-SHOP-06 orderpay/AddrChgScreen (배송지 변경, 바텀시트) / CU-SHOP-07 orderpay/NewAddrInputScreen (새 배송지 입력, 풀스크린)
- [x] CU-SHOP-12 OrderDoneScreen (결제완료 - 그린 히어로 + 주문요약 + 배송준비 안내)
- [x] CU-SHOP-08 OrderHistScreen (주문내역 - 상태뱃지 3종)
- [x] CU-SHOP-11 OrderDtlScreen (주문상세/배송조회, `OrderTimeline.tsx` 공용 컴포넌트로 09와 공유)
- [x] CU-SHOP-09 orderhis/DlvDoneCfmScreen (배송완료 확인 - 구매확정/취소반품 선택, 캔버스에 없어 프로그램목록표 스펙 기반 신규 설계)
- [x] CU-SHOP-10 orderhis/CancelReturnApplyScreen (취소·반품 신청 팝업 - 사유선택+상세사유, 신청 후 CU-MYPG-11(마이페이지, 미구현)로 가야 하나 아직 없어 주문내역으로 복귀)
- [x] WishScreen (찜 목록, 프로그램목록표엔 없으나 캔버스 설계 재사용 - ShopScreen 헤더에 하트 아이콘 진입점 신규 추가해 실제 도달 가능하게 함)
- [x] ShopFlow 컨테이너로 12개 화면+찜목록 상태 전환 연결 (RsvFlow.tsx와 동일 패턴)
- [x] App.tsx에 `view="shop"` 추가, Home/RSVC(BookingScreen)/Point(PtScreen) 하단내비 "쇼핑몰" 탭을 모두 실제 진입점으로 연결(기존엔 토스트 플레이스홀더)
- [x] `common/ReviewWriteScreen.tsx`에 `title`/`ctaLabel` prop 추가(기존 "후기 작성"/"후기 등록하기" 기본값 유지, RSVC/NCPK 호출부 무변경) — 쇼핑몰은 원본 캔버스 문구인 "리뷰 작성"/"리뷰 등록하기"를 전달해 재사용
- [x] tsc -b 타입체크 통과 / vite build 통과 / oxlint 통과(신규 경고 없음)
- [x] Playwright로 전체 플로우(홈→쇼핑몰→카테고리→검색→상세→옵션선택→장바구니담기→장바구니→주문/결제→배송지변경→새배송지입력·저장→쿠폰적용→결제→결제완료→주문내역→배송조회(진행중 주문)→배송완료확인→구매확정→리뷰작성→찜토글→찜목록) 스크린샷 확인, 콘솔 에러 없음

## 마이페이지 CU-MYPG-01~15 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 마이페이지.dc.html`) 가져와 `design/source/`에 저장
- [x] `uploads/MotoPay_프로그램목록표_v1_37.xlsx`에서 CU-MYPG-01~15(15개 행, 10은 누락) 소스파일명 확인
- [x] 프로그램목록표 자체 데이터 이슈 2건을 사용자 확인 없이 판단(단순 표기 오류로 판단, 디자인/UX 결정 아님): ① CU-MYPG-10(쇼핑몰 주문내역) 행 누락 → 다른 화면들의 URL/파일명 패턴(`/myp/cancel-return-hist`→`CancelReturnHistScreen.tsx`)에 맞춰 `/myp/shop-order-hist`→`ShopOrderHistScreen.tsx`로 추론, ② CU-MYPG-15 소스파일명이 `screens/mypage/SnsLinkManageScreen.tsx`로 다른 14개 화면(전부 `screens/myp/*`)과 다른 폴더명 → 표기 오류로 판단해 `screens/myp/SnsLinkManageScreen.tsx`로 통일
- [x] 캔버스 prose(화면 상세 정의)와 실제 렌더 불일치 3건은 기존 세션 선례(RSVC-18 CTA 사례)대로 실제 렌더를 신뢰해 구현: 마이페이지 홈의 "혜택(쿠폰함)" 퀵메뉴/퀵메뉴 아이콘 행(prose에만 존재, 렌더 없음), CU-MYPG-06 "신차패키지/예약시공 필터 탭"(prose에만 존재), CU-MYPG-11 "신청건 탭 시 타임라인 인라인 확장"(prose에만 존재, 카드에 onClick 자체가 없음)
- [x] CU-MYPG-01 MyPageScreen (주화면 - 프로필 히어로(이름·등급·대표차량)·차량/이용내역/알림/계정 메뉴 그룹·하단내비)
- [x] CU-MYPG-02 MyCarListScreen (내 차량 목록 - 대표차량/딜러사구매 뱃지)
- [x] CU-MYPG-03/04 mycarlis/CarRegScreen·CarEditScreen (차량 등록·수정 - 원본 dc.html도 하나의 화면 상태(isCarEdit)로 다루므로 CarRegScreen을 실제 구현체로 하고 CarEditScreen은 재수출 파일로 처리, 프로그램목록표의 파일 2개 요구사항은 만족)
- [x] CU-MYPG-05 mycarlis/DfltCarSetScreen (대표차량 지정, 바텀시트)
- [x] CU-MYPG-06 CstHistScreen (시공내역) / CU-MYPG-07 NotiCfgScreen (알림 설정, 5종 독립 토글)
- [x] CU-MYPG-08 MyInfoChgScreen (내 정보 변경) / CU-MYPG-09 PwdChgScreen (비밀번호 변경)
- [x] CU-MYPG-10 ShopOrderHistScreen (쇼핑몰 주문내역, 프로그램목록표 누락행 추론 구현) / CU-MYPG-11 CancelReturnHistScreen (취소·반품 내역)
- [x] CU-MYPG-12 NotiInboxScreen (알림함, 안읽음 점 표시+읽음 처리) / CU-MYPG-13 LogoutConfirmScreen (로그아웃, 바텀시트)
- [x] CU-MYPG-14 AcctWithdrawScreen (회원 탈퇴 - 사유선택+동의+최종확인 팝업. 최종확인 팝업은 프로그램목록표에 별도 화면ID가 없어 이 화면 파일에 인라인 구현)
- [x] CU-MYPG-15 SnsLinkManageScreen (연결된 SNS 관리, myp/ 폴더로 교정)
- [x] MypFlow 컨테이너로 15개 화면 상태 전환 연결 (RsvFlow.tsx와 동일 패턴)
- [x] **실제 기능 연동(캔버스는 토스트로만 시연하던 부분을 진짜로 구현)**: 로그아웃/회원탈퇴가 실제로 App.tsx의 로그인 상태(`userName`)를 초기화해 로그인 화면으로 복귀; 내 정보 변경에서 이름 저장 시 App.tsx의 `userName`까지 갱신되어 홈 화면 인사말에도 즉시 반영; 마이페이지 진입 시 로그인한 실제 이름(`userName`)을 프로필 초기값으로 사용(테스트 로그인 시 "홍길동"이라 캔버스 목업과 우연히 일치)
- [x] **쇼핑몰↔마이페이지 크로스플로우 연동**: 지난 세션에 미해결로 남겨뒀던 "CU-SHOP-10(취소·반품 신청) 완료 시 CU-MYPG-11로 이동해야 하나 당시엔 화면이 없어 주문내역으로 복귀시켰던" 항목을 이번에 CU-MYPG-11이 만들어지면서 실제로 연결함 — `ShopFlow`에 `onCancelReturnSubmitted` prop 추가, `App.tsx`가 `view="myp"` + `mypEntryScreen="cancelhist"`로 라우팅(NcpkFlow의 `initialScreen` 선례와 동일 패턴)
- [x] App.tsx에 `view="myp"` 추가, Home/RSVC(BookingScreen)/Shop(ShopScreen) 하단내비 "내 정보" 탭을 실제 진입점으로 연결(Point는 원본 설계상 이미 "내 정보" 탭이 active 처리돼 있어 추가 연결 불필요)
- [x] tsc -b 타입체크 통과 / vite build 통과 / oxlint 통과(신규 경고 없음)
- [x] Playwright로 전체 플로우(홈→내정보→차량목록→대표차량 재지정→차량등록→차량수정·삭제→시공내역→쇼핑몰주문내역→취소반품내역→알림함 읽음처리→알림설정 토글→내정보변경(이름변경, 홈 인사말 반영 확인)→비밀번호변경→SNS연결관리→로그아웃(로그인 화면 복귀 확인)) 및 별도로 (쇼핑몰에서 상품구매→취소반품신청→마이페이지 취소반품내역으로 딥링크) 스크린샷 확인, 콘솔 에러 없음

## 고객센터 CU-CS-01~05 구현 체크리스트

- [x] claude_design MCP로 원본 프로토타입(`MotoPay 고객센터.dc.html`) 가져와 `design/source/`에 저장
- [x] `uploads/MotoPay_프로그램목록표_v1_37.xlsx`에서 CU-CS-01~05(5개 행, 캔버스와 1:1로 정확히 일치, 구조 불일치 없음) 소스파일명 확인
- [x] CU-CS-01 CSScreen (주화면 - "무엇을 도와드릴까요?" 히어로 + FAQ·1:1문의등록·문의처리현황 메뉴 카드 3종 + 전화상담 안내)
- [x] CU-CS-02 FaqScreen (FAQ 조회 - 카테고리 칩 5종 + Q&A 아코디언, 카테고리 필터 시 즉시 재필터링, 미해결 시 1:1문의 링크)
- [x] CU-CS-03 InquiryRegScreen (1:1 문의 등록 - 유형 칩 5종, 제목·내용 입력, 사진첨부 자리(비기능), 제목·내용 모두 입력 시에만 등록 버튼 활성화)
- [x] CU-CS-04 InquiryProcStatScreen (문의 처리현황 조회 - 답변대기/답변완료 배지, 최신순 정렬, 문의하기 버튼)
- [x] CU-CS-05 InquiryDtlScreen (1:1 문의 상세 - 답변완료 시 강조 답변 박스, 답변대기 시 "1~2영업일 이내 답변" 안내)
- [x] CsFlow 컨테이너로 5개 화면 상태 전환 연결 (RsvFlow.tsx와 동일 패턴), 문의 등록 시 목록에 실제로 추가되고 처리현황 화면으로 자동 이동
- [x] **원본 캔버스에 없던 뒤로가기 버튼을 CSScreen(01) 헤더에 추가**: 원본은 디자인 툴의 화면목록 사이드바로만 진입/이탈했고 이 모듈 안에 하단내비도 없어, 실제 앱에 통합하면 마이페이지로 돌아갈 방법이 전혀 없는 상태였음(기능적 필요에 의한 최소 추가이며 시각 디자인 변경은 아님) — CU-MYPG-01 프로그램목록표 자체의 화면 상세 정의에도 "고객센터는 별도 모듈(CU-CS-01)로 이동"이라는 인터랙션이 이미 명시돼 있어 마이페이지→고객센터 진입 자체는 원래 설계 의도와 일치함
- [x] `MyPageScreen.tsx`에 "고객지원" 섹션 신설, "고객센터" 메뉴 행 추가(위 프로그램목록표 상세정의 근거로 사용자 확인 없이 진행), `MypFlow.tsx`에 `onOpenCs` prop 추가
- [x] `App.tsx`에 `view="cs"` 추가, `CsFlow`의 뒤로가기(`onExit`)는 홈이 아닌 마이페이지로 복귀하도록 연결(고객센터는 마이페이지 하위 모듈이므로 RSVC/쇼핑몰 등 최상위 모듈과 달리 홈으로 나가지 않음)
- [x] tsc -b 타입체크 통과 / vite build 통과 / oxlint 통과(신규 경고 없음)
- [x] Playwright로 전체 플로우(홈→내정보→고객센터→FAQ(카테고리 필터·아코디언 펼침)→FAQ 하단 "1:1 문의" 링크로 문의등록 진입→유형선택·제목·내용 입력 후 등록→문의처리현황 목록에 반영 확인→기존 답변완료 문의 상세(답변 박스)→답변대기 문의 상세(안내문구)→뒤로가기로 고객센터·마이페이지 순차 복귀) 스크린샷 확인, 콘솔 에러 없음

## 마이페이지 design-sync 재동기화 · CU-MYPG-16 보유 쿠폰함 신규 구현

- [x] `MotoPay 마이페이지.dc.html` 재fetch 후 로컬 사본과 diff — CU-MYPG-16(보유 쿠폰함) 화면 1개 신규 추가만 확인, 기존 01~15 화면은 변경 없음(구조 불일치 없는 순수 추가)
- [x] `uploads/MotoPay_프로그램목록표_v1_38.xlsx`(v1.37→v1.38 업데이트분)에서 CU-MYPG-16 행 확인 — 소스파일명 `apps/customer-app/src/screens/myp/CpnBoxScreen.tsx`, URL `/myp/coupon`. 특수처리 비고에 "쿠폰함(구 CU-CPN-01)·발급사용내역조회(구 CU-CPN-03) 통합, 마이페이지로 이동(2026-07-20)" 명시 — 별도 CU-CPN 모듈 없이 마이페이지 하위 화면으로 확정
- [x] `design/source/MotoPay_마이페이지.dc.html` 로컬 사본을 최신본으로 교체
- [x] `mypData.ts`에 `CouponItem`/`CouponStatus`/`CouponIssuer` 타입과 `COUPON_DEFS`(5건: 운영사 3·딜러사 2, 사용가능 3·사용완료 1·만료 1), `COUPON_STATUS_META`, `COUPON_ISSUER_META`, `COUPON_TAB_DEFS` 추가
- [x] `CpnBoxScreen.tsx`(CU-MYPG-16) 신규 작성 — 사용가능/사용완료/만료 필터 탭, 발행주체(운영사/딜러사)·상태 배지, 점선 구분선 아래 유효기간·할인액 표시, 사용완료·만료 카드는 opacity 0.6 톤다운, 0건 시 "해당 쿠폰이 없어요" 빈 상태
- [x] 원본 캔버스 화면 상세정의는 "쿠폰 탭 시 상세(유효기간·사용조건) 확인" 인터랙션을 언급하지만 실제 카드 엘리먼트에 `onClick`이 없어(RSVC-18·마이페이지 06/11 때와 동일한 prose-vs-render 불일치 패턴) 조회 전용 정적 카드로 구현
- [x] `MyPageScreen.tsx` "이용내역" 섹션에 "보유 쿠폰함" 메뉴 행 추가(취소·반품 내역 다음 순서, 캔버스의 `menuSections` 순서와 동일). `mypTypes.ts`의 `MypScreenId`에 `"couponbox"` 추가. `MypFlow.tsx`에 `couponFilter` 상태와 화면 라우팅 추가
- [x] tsc -b 타입체크 통과 / vite build 통과 / oxlint 통과(신규 경고 없음)
- [x] Playwright로 마이페이지→보유 쿠폰함 진입, 사용가능/사용완료/만료 탭 전환 시 각 탭에 맞는 쿠폰만 노출되는지, 뒤로가기로 마이페이지 복귀까지 확인, 콘솔 에러 없음

## 홈 빠른메뉴(쿠폰함·주문내역·고객센터) 실제 진입점 연결

- [x] `HomeScreen.tsx` QUICK_MENU 4종 중 "포인트"만 실제 연결돼 있었고 나머지 3개(쿠폰함/결제내역/고객센터)는 토스트 플레이스홀더였던 것을 모두 실제 화면으로 연결
- [x] "결제내역" 라벨을 "주문내역"으로 변경(키도 `pay`→`order`로 함께 정리), 마이페이지의 CU-MYPG-10 쇼핑몰 주문내역(`ShopOrderHistScreen`)으로 연결
- [x] "쿠폰함"은 방금 만든 CU-MYPG-16 보유 쿠폰함(`CpnBoxScreen`)으로 연결
- [x] "고객센터"는 `CsFlow`(CU-CS-01 메인)로 직접 연결(마이페이지를 거치지 않고 홈에서 곧장 진입)
- [x] `App.tsx`에 `openMyPageAt(screen)` 헬퍼를 추가해 마이페이지 하위 화면으로 바로 진입하는 딥링크 지점들을 통합(기존 쇼핑몰 취소반품신청→마이페이지 딥링크 코드도 이 헬퍼로 정리)
- [x] tsc -b / vite build / oxlint 모두 클린, Playwright로 홈에서 쿠폰함·주문내역·고객센터 3개 링크 각각 올바른 화면으로 이동하는지 확인, 콘솔 에러 없음
