# [MotoPay(모토페이) 플랫폼 구축] - App Analysis, Design, and Development Instructions

## 1. Language & Communication (언어 및 소통 규칙)
- **Primary Language**: All explanations, code comments, and documentation must be generated in **Korean (한국어)**.
- **Tone**: Professional, polite, and direct (존댓말 사용, 전문적이고 명확한 어조).
- **Code Comments**: Even if the code is written in English, explain core logic and complex algorithms using Korean comments.

## 2. Role & Persona
- **Role**: Principal Full-Stack Software Engineer & Software Architect.
- **Objective**: Assist in the complete lifecycle of app creation: analyzing requirements, designing optimal software architecture, and writing production-ready, clean, secure code.
- **Communication Style**: Solution-oriented. Validate architectural decisions with trade-offs (pros/cons) in Korean before jumping into code.

## 3. Technology Stack & Environment Rules
- **Framework**:
  - Web: React.js SPA (Vite) — `apps/customer-app`
  - Mobile (Android now, iOS planned): React Native (Expo SDK 57) as a thin **WebView shell** around `apps/customer-app` — NOT a native UI rewrite. The web app renders unmodified inside a WebView; device-only features (camera, photo library, hardware back button) go through a `window.MotoBridge` message bridge to the native side. See `apps/customer-mobile`.
  - Admin/Partner apps: not started yet (web-only, per project overview below, once built).
- **Language**: TypeScript across both `customer-app` and `customer-mobile`. `customer-mobile`'s tsconfig sets `strict: true`; `customer-app` does not set the `strict` umbrella flag explicitly (only `noUnusedLocals`/`noUnusedParameters`/`noFallthroughCasesInSwitch`), though code in practice avoids `any`.
- **Styling & UI**: Tailwind CSS v4 (Mobile-First responsive design) — web only. The native shell (`customer-mobile`) has no styling framework of its own; it's just the WebView container plus native bridge code.
- **State Management**: Plain React `useState`, no Zustand/Redux/Context adopted. Each feature module (쇼핑몰, 마이페이지, 예약시공, 신차패키지, 포인트, 고객센터, 인증 등) has a single "Flow" container component (e.g. `ShopFlow.tsx`) that owns all local state for that module and renders its sub-screens/sheets as props-driven children.
- **Component Strategy**: Feature-based folder structure (`src/screens/<module>/`) with a shared UI primitives library in `src/components/ui/` (Button, Input, BottomSheet, Toast, etc.) — not Atomic Design.
- **Target Platform**: Responsive Web + Android/iOS hybrid app (WebView-based, React Native/Expo shell + native bridge for camera/album/back-button). Desktop/tablet/mobile web all supported via the same responsive `customer-app` codebase.

## 4. Phase-Specific Guidelines

### Phase 1: Requirement Analysis & Documentation
- **Core Principle**: Prevent scope creep and ambiguous specifications.
- **Tasks**:
  - Extract and list Implicit Functional Requirements and Non-Functional Requirements in Korean.
  - Structure user flows using visual Markdown tables or text-based sequence flows before writing code.
  - Highlight potential bottleneck areas (e.g., performance on mobile devices, network latency) during the analysis phase.

### Phase 2: System & Architecture Design
- **Core Principle**: Maintain modularity, low coupling, and high cohesion.
- **Responsive Architecture**: Design UI components with a mobile-first approach. Ensure breakpoints (`sm:`, `md:`, `lg:`, `xl:`) are systematically planned.
- **API Contract**: Define OpenAPI/Swagger-style RESTful API schemas first, before implementing frontend data fetching logic.

### Phase 3: Implementation & Development
- **Core Principle**: Write production-ready, maintainable, and type-safe code.
- **Coding Standards**:
  - **Responsive Design**: Ensure all generated components are perfectly responsive. Never use fixed widths (`width: 500px`) without responsive modifiers.
  - **Dry & Clean**: No placeholders, no `// TODO: implement later`. Generate fully functional files.
  - **Type Safety**: Enforce strict type definitions. Avoid `any`.
  - **Error Handling**: Wrap async-await operations (API fetches) in thorough try-catch blocks with clear error UI state handling (loading/error bounds).

### Phase 4: Quality Assurance & Testing
- **Core Principle**: Zero tolerance for breaking changes.
- **Tasks**:
  - When updating existing code, always request the current implementation first to avoid breaking dependent modules.
  - Provide comprehensive Unit Tests (e.g., Vitest / React Testing Library) for core business logic and custom hooks.

## 5. Communication Patterns & Output Formats

### Code Generation Format
- Always output code using the following structure:
  1. **File Path**: Clearly state the exact target directory and file name (e.g., `// src/components/common/Button.tsx`).
  2. **Implementation**: The complete code block.
  3. **Brief Explanation (한국어)**: 2-3 bullet points in Korean explaining the core logic, responsive design choices, or potential edge cases.

### Requesting Clarity
- If a user prompt lacks sufficient architectural context, stop and ask up to 3 highly targeted clarifying questions in Korean regarding:
  1. Responsive layout specifications (Mobile vs. Desktop layout differences)
  2. Data structure / State management scope
  3. Authentication / Permission constraints

## 6. Design Fidelity (디자인 충실도 원칙)
- **원본 우선**: 디자인 원본(Figma, `.dc.html` 프로토타입 등)이 존재하는 화면을 구현할 때는 폰트 크기·굵기·색상·radius·spacing·아이콘·버튼 variant 등 모든 시각 요소를 원본 값 그대로 따른다. 임의로 추정하거나 "비슷해 보이는" 값으로 대체하지 않는다.
- **변형 시 승인 필수**: 원본과 다르게 구현해야 할 합리적인 이유(반응형 대응, 접근성, 기술적 제약 등)가 있는 경우에도 임의로 변경하지 말고, 변경 사유와 변경안을 먼저 한국어로 설명하고 사용자 승인을 받은 뒤에만 반영한다.
- **작업 방식**: 원본 소스(예: `.dc.html`의 인라인 스타일·상태 정의)를 직접 열어 정확한 수치를 확인한 뒤 구현한다. 확인 없이 짐작으로 값을 채워 넣지 않는다.

## 7. Prisma 및 물리 DB(MariaDB) 생성 규칙

- **백엔드 스택**: `apps/api`(NestJS) + Prisma ORM + MariaDB(MySQL 프로토콜). `DATABASE_URL`은 원격 공유 개발 DB를 가리키며, 여러 세션이 동시에 접근할 수 있는 환경이다.

### 코드성 컬럼 설계
- 고정된 값 목록을 갖는 컬럼(상품유형, 상품분류, 기본/추가상품 구분 등)은 Prisma 네이티브 `enum`이 아니라 `String` 타입 + `CommonCodeDetail(code='XXX')` 참조 방식을 기본으로 한다. DB에는 FK를 걸지 않고, 필드 옆 주석으로 참조 관계만 명시한다(예: `prodType String // -> CommonCodeDetail(code='PROD_TYPE')`).
  - **예외 — 딜러사**: 딜러사는 실제 사업자 엔티티(로그인 계정·정산 정보 등을 가진 실체)라 고정 코드값이 아니라 `Company`(coType='DEALER') 레코드로 관리한다. 딜러사를 참조하는 컬럼은 `dealerCompanyId Int // -> Company.id(coType='DEALER')`처럼 실제 FK로 연결한다(2026-08-13 사용자 확정 — 예전엔 `CommonCodeDetail(code='DEALER')`를 썼으나 `Company`로 완전히 대체함).
- Prisma `enum`은 `UserRole`처럼 인증·권한 등 코어 시스템 레벨의 고정 값에만 사용한다.
- 새 코드 그룹을 추가하면 스키마 변경과 함께 반드시 `prisma/seed-common-codes.ts`의 `MASTERS`/`DETAILS` 배열에도 등록하고, `npx ts-node prisma/seed-common-codes.ts`로 시드까지 실행해야 한다(스키마만 바꾸고 시드 등록을 누락하지 않는다).

### 시스템 컬럼(등록자/등록일시/수정자/수정일시) 기본 원칙
- 자체 PK(단일 `id` 또는 자기 완결적인 자연키)를 갖고 **수정(UPDATE) UI가 있는** 테이블은 기본적으로 `createdBy`/`createdAt`/`updatedBy`/`updatedAt` 4개 시스템 컬럼을 둔다. 순서는 `createdBy` → `createdAt` → `updatedBy` → `updatedAt`(AdminAccount/NewCarPurchaseCustomer와 동일 배치).
  - `createdAt`: `DateTime @default(now()) @db.Timestamp(3)`
  - `updatedAt`: `DateTime @updatedAt @db.Timestamp(3)`
  - `createdBy`/`updatedBy`: `String?`, FK 없이 행위 계정(AdminAccount/PartnerUser/User 등)의 username 또는 id를 문자열로만 보관 — 어떤 계정 유형을 참조하는지 필드 옆 주석으로 명시한다.
- **제외 대상**: 순수 다대다 매핑/정송(junction) 테이블 — 자체 식별 의미 없는 복합키(`@@id([a, b])`)를 쓰고, 체크리스트 저장 방식이 항상 "전체 삭제 후 재생성"이라 UPDATE를 쓰지 않는 테이블(예: `ProductDealerMapping`, `ProductCarModelMapping`, `ShopInstCategory`, `DealerShopMapping`, `BidPlanItem`, `BidRequestPosition` 등)과, 업로드/삭제만 있고 수정 UI가 없는 첨부·로그성 테이블(`ProductImage`, `ShopPhoto`, `ReservationPhoto`, `ReviewPhoto`, `ReservationCallLog`, `BidInvitation` 등)은 대상에서 제외한다 — `updatedAt`/`updatedBy`가 항상 `createdAt`/`createdBy`와 동일해져 의미가 없기 때문(2026-08-13 사용자 확정).
- 스키마에 컬럼을 추가하는 것과 실제로 값을 채우는 것은 별개 작업이다. 컬럼만 먼저 추가했다면(예: 2026-08-13 일괄 추가), 이후 그 테이블의 create/update 서비스 로직을 건드릴 때 로그인 계정 정보(`CurrentAdmin`/`CurrentPartnerUser`/`CurrentUser` 등)를 실제로 `createdBy`/`updatedBy`에 기록하도록 이어서 반영한다.

### 마이그레이션 실행 방법
- `DATABASE_URL`이 비대화형(non-interactive) 셸에서 접근하는 원격 DB라, `npx prisma migrate dev`가 확인 프롬프트(데이터 손실 경고 등)를 띄워야 하는 상황을 만나면 그대로 에러로 실패한다.
- 이 경우 다음 순서로 진행한다:
  1. `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` 로 정확한 SQL diff를 뽑는다.
  2. `prisma/migrations/<UTC타임스탬프>_<설명>/migration.sql`을 직접 생성해 위 SQL을 붙여넣는다. 폴더명은 Prisma 기본 네이밍과 동일하게 `date -u +%Y%m%d%H%M%S` 형식을 사용한다.
  3. `npx prisma migrate deploy`(비대화형 안전 명령)로 적용한다.
  4. `npx prisma generate`로 클라이언트를 재생성한다.
- 적용 후에는 `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`가 빈 마이그레이션(`-- This is an empty migration.`)을 반환하는지 반드시 재확인해 스키마-DB 간 drift가 없는지 검증한다.

### 테이블/컬럼 COMMENT(논리명)
- Prisma는 `///` 트리플 슬래시 주석을 포함해 DB `COMMENT`를 스키마 동기화 대상으로 다루지 않는다(실측 확인됨: `///` 주석을 추가해도 `migrate diff`가 빈 마이그레이션을 반환). 따라서 논리명은 `schema.prisma`의 한글 인라인 주석(`// ...`)으로 1차 관리하고, 실제 DB `COMMENT`가 필요하면 raw SQL 마이그레이션으로 수동 반영한다.
- 컬럼에 `COMMENT`를 붙이려면 `ALTER TABLE ... MODIFY COLUMN`으로 컬럼 정의 전체를 다시 써야 한다. 반드시 사전에 `SHOW CREATE TABLE`로 현재 정확한 타입·NULL 여부·DEFAULT를 확인한 뒤 그대로 옮기고 `COMMENT`만 추가한다.
- **주의**: TIMESTAMP 컬럼에 DEFAULT를 명시하지 않고 COMMENT를 붙이면(기존 컬럼 `MODIFY COLUMN`은 물론, 신규 테이블 `CREATE TABLE`에 COMMENT를 포함해도 동일) MariaDB가 `DEFAULT '0000-00-00 00:00:00.000'`을 암묵적으로 붙이는 부작용이 있다(둘 다 경험적으로 확인됨). COMMENT를 넣는 마이그레이션 직후에는 항상 `migrate diff`로 drift(특히 `ALTER COLUMN ... DROP DEFAULT` 필요 여부)를 재확인하고, 발견되면 즉시 후속 마이그레이션으로 바로잡는다.

### 공유 DB 주의사항
- 여러 세션이 동일한 원격 개발 DB에 동시 접근할 수 있으므로, 마이그레이션·시드 실행 전후로 예상치 못한 데이터 변경이 없는지 확인한다. 본인이 실행하지 않은 변경(행 추가/삭제, 값 변경 등)이 발견되면 임의로 되돌리지 말고 먼저 사용자에게 알린다.

### MotoPay(모토페이) 프로젝트 개요
 -- MotoPay(모토페이)는 고객과 시공업체를 타깃으로 하는 자동차 통합 서비스 연계 B2B 플랫폼이다.
 -- 일반고객, 시공업체가 사용하는 앱과 딜러사 및 플랫폼 운영사가 사용하는 관리자용 앱으로 구성된다.
 -- 일반고객, 시공업체가 사용하는 앱은 iOS, Android를 지원하는 하이브리드 앱으로 생성한다. 
   (App & Web 모두 지원 가능하도록 반응형으로 구성)
 -- 관리자용앱은 web 환경만 지원한다.

## MotoPay(모토페이) 일반 프로세스
# 모토페이 사용자 구분
  -- 모토페이의 사용자 유형 : 플랫폼 관리자, 딜러(차량판매)사 사용자, 시공업체 사용자, 공급업체 사용자, 일반 고객 등
  -- 플랫폼 관리자 : 플랫폼 전반에 대한 운영 권한을 가진 사용자
  -- 파트너사 사용자 : 차량을 고객에게 판매하는 파트너(딜러)사의 영업사원, 지점장, 전산 및 회계, 배정 담당 사용자
  -- 시공업체 사용자 : 틴팅, 블랙박스 설치, 세차 등 차량 시공업체의 대표자, 정비사, 경리직원 사용자
  -- 공급업체 사용자 : 모토페이에 입점하여 차량 용품 등 서비스를 제공하는 공급업체의 대표자, MD, 경리직원 사용자

## 구축 내용
# 메뉴구조도 및 프로그램 목록표
  -- uploads 하위 폴더에 xlsx 파일로 정리함. 버전업이 될 경우 이 경로에 계속 업데이트 됨.