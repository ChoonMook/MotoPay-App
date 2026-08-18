# 관리자웹(admin-app) 구현 체크리스트

> **주의(2026-08-18 작성)**: 이 문서는 실시간으로 작성된 게 아니라, admin-app 작업이 애초에 `design/`·`server/` 체크리스트에 한 번도 기록되지 않고 여러 세션에 걸쳐 진행된 뒤 **사후에 코드베이스(파일 헤더 주석·git log·menuConfig.ts의 날짜 명시 결정 메모·Prisma 스키마 주석)를 근거로 역reconstruction**한 것이다. 각 화면의 존재·완료 여부는 코드로 확실히 확인했지만, 그 과정에서 오간 세부 대화·중간 시행착오는 대부분 남아있지 않다. 날짜는 git 커밋 날짜 또는 코드 주석에 명시된 날짜를 그대로 썼다(커밋이 batched라 실제 작업일과 커밋일이 다를 수 있음). 상세 배경·결정 근거는 `admin/context-notes.md` 참고.

## Phase A: admin-app 스캐폴딩 + 시스템 설정(AD-SYS-03) 공통 코드 관리 (2026-08-06~08-07)

- [x] `apps/admin-app` Vite+React+TS 신규 스캐폴딩, `AdminShell`(사이드바+헤더+MDI 탭) 레이아웃 구조
- [x] `menuConfig.ts` — `MotoPay_메뉴구조도_v1_30.xlsx` "관리자웹_사이트맵" 시트 기준 메뉴 트리 정의, `filterMenuGroups`/`findPgIdByPath`/`findBreadcrumb` 등 권한·라우팅 헬퍼
- [x] `LoginPage.tsx` — `POST /admin-auth/login` 실 연동, `AdminAccount`(운영사/딜러사/공급업체 직원 계정) 별도 인증 realm
- [x] `apps/api/src/admin-auth/` — `POST /admin-auth/login`, `GET/PATCH /admin-auth/me`, `POST /admin-auth/refresh`
- [x] `DashboardPage.tsx`(AD-DASH-01/02/03 메인 대시보드) — 기본 진입 화면
- [x] `AccessDeniedPage.tsx` / `PlaceholderPage.tsx` — 메뉴권한 없는 URL 직접 접근 차단, 미구현 메뉴 안내 화면
- [x] **AD-SYS-03 공통 코드 관리** — `CommonCodeMgmtPage.tsx`(좌측 코드그룹 Master 그리드 + 우측 코드값 Detail 그리드), `apps/api/src/common-codes/admin-common-codes.controller.ts`(그룹/상세 CRUD + 대표사진 업로드 10개 엔드포인트)

## Phase B: 회원 관리(AD-MBR-02) + 업체 관리(AD-CO-*) 1차 (2026-08-08)

- [x] **AD-MBR-02 고객 회원 목록** — `CustMbrListPage.tsx`, `apps/api/src/admin-members/`(목록/상세/탈퇴처리 3개 엔드포인트)
- [x] **AD-CO-02/03/04 업체 관리** 1차 — `CoListPage.tsx`(업체 목록), `CompanyDetailModal.tsx`(업체 상세 팝업, 등록/수정 겸용), `apps/api/src/companies/companies.controller.ts` 1차분

## Phase C: 업체 목록 완성 + 카탈로그(AD-CTLG-*) 상품 관리 (2026-08-10)

- [x] **AD-CO-03/04 업체 관리 완성** — 매장 사진 업로드(MAIN/CASE), 휴무일·예약가능 시간대 템플릿·일자별 오버라이드, 소속 사용자(PartnerUser) 계정 CRUD, 사업자등록증/통장사본 첨부, 업체 승인/승인취소까지 `companies.controller.ts` 전체(28개 엔드포인트) 완성
- [x] **AD-CTLG-02 차종 마스터** — `CarModelMstPage.tsx` (좌측 메이커>차종 2단 트리 + 우측 상세 패널, `admin-common-codes` 엔드포인트 재사용)
- [x] **AD-CTLG-03 시공항목 관리** — `CstItemMgmtPage.tsx` (목록 + 순서변경 ▲▼ 버튼 + 아이콘 미리보기, 별도 DnD 라이브러리 없이 인접 스왑 방식 — 이후 FAQ 관리에서도 재사용된 선례)
- [x] **AD-CTLG-04 브랜드 관리** — `BrandMgmtPage.tsx` (PROD_BRAND 공통코드 그룹 재사용)
- [x] **AD-CTLG-05 상품 관리** — `ProductMgmtPage.tsx`, `apps/api/src/products/admin-products.controller.ts` 신규(원가(`supplyPrice`)는 SUPER_ADMIN·SETTLEMENT 권한에게만 노출)
- [x] **AD-CTLG-07 상품 옵션 관리** — `ProdOptMgmtPage.tsx` (부위옵션 사용여부 + 부위별 선택 가능 농도 설정 팝업)
- [x] **AD-CTLG-08 딜러사 매핑 관리** — `DealerMapMgmtPage.tsx` (마스터-디테일: PKG 상품 목록 + 매핑 가능 딜러사 체크리스트)
- [x] **AD-CTLG-09 차종 매핑 관리** — `CarModelMapMgmtPage.tsx` (마스터-디테일: PKG 상품 목록 + 적용 가능 차종 트리)
- [x] **AD-CTLG-10 신차패키지 구성 관리** — `PkgCompMgmtPage.tsx` (딜러사 필터 + 구성상품 편집 + 고객앱 노출 순서 미리보기)

## Phase D: 신차패키지 관리(AD-NCPK-*, DL-NCPK-*) (2026-08-13)

- [x] **AD-NCPK-04 딜러사-시공업체 매핑** — `DealerPtnMapPage.tsx` (좌측 딜러사 목록 + 우측 매핑 가능 시공업체 체크리스트, `companies.controller.ts`의 shop-mappings 엔드포인트)
- [x] **DL-NCPK-01~04 신차 구매내역** — `NewCarPurchaseInputPage.tsx`(등록내역 조회를 기본화면으로, 신규등록·엑셀 일괄업로드는 팝업), `apps/api/src/new-car-purchases/admin-new-car-purchases.controller.ts` (딜러 직원도 `AdminAccount`로 접근, 등록→확정 2단계 워크플로, 확정 후 수정은 관리자 전용)

## Phase E: 예약시공관리(AD-NCPK-07, AD-RSVC-02) + 시스템설정(AD-SYS-04/05) (2026-08-14 전후)

- [x] **AD-NCPK-07 신차패키지 시공현황** — `NcpkStatPage.tsx` + `NcpkStatDetailModal.tsx`(조회 전용), `apps/api/src/reservations/admin-reservations.controller.ts`(전체 업체 통합 모니터링, 고객명/예약번호 검색+딜러사 필터)
- [x] **AD-RSVC-02 예약시공현황** — `RsvStatPage.tsx` + `RsvStatDetailModal.tsx`(조회 전용), `apps/api/src/bid-requests/admin-bid-requests.controller.ts`(일반입찰·전문가추천 통합 모니터링) — 원래 "입찰 현황 모니터링"/"추천형 입찰 현황" 2개 메뉴였던 것을 2026-08-16 사용자 확정으로 1개로 통합
- [x] **AD-SYS-04 사용자 계정 관리** — `UserAcctMgmtPage.tsx`(업체 미소속 운영사 자체 직원 계정만 대상), `apps/api/src/admin-accounts/`(목록/추가(임시비밀번호 발급)/수정 4개 엔드포인트)
- [x] **AD-SYS-05 메뉴권한관리** — `MenuPermMgmtPage.tsx`(권한그룹×메뉴 매트릭스), `apps/api/src/menu-permissions/`(GET/PUT), `AccessDeniedPage.tsx`와 연동해 URL 직접 접근도 차단

## Phase F: 포인트·쿠폰·회원등급·CS(고객센터) 관리 신규 + 메뉴 재구성 (2026-08-16~08-18, 커밋 전 상태)

> 이 구간은 아직 git commit이 안 된 상태(2026-08-18 기준 working tree)로 존재 — 커밋 로그로는 확인 불가, 코드 자체와 `menuConfig.ts`의 날짜 명시 결정 메모로 확인. 백엔드 상세는 `server/checklist.md`의 관련 Phase에도 별도로 정리돼 있다(중복 기재 아님 — 이 목록은 admin-app 화면 관점 요약).

- [x] **AD-PNT-06 포인트 내역 조회** — `PtHistPage.tsx`(전체 회원 포인트 입출 내역, 회원·구분·기간 필터), 처리자 표시를 raw id → 회원명/관리자명으로 개선(포인트 항목별 상세 클릭 시 "충전" 구분값이 안 보이던 버그 수정 포함)
- [x] **AD-PNT-04/05 포인트 강제 부여·차감** — `ForcePointAdjustModal.tsx`(AD-PNT-06 화면 상단 버튼으로 여는 팝업, 독립 메뉴 아님)
- [x] **신차구매 포인트 지급** — `GrantPurchasePointsModal.tsx`(딜러사별 신차구매 고객 선택 지급 또는 VIN 엑셀 일괄 지급, xlsx 스펙에 없는 지원 팝업)
- [x] **AD-PNT-07 회원 등급 기준 설정** — `GradeRuleSetPage.tsx`(GOLD/SILVER/BRONZE 산정기준·혜택 설정 — 등급 산정 엔진 자체는 아직 없음, 설정값만 저장)
- [x] **AD-CPN-03 쿠폰 발행 내역** — `CpnHistPage.tsx`(발행주체·상태·발행일 필터, 행 클릭 시 개별 발급·사용내역 상세)
- [x] **AD-CPN-02 쿠폰 발행** — `CpnIssueModal.tsx`(AD-CPN-03 화면 상단 버튼 팝업 — 원래 독립 메뉴였으나 팝업 액션으로 전환)
- [x] **AD-MBR-02 회원 상세 재구성** — `CustMbrListPage.tsx`의 회원 상세를 화면 폭 50% 확대 + 기준정보/보유차량/신차패키지/포인트/쿠폰 5개 탭으로 재구성, 포인트 탭에 금액 합계 행 추가
- [x] **AD-CS-02 1:1 문의 관리** — `InquiryMgmtPage.tsx`(유형·상태·문의자 검색·접수일 필터, 답변 작성 팝업 — "답변 발송" 클릭 시 확인 모달 → 발송 성공 시 자동 닫힘), `apps/api/src/inquiries/`(고객용 `me/inquiries` CRUD+수정, 관리자용 `admin/inquiries` 목록/상세/답변, `Inquiry`+`InquiryPhoto` 신규 테이블)
- [x] **AD-CS-03 FAQ 관리** — `FaqMgmtPage.tsx`(카테고리 필터, 등록/수정/삭제, ▲▼ 순서변경, 노출여부 토글 — CstItemMgmtPage와 동일한 인접스왑 정렬 패턴), `apps/api/src/faqs/`(공개 `GET /faqs` + 관리자 CRUD/reorder, `FaqItem` 신규 테이블), 일반 FAQ 샘플 6건 등록(포인트 2·예약시공 2·쇼핑몰 1·계정 1)
- [x] **AD-NOTI-02 후기 관리** — `ReviewMgmtPage.tsx`(업체명·평점·노출상태·작성일 필터, 블라인드 처리/해제 — 처리 시 즉시 고객·업체 화면에서 숨김), `apps/api/src/reviews/`(`Review.isBlinded` 컬럼 추가 + `shops.service.ts`의 기존 후기 조회 3곳에 블라인드 필터 적용)
- [x] **AD-NCPK-06(발급 현황) 메뉴 제거** — 미구현 placeholder였던 메뉴 삭제(2026-08-16 확정)
- [x] **AD-RSVC-04(입찰 마감시간 설정)/AD-RSVC-05(시공일시 변경) 메뉴 제거** — 전자는 `bid-requests.service.ts`의 코드 상수(`BID_DEADLINE_DAYS`)로 대체, 후자는 미구현 placeholder 삭제(2026-08-16 확정)
- [x] **AD-PNT-02(포인트 상품 설정)/AD-PNT-03(포인트 유효기간 설정) 메뉴 제거** — 전자는 customer-app 충전 정책이 "1P=1원" 고정이라 설정 UI 자체가 불필요, 후자는 만료 엔진이 없어 나중에 코드 상수로 대체 예정(2026-08-18 확정)
- [x] **UI 버그 수정 다수**: ReviewMgmtPage 평점/처리 컬럼 ag-grid 셀 정렬(가로 중앙정렬 `cellClass` 누락 → 추가, 세로 중앙정렬은 `ag-react-container`가 자동으로 채워주지 않아 `h-full` 래퍼 필요했던 것 확인·수정), 처리 버튼 크기(고정폭 컬럼+`h-7` 고정높이로 안정화), FaqMgmtPage 노출여부 토글 스위치 레이아웃(절대좌표 방식 → `border` 트릭 기반 flex 방식으로 교체해 ON/OFF 여백 비대칭 해소)

### 관련 admin/backend 인프라 — 이번 세션에 확인·정리 (별도 화면 신규분 아님)
- [x] `MenuPermission`/`filterMenuGroups`가 32개 메뉴 리프 전체를 커버, `PlaceholderPage`로 남은 항목 없음(전수 확인)
- [x] 전체 admin 컨트롤러 17개가 `JwtAdminAuthGuard`+`@ApiBearerAuth()`로 일괄 보호(로그인 엔드포인트 제외)

## 미해결/후속 (2026-08-18 기준)

- [ ] **AD-SHOP-02~05(쇼핑몰 관리 4종), AD-STL-02~06(정산·수수료 관리 5종) — 미구현 확인됨.** `apps/admin-app/src/pages/shop/`, `pages/settle/` 폴더 자체가 없고 `App.tsx`에도 대응 라우팅이 없어, 9개 메뉴 모두 `ContentSwitch`의 기본 분기로 떨어져 `PlaceholderPage`(준비중 안내)만 뜬다. 다음 admin-app 작업 후보.
- [ ] `DashboardPage.tsx`가 AD-DASH-01을 자처하지만 menuConfig엔 AD-DASH-01이라는 리프가 없음(AD-DASH-02/03만 존재) — 원본 xlsx의 부모/자식 pgId 체계 차이로 추정, 실제 동작엔 문제 없어 보이나 확인 필요
- [ ] `MemberGradeRule`(AD-PNT-07)은 설정값만 저장할 뿐 실제 등급 산정 엔진이 없음 — 산정 배치/트리거는 별도 작업 필요
- [ ] AD-PNT-03(포인트 유효기간)처럼 메뉴에서 제거된 정책값들(BID_DEADLINE_DAYS 등)이 실제로 코드 상수로 정확히 존재하는지, 향후 관리자 화면 없이도 운영 가능한 수준인지 별도 점검 필요
