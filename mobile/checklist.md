# React Native(Expo) 웹뷰 하이브리드 Android 앱 구축 체크리스트

> **아키텍처**: `apps/customer-app`(기존 웹 앱)을 `react-native-webview`로 그대로 띄우는 얇은 네이티브 셸. 카메라·앨범처럼 디바이스 기능이 필요할 때만 웹→네이티브 브릿지(`postMessage`)로 신호를 보내 네이티브가 처리하고 결과를 되돌려줌. 순수 네이티브 UI 재작성이 아님 — 최초 계획했던 React Navigation·NativeWind 기반 화면 이식(Phase 2~5)은 이 방향 전환으로 전량 폐기함.

## Phase 0: 개발환경 구축 (완료)

- [x] Homebrew 설치 완료 — `/opt/homebrew`(Apple Silicon 표준 위치), 소유자 `choonmook.gil:admin` 확인(루트 소유 파일 0개, root 설치 아님)
- [x] nvm 정상 동작 확인 — 로그인+인터랙티브 셸에서 `node -v` → v20.20.2(LTS) 정상 resolve
- [x] Watchman 설치 확인 — 2026.07.20.00
- [x] JDK 17 설치 확인 — Zulu 17.0.20
- [x] Android Studio 설치 확인 — v2026.1
- [x] Android SDK 설치 완료 — platform-tools(adb 1.0.41)/build-tools(36.0.0)/platforms(android-36.1)/emulator(36.6.11.0), `android-sdk-license` 동의 완료
- [x] 에뮬레이터 `Pixel_7`(API 34, Google Play, arm64-v8a) 생성 완료
- [x] EAS CLI 설치 확인 — eas-cli/21.1.0

## Phase 1: Expo 프로젝트 초기화 (완료)

- [x] `apps/customer-mobile`로 Expo 프로젝트 생성 — `create-expo-app@4.0.0`, blank-typescript 템플릿, Expo SDK 57 / React Native 0.86 / React 19.2.3
- [x] `app.json` 패키지명을 `com.motopay.customer`(android package·iOS bundleIdentifier)로 변경, 앱 이름 "MotoPay"로 변경(Expo 기본 익명 패키지명이 Play스토어 실제 앱과 충돌해 경고 발생했었음)
- [x] 첫 `expo run:android` 빌드 성공 확인(BUILD SUCCESSFUL, 에뮬레이터 설치·실행) — JDK/SDK/Gradle/에뮬레이터 툴체인 전체 검증 완료
- [x] ~~NativeWind/React Navigation 기반 네이티브 화면 스캐폴딩~~ — 방향 전환으로 전량 제거(패키지 uninstall + 관련 파일 삭제)

## Phase 2: 웹뷰 셸 + 브릿지 구현

- [x] `react-native-webview`, `expo-image-picker`, `expo-build-properties` 설치
- [x] `app.json`에 `expo-build-properties`(android `usesCleartextTraffic: true`, 로컬 dev 서버 HTTP 접속용)와 `expo-image-picker`(카메라·앨범 권한 문구) 플러그인 설정 추가
- [x] `src/config.ts` — `WEB_URL`을 `__DEV__` 여부로 분기. 운영 URL은 아직 실제 배포 전이라 플레이스홀더(`https://motopay-customer-app.example.com`) — 배포되면 실제 주소로 교체 필요
- [x] `src/bridge/protocol.ts` — 웹↔네이티브 메시지 타입 정의(`camera:capture`/`camera:pickFromLibrary` 요청, `camera:result` 응답)
- [x] `src/bridge/nativeHandler.ts` — 브릿지 요청을 `expo-image-picker` 호출로 실행, 권한 요청 포함
- [x] `src/screens/WebViewScreen.tsx` — WebView에 `injectedJavaScriptBeforeContentLoaded`로 `window.MotoBridge.postMessage` 주입, `onMessage`로 요청 수신 후 `injectJavaScript`로 `motobridge` CustomEvent를 웹에 응답
- [x] `App.tsx`를 WebViewScreen 단일 화면으로 단순화(네비게이션 불필요 — 화면 전환은 웹 앱 내부에서 처리)
- [x] `apps/customer-app/src/native/bridge.ts` — 웹 쪽 브릿지 유틸(`isNativeBridgeAvailable`/`captureFromCamera`/`pickFromLibrary`), `protocol.ts`와 타입을 수동 동기화
- [x] `npx tsc --noEmit`(양쪽 프로젝트 모두) / `npx expo-doctor` 20/20 통과
- [x] **에뮬레이터에서 실제 구동 확인 완료** — 웹뷰 안에 MotoPay 스플래시→로그인 화면이 정상 렌더링, 터치로 화면 전환까지 확인. 개발용 접속 방식은 `10.0.2.2` 대신 **`adb reverse tcp:5173 tcp:5173` + `http://localhost:5173`**로 확정(아래 context-notes의 트러블슈팅 참고)
- [x] 실제 화면에 `apps/customer-app/src/native/bridge.ts` 연결 완료 — "후기 작성" 팝업(`ReviewWriteScreen.tsx`, 예약시공·신차패키지·쇼핑몰 3개 채널 공용)의 사진 첨부에 연결. PC/브라우저에서는 파일 선택 input, 네이티브 브릿지 존재 시 촬영/앨범 버튼으로 분기, 최대 5장, 개별 삭제 가능. Playwright로 PC 경로(파일 선택 input) 동작·UI 검증 완료
- [ ] 카메라 촬영 → 웹으로 base64 결과가 정상적으로 돌아오는지, 앨범 선택도 동일하게 동작하는지 실기기/에뮬레이터에서 검증 — 아직 미실시(웹 경로만 검증됨, 브릿지 자체 로직은 Phase 2 초반에 구현 완료)

## Phase 3: 배포 준비

- [x] `apps/customer-app`을 실제 URL로 배포 — Vercel/Netlify 같은 클라우드 호스팅이 아니라 **자체 서버(`http://221.141.3.91:8090`)에 `dist` 폴더를 수작업으로 카피**하는 방식으로 결정(사용자가 직접 배포·관리). 확인 결과 서버가 이미 살아있고 200 응답 정상
- [x] `src/config.ts`의 운영 `WEB_URL`을 `http://221.141.3.91:8090`로 교체
- [x] ~~Android 프로덕션 빌드에서는 `usesCleartextTraffic: true`가 불필요~~ → **운영 서버도 http(비TLS)라 계속 필요함으로 결론**. 원래 "운영은 https니까 제거 검토"라고 남겨뒀던 전제가 틀렸음 — 자체 서버를 http로 직접 운영하는 방식이라 `usesCleartextTraffic: true`를 스토어 제출 시에도 유지해야 함(추후 서버에 TLS 적용 시에만 제거 가능)
- [x] 앱 아이콘 전체를 MotoPay 브랜드 아이콘(사용자 제공 `MotoPayIcon.png`, 파란 라운드사각형 + 흰 "M"·노란 "P")으로 교체 — `icon.png`(iOS/메인), `android-icon-foreground.png`+`android-icon-background.png`(안드로이드 adaptive icon, 세이프존 고려해 로고를 70% 스케일로 중앙 배치), `android-icon-monochrome.png`(안드로이드 13+ 테마 아이콘용 실루엣), `favicon.png`, `splash-icon.png` 전부 원본에서 직접 생성(Python/PIL로 흰 여백 크롭 후 재배치 — ImageMagick 미설치 환경이라 PIL로 대체)
- [x] `npx expo prebuild --platform android --clean`으로 네이티브 프로젝트를 새 아이콘/설정으로 재생성 후 `npx expo run:android --variant release`로 릴리즈 APK 빌드(EAS 클라우드 빌드 대신 로컬 Gradle 빌드 사용 — 기존에 구축된 로컬 Android 툴체인을 그대로 활용, EAS 계정 연동 불필요). 산출물: `android/app/build/outputs/apk/release/app-release.apk`(디버그 키스토어로 서명됨 — 내부 테스트용으로는 충분하나 Play 스토어 제출용 서명은 별도 필요)
- [x] **에뮬레이터(Pixel_7)에 설치해 실기 검증 완료** — 앱 아이콘이 런처에 정상 표시됨, 실행 시 웹뷰가 실제 운영 URL(`http://221.141.3.91:8090`)에서 MotoPay 스플래시("신차 케어의 시작") → 로그인 화면(아이디/비밀번호, 카카오·네이버·Gmail·Apple 간편로그인, 파트너센터 로그인 링크)까지 정상 렌더링. 상단 이중 여백 버그도 재발하지 않음(이전 수정이 릴리즈 빌드에도 그대로 적용됨을 확인)
- [ ] Google Play Console 내부 테스트 트랙 등록 — 자체 서버 배포 방식이라 우선순위 낮음, 필요 시 진행
- [ ] Play 스토어 제출용 release keystore 생성 및 서명 설정(현재는 디버그 키로 서명된 릴리즈 빌드 — 내부 테스트만 가능)

## Phase 4: 안드로이드 하드웨어 백버튼 (완료)

- [x] 문제 확인: 웹뷰가 URL 라우팅이 아니라 React state로 화면을 전환하는 SPA라 브라우저 히스토리가 비어 있어, 하드웨어 백버튼을 누르면 항상 앱이 그냥 종료돼버림(화면별 실제 뒤로가기가 전혀 안 됨)
- [x] `apps/customer-mobile`: `WebViewScreen.tsx`에 `BackHandler`로 하드웨어 백버튼 가로채기 추가 → 웹의 `window.__motoConsumeBack()`을 `injectJavaScript`로 호출해 현재 화면이 처리했는지 확인 → 처리 못 했으면(더 갈 곳 없는 화면 루트) `window.MotoBridge.postMessage({type:"nav:exit"})`로 알려주고 네이티브가 `BackHandler.exitApp()` 호출
- [x] `apps/customer-app`: `src/native/backHandler.ts`(신규) — 화면·시트가 열려 있는 동안 뒤로가기 동작을 등록하는 스택 유틸. `App.tsx` + 7개 Flow(Auth/Rsv/Shop/Myp/Ncpk/Point/Cs) 전부에 연결해 각 화면 상단 '‹' 버튼의 기존 `onBack`/`onClose` 로직을 하드웨어 백버튼에서도 그대로 재사용하도록 미러링
- [x] 검증: Playwright로 `window.__motoConsumeBack()`을 직접 호출해 웹 로직 전체(로그인 루트/화면 뒤로가기/시트 닫기/홈 종료) 검증 + 에뮬레이터에 디버그 빌드 설치해 실기 하드웨어 백버튼으로 3가지 케이스(홈 루트→앱 종료, 쇼핑몰→홈 복귀, 로그아웃 시트→시트만 닫힘) 전부 확인 완료
