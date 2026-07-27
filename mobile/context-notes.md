# 컨텍스트 노트 — React Native(Expo) Android 앱 전환

## 배경
- 기존 `apps/customer-app`(Vite+React DOM+Tailwind v4)은 웹/반응형 프로토타입으로 완성된 상태(고객앱 8개 모듈 전체).
- 다음 단계로 React Native 기반 안드로이드 네이티브 앱 구축을 진행하기로 함. CLAUDE.md의 "Target Platform: Cross-platform Web & Responsive Web-App"은 이번 결정으로 갱신이 필요한 상태 — RN 프로젝트 착수 시점에 함께 업데이트할 것.

## 주요 결정 (최초안, 2026-07-23 오전 — 아래 "아키텍처 전환" 항목으로 대부분 폐기됨)
- **Expo(관리형 워크플로우) 채택**, bare React Native CLI는 채택 안 함. 이유: 최종적으로 iOS까지 지원해야 하는 프로젝트라 Expo의 크로스플랫폼 이점이 크고, EAS 클라우드 빌드로 로컬 Android Studio 풀세팅 없이도 APK/AAB를 뽑을 수 있어 초기 진입 장벽이 낮음. 커스텀 네이티브 모듈이 필요해지면 Expo config plugin 또는 prebuild로 대응 가능해 예전만큼 bare CLI 대비 제약이 크지 않음. **→ 이 결정은 그대로 유효함(웹뷰 셸도 Expo로 만듦), 아래 나머지 3개 항목만 폐기됨.**
- ~~DOM 기반 코드는 재사용 불가, 로직/데이터는 재사용 가능~~ → 폐기. 애초에 네이티브로 화면을 재작성하지 않으므로 이 논의 자체가 불필요해짐.
- ~~NativeWind 도입 권장~~ → 폐기. 네이티브 화면이 없으므로 NativeWind 불필요.
- ~~네비게이션: React Navigation(Stack + Bottom Tabs)으로 전환~~ → 폐기. 화면 전환은 여전히 웹 앱(`apps/customer-app`) 내부의 `view`/`screen`/`sheet` 상태로 처리되고, 네이티브 셸은 웹뷰 하나만 띄우므로 네이티브 네비게이션 라이브러리가 필요 없음.

## 아키텍처 전환 (2026-07-23, 사용자 확인)
- 사용자가 명확히 정정: "이 프로젝트에서 추구하는 방식은 웹뷰 방식이야. React.js로 만든 웹 화면을 앱 안의 웹뷰로 띄우고, 카메라나 앨범 같은 디바이스 기능이 필요할 때만 React Native(Native) 영역에 신호를 보내 제어하는 구조로 생성하고 싶어." — 순수 네이티브 UI 재작성(React Navigation + NativeWind로 화면 하나하나 이식)이 아니라 **웹뷰 하이브리드**가 목표였음.
- 용어 정리: 업계에서 "하이브리드 앱"은 보통 웹뷰 기반(Cordova/Ionic/Capacitor류)을 가리키고, React Native처럼 실제 네이티브 위젯을 그리는 방식은 "크로스플랫폼 네이티브"로 구분하는 게 더 정확함. 이 프로젝트가 원한 건 정확히 전자(웹뷰 기반)였는데, 최초에 이 구분을 명확히 짚지 않고 "React Native = 크로스플랫폼 네이티브" 쪽으로 진행했던 게 방향이 어긋난 원인. 프로젝트 루트 `CLAUDE.md`의 "하이브리드 앱" 표현은 정확했던 것이고, 이번 전환으로 오히려 그 표현과 실제 구현이 일치하게 됨.
- **웹뷰 콘텐츠 소스**: 원격 호스팅 URL 방식으로 확정(사용자 선택, 3가지 중 권장안). `apps/customer-app`을 실제 서버에 배포하고 웹뷰는 그 URL만 바라봄. 앱스토어 심사 없이 웹 코드만 배포하면 바로 반영되고, SPA 라우팅·상대경로 이슈도 없음(로컬 번들 내장 방식 대비). 대신 인터넷 연결이 필수이고 별도 호스팅 파이프라인이 필요함 — 아직 실제 배포 URL은 없어 `src/config.ts`에 플레이스홀더로 남겨둠.
- **브릿지 프로토콜**: `window.MotoBridge.postMessage(request)`(웹→네이티브, RNWebView의 `injectedJavaScriptBeforeContentLoaded`로 주입) + `motobridge` CustomEvent(네이티브→웹, `injectJavaScript`로 주입)로 왕복. `requestId` 기반으로 요청/응답을 매칭(웹 쪽에서 Promise로 감싸 `await captureFromCamera()`처럼 쓸 수 있게 `apps/customer-app/src/native/bridge.ts`에 래핑). 프로토콜 타입 정의(`protocol.ts`)는 두 프로젝트가 별도 저장소/패키지라 공유 임포트가 안 되므로 양쪽에 수동으로 동일하게 유지 — 향후 모노레포로 합치거나 npm 패키지로 분리하면 이 중복은 해소 가능(지금은 프로젝트 규모상 과함).
- **카메라/앨범은 `expo-image-picker` 하나로 통합** 처리(`launchCameraAsync`/`launchImageLibraryAsync`). `expo-camera`(라이브 카메라 프리뷰 UI를 앱 안에 직접 그리는 방식)는 채택 안 함 — 시스템 카메라 앱을 그대로 띄우는 `expo-image-picker` 쪽이 구현이 훨씬 간단하고, 지금 요구사항("사진 촬영/앨범 선택")에는 라이브 프리뷰가 필요 없다고 판단. 나중에 인앱 카메라 UI(예: 문서 스캔 가이드라인 등)가 필요해지면 그때 `expo-camera`로 별도 화면을 추가하면 됨.
- **Android cleartext 트래픽 허용**: 로컬 Vite dev 서버(`http://10.0.2.2:5173`)는 HTTP라 Android 9(API 28)부터 기본 차단되는 cleartext 트래픽에 걸림 → `expo-build-properties` 플러그인으로 `android.usesCleartextTraffic: true` 설정. 운영 빌드는 https만 쓸 거라 실질적으로 무해하지만, 스토어 제출 전에는 네트워크 보안 설정을 dev 빌드로만 한정하거나 제거하는 걸 재검토할 것(Phase 3에 항목 남겨둠).
- 기존에 만들어뒀던 `src/navigation/`, `src/screens/PlaceholderScreen.tsx`, `src/icons/NavIcons.tsx`, `tailwind.config.js`, `global.css`, `babel.config.js`, `metro.config.js`(nativewind용), `nativewind-env.d.ts`, `css.d.ts`와 관련 패키지(`@react-navigation/*`, `nativewind`, `tailwindcss`, `react-native-screens`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, `react-native-svg`)를 전부 제거함. 첫 `expo run:android` 빌드 성공으로 검증했던 JDK/SDK/Gradle/에뮬레이터 툴체인 자체는 아키텍처와 무관하게 계속 유효해 그대로 재사용.

## Phase 2 실기 검증 & 트러블슈팅 (2026-07-23)
- `expo run:android` 재빌드 성공(캐시 덕에 28초) 후 첫 실행에서 `net::ERR_CONNECTION_REFUSED`(`http://10.0.2.2:5173/`) 발생.
- **원인**: `apps/customer-app`의 Vite dev 서버가 `localhost:5173`을 **IPv6(`::1`)로만** 바인딩하고 있었음(`lsof`로 확인, `netstat`에 `tcp6 ::1.5173 LISTEN`만 있고 `tcp4`가 없었음). 안드로이드 에뮬레이터의 `10.0.2.2` NAT 별칭은 호스트의 **IPv4** 루프백(127.0.0.1)만 가리키므로 IPv6 전용 리스너에는 애초에 도달할 수 없었음. 맥에서 `curl http://localhost:5173`은 성공하는데(리졸버가 `::1`을 먼저 시도) `curl http://127.0.0.1:5173`은 실패하는 것으로 교차 확인함.
- **1차 조치**: `vite --host 0.0.0.0`으로 재기동해 IPv4(`tcp4 *.5173 LISTEN`)도 열리게 함 → 그래도 안 됨(앱이 이전 에러 화면에서 새로고침을 안 해서였음, `am force-stop` 후 재실행하니 스플래시까지는 로드).
- **최종 조치**: `10.0.2.2` 방식 자체를 버리고 **`adb reverse tcp:5173 tcp:5173`**으로 전환. 이 방식은 에뮬레이터의 `localhost:5173` 요청을 adb 브리지를 통해 호스트의 `localhost:5173`으로 그대로 포워딩하므로 IPv4/IPv6 바인딩 이슈, NAT 특수 주소 등을 신경 쓸 필요가 없고, **실기기(USB 디버깅)에서도 동일하게 동작**해 에뮬레이터 전용인 `10.0.2.2`보다 범용적임. `src/config.ts`의 dev URL을 `http://localhost:5173`으로 변경.
- **주의**: `adb reverse`는 adb 세션이 끊기면(에뮬레이터 재시작, USB 재연결 등) 초기화되므로 새 세션마다 `adb reverse tcp:5173 tcp:5173`을 다시 실행해야 함 — 팀 내 다른 개발자용 README/스크립트에 반드시 포함시킬 것.
- **최종 검증 완료**: 웹뷰 안에 MotoPay 스플래시 화면 → (탭) → 로그인 화면(아이디/비밀번호, SNS 로그인 4종, 회원가입/파트너센터 링크)까지 실제 렌더링과 터치 인터랙션 정상 확인. 스크린샷으로 웹 버전과 시각적으로 동일함을 확인.
- 브릿지(카메라/앨범) 자체는 아직 실사용 화면에서 호출되지 않아 end-to-end로 검증되지 않음 — `apps/customer-app`에 이 기능을 쓸 실제 화면(예: 고객센터 1:1 문의 등록의 "사진 첨부" 버튼)을 연결한 뒤에 검증 가능.

## 환경 확인 이력 (2026-07-23, 1차)
- 사용자가 먼저 일부 설치를 진행한 상태에서 확인 요청 — 다음을 실제로 검증함(추측 아님, `Bash`로 직접 확인):
  - JDK 17(Zulu), Android Studio(v2026.1)는 설치 완료.
  - nvm은 설치돼 있고 Node 20.20.2(LTS)·24.18.0 둘 다 있으며 `default` 별칭이 20으로 지정돼 있음.
  - Expo는 전역 설치 없이 `npx expo`로 정상 동작(57.0.10) 확인.
- **발견한 문제**: Homebrew가 설치돼 있지 않은데 `~/.zshrc`의 nvm 로딩 줄이 `source $(brew --prefix nvm)/nvm.sh`로 brew에 의존하고 있어, 매 터미널 세션마다 이 줄이 조용히 실패하고 있음. 그 결과 nvm이 사실상 비활성 상태이고, 터미널에서 실제 잡히는 `node`는 nvm이 아닌 `/usr/local/bin/node`(v24.18.0, 별도 경로에 직접 설치된 것으로 추정)임.
- Android SDK는 아직 미설치 — `ANDROID_HOME` 환경변수는 `.zshrc`에 미리 설정돼 있으나 가리키는 폴더(`~/Library/Android/sdk`)가 실제로 없는 상태.

## 환경 확인 이력 (2026-07-23, 2차 — Homebrew 설치 후)
- 사용자가 "Homebrew를 root에 설치한 것 같다"고 우려해 소유권을 직접 확인함: `/opt/homebrew` 및 하위 전체 파일이 `choonmook.gil:admin` 소유(`find /opt/homebrew -user root` 결과 0건)이고, git 원격도 `https://github.com/Homebrew/brew`로 정상. **root로 설치된 게 아니라 Apple Silicon 표준 위치(`/opt/homebrew`)에 정상적으로 설치된 것으로 확인**. `/opt` 자체가 root 소유인 것은 macOS 기본 동작이라 문제 아님.
- `~/.zprofile`에 설치 스크립트가 자동으로 넣어주는 `eval "$(/opt/homebrew/bin/brew shellenv zsh)"` 줄도 정상 확인됨.
- 위 1차 진단에서 발견했던 "brew 부재로 nvm 로딩 실패" 문제는 brew 설치로 자동 해소됨 — 로그인+인터랙티브 셸(`zsh -lic`, 실제 Terminal.app 새 창/탭과 동일한 조건)에서 `node -v` → v20.20.2(LTS) 정상 resolve 확인.
  - **진단 시 헷갈렸던 부분**: `zsh -lc`(로그인만, 비인터랙티브)로 테스트하면 `~/.zshrc`가 아예 안 불려서 nvm 미적용처럼 보이고, `zsh -ic`(인터랙티브만, 비로그인)로 테스트하면 `~/.zprofile`이 안 불려서 brew가 PATH에 없어 `.zshrc`의 `brew --prefix nvm` 줄에서 에러가 남. 반드시 `-li`(로그인+인터랙티브) 조합으로 검증해야 실제 Terminal.app 동작과 일치함.
- Watchman(`brew install watchman`, 2026.07.20.00), EAS CLI(21.1.0)도 추가로 설치 완료 확인.
- Android SDK만 유일하게 아직 미설치 상태로 남음(Android Studio 최초 실행/Setup Wizard 미진행).

## 환경 확인 이력 (2026-07-23, 3차 — Android Studio 최초 실행 후)
- 사용자가 Android Studio를 실행해 Setup Wizard를 완료함. `~/Library/Android/sdk` 생성 확인, 내부에 `platform-tools`(adb 1.0.41)/`build-tools`(36.0.0)/`platforms`(android-36.1)/`emulator`(36.6.11.0)/`licenses`(`android-sdk-license` 동의 완료) 모두 정상 설치됨.
- 로그인+인터랙티브 셸에서 `adb --version`/`emulator -version` 정상 resolve 확인 — `.zshrc`의 `ANDROID_HOME`/PATH 설정이 올바르게 작동함.
- `emulator -list-avds`가 빈 목록을 반환하고 `~/.android/avd` 폴더도 아직 없음 — SDK 설치는 됐지만 AVD(에뮬레이터 기기)는 아직 하나도 생성되지 않은 상태. Phase 0의 유일한 남은 항목.

## 환경 확인 이력 (2026-07-23, 4차 — AVD 생성 완료, Phase 0 종료)
- 사용자가 Device Manager에서 `Pixel_7` AVD를 생성함. `~/.android/avd/Pixel_7.avd/config.ini` 확인 결과 API 34(`android-34`) + Google Play 이미지 + `arm64-v8a`(Apple Silicon에 맞는 네이티브 ABI, 에뮬레이터 성능에 중요) 조합으로 정상 구성됨. `emulator -list-avds` → `Pixel_7` 정상 응답.
- Phase 0 체크리스트의 모든 항목이 완료됨. 원래 계획했던 `hello-check` 임시 프로젝트로 별도 검증하는 단계는 생략하기로 함 — Phase 1에서 만들 실제 `apps/customer-mobile` 프로젝트의 첫 `expo run:android` 실행이 어차피 툴체인 전체(JDK/SDK/에뮬레이터/Gradle)를 검증하므로 중복 작업.

## Phase 1 진행 이력 (2026-07-23)
- `apps/customer-app`과 마찬가지로 `apps/customer-mobile`도 독립 프로젝트로 생성(모노레포 워크스페이스 설정 없음 — 루트에 `package.json` 자체가 없어 기존 컨벤션과 일치).
- **NativeWind는 Tailwind v3 계열로 설치**(`tailwindcss@^3.4.17`), customer-app(v4)과 메이저 버전이 다름 — 의도적 결정. NativeWind 4.2.6의 공식 문서·예제가 Tailwind v3 JS 설정(`tailwind.config.js`의 `theme.extend`) 기준으로 작성돼 있고, v4의 CSS-First `@theme` 방식 지원 여부가 불명확해 리스크를 피함. 실제 화면에서 쓰는 유틸리티 클래스명(`bg-brand`, `rounded-2xl` 등)은 v3/v4 동일해서 이식 작업에는 영향 없음 — 색상 토큰만 `tailwind.config.js`에 JS 객체로 재정의(customer-app의 `index.css` 값을 그대로 복사).
- **패키지명 변경**: Expo 기본 익명 패키지명(`com.anonymous.customermobile`)이 Google Play에 이미 등록된 실제 앱과 충돌해 `expo run:android` 실행 시 경고가 발생함 → `app.json`의 `android.package`/`ios.bundleIdentifier`를 `com.motopay.customer`로, 앱 표시 이름도 "MotoPay"로 먼저 정리하고 진행. (패키지명은 Play Store에 한번 배포하면 사실상 못 바꾸므로 지금 확정해두는 게 맞다고 판단, Phase 6에 남겨뒀던 항목을 앞당김)
- **네비게이션 스캐폴딩**: `src/navigation/{types.ts,MainTabs.tsx,RootNavigator.tsx}` + `src/screens/PlaceholderScreen.tsx` + `src/icons/NavIcons.tsx`(웹 `homeIcons.tsx`의 SVG path를 `react-native-svg`로 그대로 이식) 구조로 배선. 지금은 4탭 모두 PlaceholderScreen을 보여주는 상태 — Phase 4~5에서 모듈별로 실제 화면으로 교체하면서 RootStack에도 각 Flow의 라우트를 추가할 예정.
- `expo-doctor` 20개 항목 중 `react-native-worklets`(reanimated의 peer dependency) 누락이 1건 잡혀서 추가 설치 후 재검사 통과.
- CSS 사이드이펙트 import(`import "./global.css"`) 타입 에러 발생 → `css.d.ts`에 `declare module "*.css"` 추가로 해결.

## 버그 수정 — 상단 이중 여백 (2026-07-23)
- 사용자가 스크린샷으로 제보: 모든 페이지에서 실제 상태바(시각·배터리 아이콘)와 앱 콘텐츠(예: 홈 화면의 "MotoPay" 타이틀+포인트뱃지) 사이에 정체불명의 빈 여백이 생김.
- **원인**: `WebViewScreen.tsx`가 `SafeAreaView edges={["top", "bottom"]}`로 감싸져 있어 네이티브 쪽에서 상태바 높이만큼 이미 한 번 밀어냈는데, `apps/customer-app`의 각 화면(`HomeScreen.tsx` 등)이 자체적으로 `pt-[46px]`/`top-[98px]` 같은 상태바 예약 여백을 이미 갖고 있어(원본 Cardoc 디자인 캔버스가 가짜 상태바를 그려주던 것을 웹 컴포넌트로 이식하며 생긴 관례) 이중으로 겹침.
- **수정**: `edges={["top", "bottom"]}` → `edges={["bottom"]}`로 top 인셋 제거(`src/screens/WebViewScreen.tsx`). 이 컴포넌트가 웹뷰 전체를 감싸는 최상위 컨테이너라 웹 쪽 페이지가 무엇이든(로그인/홈/이후 모든 화면) 동일하게 적용됨 — 개별 화면마다 따로 고칠 필요 없음.
- 로그인 화면에서 실제 스크린샷으로 여백 제거 확인. bottom 인셋은 제스처 네비게이션 바 보호를 위해 유지 — 만약 하단에서도 비슷한 이중 여백이 발견되면 동일한 방식으로(bottom도 제거하거나, 반대로 웹 쪽 하단 패딩을 줄이는 방향으로) 대응.

## 브릿지 실사용 연결 — 후기 작성 사진 첨부 (2026-07-23)
- 사용자 요청: "후기 작성 팝업의 사진 첨부·선택 기능 보완 — PC는 사진 첨부, 모바일은 카메라+갤러리 기능 추가."
- `apps/customer-app/src/screens/common/ReviewWriteScreen.tsx`(예약시공·신차패키지·쇼핑몰 3개 채널 공용 컴포넌트)에 `isNativeBridgeAvailable()`로 분기하는 사진 첨부 UI 추가. 네이티브 브릿지가 있으면(모바일 앱 웹뷰) "촬영"/"앨범" 두 버튼(`captureFromCamera`/`pickFromLibrary` 호출), 없으면(PC 브라우저) 기존 파일 선택 `<input type="file">` 1개 박스. 최대 5장, 썸네일에 X 배지로 개별 삭제 가능.
- 이로써 Phase 2 체크리스트의 "실제 화면에 브릿지 연결" 항목이 충족됨 — 다만 애초 예시로 들었던 화면은 고객센터 1:1 문의였는데, 실제로는 후기 작성 팝업에 먼저 연결됨(사용자가 이 화면을 직접 지정).
- **검증 범위**: Playwright로 PC/웹 경로만 검증 완료(로그인→쇼핑몰 구매→배송완료→구매확정→후기 시트 자동 오픈→별점 선택→`input[type=file].setInputFiles()`로 사진 첨부→썸네일 렌더링까지 스크린샷으로 확인, 콘솔 에러 0건). Playwright의 브라우저 컨텍스트엔 `window.MotoBridge`가 없어 자연스럽게 PC 분기(파일 선택 input)를 타는 것으로 폴백 로직도 함께 검증된 셈.
- **미검증**: 네이티브 경로(촬영/앨범 버튼 → `expo-image-picker` → 브릿지 응답 → 웹 썸네일 렌더링까지)는 `apps/customer-mobile`을 에뮬레이터에서 직접 실행해 터치로 확인해야 함 — 아직 미실시.

## Phase 3 진행 — 운영 URL·앱 아이콘·릴리즈 APK (2026-07-23)
- 사용자가 운영 배포 방식을 확정: 클라우드 호스팅(Vercel 등)이 아니라 **자체 서버 `http://221.141.3.91:8090`에 `apps/customer-app`의 `dist` 폴더를 수작업으로 카피**하는 방식. `src/config.ts`의 운영 `WEB_URL`을 이 주소로 교체. 실제 curl로 확인해보니 서버가 이미 200을 응답하고 있어(사용자가 이미 배포를 마쳤거나 최소한 서버가 살아있는 상태) 릴리즈 APK로 실제 콘텐츠 로딩까지 확인 가능했음.
- **cleartext 트래픽 관련 기존 가정이 틀렸음을 정정**: 이전엔 "운영 URL은 https일 테니 스토어 제출 전에 `usesCleartextTraffic: true`를 제거 검토"라고 남겨뒀는데, 실제 운영 서버가 http(비TLS)로 직접 운영되는 방식이라 이 설정은 계속 필요함. 서버에 TLS(https)를 추후 적용하기 전까지는 유지해야 함 — Play 스토어 제출 시에도 그대로 필요.
- **앱 아이콘 교체**: 사용자가 첨부한 `MotoPayIcon.png`(1254×1254, 파란 라운드사각형 배경 + 흰색 "M" + 노란색 "P", 흰 여백 포함)를 `~/Downloads/`에서 찾아 소스로 사용. ImageMagick이 설치돼 있지 않아(sips만으로는 알파 채널 합성이 어려움) Python/PIL로 직접 처리:
  - 원본에서 흰 여백을 제외한 실제 로고 bbox를 `ImageChops.difference`로 정확히 계산(85,82)-(1168,1169) — 처음엔 단순 중앙 행/열 스캔으로 여백을 계산했다가, 그 크롭을 그대로 브랜드 블루 배경 위에 얹었더니 로고 자체의 부드러운 드롭섀도(흰 배경 위에선 안 보이지만 블루 배경 위에선 하얀 띠처럼 두드러짐) 때문에 로고 주변에 원치 않는 흰 테두리가 생기는 문제 발견 → 배경을 브랜드 블루 대신 **흰색**으로 바꿔서 원본 배경과 자연스럽게 이어지도록 재작업.
  - `android-icon-foreground.png`: 로고를 세이프존(안드로이드 adaptive icon 마스크가 크롭하는 바깥 영역을 고려해 약 72% 스케일)에 맞춰 축소 후 흰 배경 1024×1024에 중앙 배치.
  - `android-icon-monochrome.png`(안드로이드 13+ Material You 테마 아이콘용): 흰색 배경 부분을 투명 처리하고 로고 실루엣만 알파 채널로 남기는 방식으로 생성(색상은 흰색 고정, 알파값만 명암 정보로 사용 — OS가 알아서 테마 색으로 틴트함).
  - `icon.png`(iOS/메인), `favicon.png`, `splash-icon.png`도 같은 소스에서 각각 용도에 맞게 리사이즈·배치.
  - `app.json`의 `android.adaptiveIcon.backgroundColor`를 기존 `#E6F4FE`에서 `#FFFFFF`로 변경(포그라운드 이미지가 이미 불투명 흰 배경을 포함하고 있어 실질적으로 안 보이지만, 설정값 일관성을 위해 맞춤).
- **릴리즈 APK 빌드**: EAS 클라우드 빌드 대신 로컬 Gradle 빌드(`npx expo run:android --variant release`) 채택 — Phase 0에서 이미 로컬 Android 툴체인(JDK/SDK/에뮬레이터)을 전부 구축해둔 상태라 추가로 EAS 계정 연동·크레딧 소모 없이 바로 테스트 가능. 먼저 `npx expo prebuild --platform android --clean`으로 `android/`(gitignore된 CNG 산출물 폴더) 를 새 아이콘·설정 기준으로 재생성해야 함 — 기존 `android/` 폴더가 이미 존재하는 상태에서 `app.json`/에셋만 바꾸면 자동으로 반영되지 않고 명시적 prebuild가 필요했음.
  - 빌드 성공(1분 21초), 산출물 `android/app/build/outputs/apk/release/app-release.apk`(약 71MB). 서명은 디버그 키스토어 — 내부 테스트용으로는 문제없으나 Play 스토어 정식 제출 전에는 별도 release keystore 발급·서명 설정 필요(미해결 항목으로 남김).
  - 에뮬레이터(Pixel_7)에 설치·실행해 런처 아이콘(브랜드 로고 정상 표시)과 앱 실행(운영 URL에서 스플래시→로그인 화면 정상 렌더링, 이전에 고친 상단 이중 여백 버그도 재발 안 함) 모두 확인 완료.
- **트러블슈팅**: 스플래시 화면에서 "탭하여 계속" 안내를 보고 화면을 탭했는데, 스크린샷 뷰어가 보여준 이미지 크기(900폭 표시)와 실제 기기 해상도(1080×2400 네이티브)의 배율 차이를 고려하지 않고 좌표를 그대로 `adb shell input tap`에 넘겨 안드로이드 제스처 내비게이션 영역을 잘못 건드림 → 앱이 백그라운드로 밀려남(크래시 아님, logcat에 FATAL 없음 확인). `adb shell am start`로 재실행하니 기존 프로세스가 살아있는 상태 그대로 복귀되어 로그인 화면 정상 노출. **후속 유의사항**: 스크린샷 좌표로 탭할 때는 반드시 "화면에 표시된 크기 → 실제 기기 해상도" 배율(이번 경우 1.2배)을 곱해서 좌표를 변환할 것, 특히 화면 하단(제스처 내비게이션 존)은 여유를 두고 피할 것.

## 하드웨어 백버튼 — 화면별 실제 뒤로가기 구현 (2026-07-23)
- 사용자 제보: "앱에서 하단 백버튼 클릭하면 뒤로가기가 아니라 앱에서 나가기가 됨" → 원래 의도한 동작이 아님을 확인. 화면별 실제 뒤로가기(각 화면이 이미 갖고 있는 onBack/onClose 로직 재사용) vs 종료 전 확인만 추가(2초 내 재입력 시에만 종료) 중 사용자가 전자를 선택.
- **아키텍처**: `apps/customer-app`이 URL 라우팅이 아니라 React state(`useState`)로 화면을 전환하는 SPA라 웹뷰 자체의 브라우저 히스토리가 비어 있어(`canGoBack` 항상 false), 네이티브 셸이 하드웨어 백버튼을 받으면 웹뷰 히스토리 기준으로는 항상 "더 갈 곳이 없다"고 판단해 곧장 앱을 종료시키던 게 원인.
- **네이티브(`apps/customer-mobile`) 쪽**: `WebViewScreen.tsx`에 `BackHandler.addEventListener("hardwareBackPress", ...)`로 하드웨어 백버튼을 가로채고, 항상 `injectJavaScript`로 `CONSUME_BACK_SCRIPT`를 웹에 주입 → 웹의 `window.__motoConsumeBack()`을 호출해 현재 열린 화면·시트가 자체적으로 처리했는지(true) 아닌지(false)를 확인. 처리 못 했을 때만(더 갈 곳 없는 화면 루트) `window.MotoBridge.postMessage({type:"nav:exit"})`를 보내고, 네이티브 `onMessage`에서 이를 받아 `BackHandler.exitApp()`으로 실제 종료. RN의 `BackHandler` 콜백은 동기적으로 true/false를 반환해야 하는데 웹과의 라운드트립은 비동기라, "항상 일단 true(가로챔)로 응답하고, 나중에 웹의 응답(nav:exit)이 오면 그때 명시적으로 종료" 방식으로 우회함.
  - `protocol.ts`의 `BridgeRequest`에 `{ type: "nav:exit" }` 추가(응답이 필요 없는 단방향 메시지라 `requestId` 없음). `nativeHandler.ts`의 `handleBridgeRequest` 시그니처를 `Exclude<BridgeRequest, {type:"nav:exit"}>`로 좁혀서, nav:exit은 `onMessage`에서 카메라 핸들러로 넘기기 전에 먼저 가로채도록 타입 레벨로도 강제함.
- **웹(`apps/customer-app`) 쪽**: `src/native/backHandler.ts`(신규) — 화면·시트가 열려 있는 동안 "지금 뒤로가기를 누르면 할 일"을 등록하는 간단한 스택(`pushBackAction(fn)` → 해제 함수 반환, LIFO라 가장 최근에 뜬 화면/시트가 항상 우선). 모듈 로드 시 `window.__motoConsumeBack`을 정의해 스택 최상단 액션을 실행하고 true 반환, 스택이 비어있으면 false 반환.
  - `App.tsx`: `view !== "home"`일 때 그 view의 "나가기" 대상과 동일한 곳으로 돌아가는 기본 핸들러 등록(`cs`만 `myp`로, 나머지는 `home`으로 — 기존 JSX의 `onExit`과 정확히 동일하게 맞춤). 이게 각 Flow 자체 등록이 없는 "루트 화면"에서의 기본 폴백 역할을 함.
  - 7개 Flow(`AuthFlow`, `RsvFlow`, `ShopFlow`, `MypFlow`, `NcpkFlow`, `PointFlow`, `CsFlow`) 전부에 `useEffect(() => { ... return pushBackAction(action) }, [screen, sheet, ...])` 추가 — 각 화면에서 이미 JSX에 박혀 있는 `onBack`/`onClose` 콜백을 그대로 미러링(중복 코드지만, 화면마다 이미 결정돼 있는 "뒤로가기가 어디로 가는지" 로직을 새로 설계하지 않고 그대로 재사용하는 게 목표라 의도적으로 그대로 둠). `regdone`/`paydone`처럼 원래 UI에 뒤로가기 버튼 자체가 없는 "완료" 화면은 등록하지 않아, 누르면 상위 스택(Flow 루트 → App.tsx 폴백)으로 자연스럽게 흘러감.
- **검증**:
  1. Playwright로 dev 서버 페이지에서 `window.__motoConsumeBack()`을 직접 호출해 웹 쪽 로직만 독립적으로 검증 — 로그인 루트(false, 종료 기대)/회원가입 verify→login 복귀/홈 루트(false)/쇼핑몰→홈 복귀/상품상세→쇼핑몰 메인 복귀/로그아웃 시트→시트만 닫힘까지 전부 기대대로 동작, 콘솔 에러 0건.
  2. `apps/customer-mobile`을 디버그 빌드(`expo run:android`, `__DEV__` true → 로컬 dev 서버+`adb reverse` 조합)로 에뮬레이터에 설치해 실제 하드웨어 백버튼(`adb shell input keyevent 4`)으로 3가지 핵심 케이스를 logcat 트레이싱과 함께 재확인: ① 홈 루트에서 백 → `nav:exit` 전송 → `BackHandler.exitApp()` 호출 → 런처로 정상 종료(재실행 시 로그인 화면부터 — 진짜 프로세스 종료였음을 확인), ② 쇼핑몰에서 백 → `nav:exit` 전송 안 됨(웹이 자체 처리) → 홈으로 정상 복귀, 앱은 계속 살아있음, ③ 마이페이지의 로그아웃 확인 시트가 뜬 상태에서 백 → 시트만 닫히고 마이페이지 메뉴 유지.
  - **트러블슈팅 메모**: 처음 실기 테스트에서 홈 루트 백버튼이 앱을 종료 안 시키는 것처럼 보여 당황했는데(`dumpsys window`로 focus 확인했더니 여전히 앱), 알고 보니 라운드트립 완료 전에 너무 빨리 확인한 것 + `adb shell pidof`로 프로세스 생존만 확인하면 안 됨(Android가 최근 앱을 백그라운드에 캐싱해두는 게 정상이라 pid는 남아있음) — `dumpsys window`의 `mCurrentFocus`가 런처로 바뀌었는지, 화면 스크린샷이 실제 홈 화면인지로 확인해야 정확함. 근본 원인 확인을 위해 임시로 `console.log` 트레이싱을 추가해 `hardwareBackPress` 발화 → 스크립트 주입 → `onMessage` 수신 → `exitApp()` 호출까지 각 단계를 logcat으로 직접 확인한 뒤, 정상 동작 확인되자 로그는 다시 제거함.
  - 실기기 터치 좌표 관련 유의사항도 재확인: 스크린샷 뷰어가 보여주는 표시 크기(예: 900폭)와 실제 기기 해상도(1080×2400)의 배율(1.2배)을 반드시 곱해서 `adb shell input tap`에 넘겨야 함 — 눈대중으로 좌표를 추정하면 자꾸 빗나가서, `adb shell uiautomator dump`로 정확한 `bounds`를 뽑아 탭하는 방식으로 전환함.
- **아직 다루지 않은 범위**: 이번 구현은 "화면별 실제 뒤로가기"만 다룸. 홈 루트에서의 "한번 더 누르면 종료" 확인 토스트는 추가하지 않음(사용자가 명시적으로 이 옵션 대신 실제 뒤로가기를 선택함) — 필요해지면 App.tsx의 `view==="home"` 폴백이 없는 지점(홈 루트)에만 추가로 얹으면 됨.

## 미해결/후속 확인 필요
- CLAUDE.md의 "Target Platform" 항목이 아직 웹 전용으로 돼 있어, RN 프로젝트 착수(Phase 1) 시점에 "Web & Android(React Native/Expo), iOS 예정" 형태로 갱신할지 확인 필요.
- Pretendard 폰트 등록(Phase 2 잔여 항목)과 나머지 디자인 토큰(타이포/라운드/스페이싱) 이식은 아직 안 함 — 화면 이식 진행하며 필요한 값부터 채우기로 함. (참고: 순수 네이티브 화면 이식 자체가 웹뷰 전환으로 폐기됐으므로, 이 항목은 네이티브 셸에는 더 이상 해당 없음 — 필요하다면 웹 쪽 `apps/customer-app`의 폰트 로딩 문제로만 남음)
- 네이티브(모바일 앱) 촬영/앨범 브릿지 경로는 아직 실기기/에뮬레이터에서 end-to-end 검증되지 않음(위 항목 참고).
- 현재 릴리즈 APK는 디버그 키스토어로 서명됨 — 실제 배포(Play 스토어 또는 실기기 다수 배포)를 하려면 별도 release keystore를 만들고 `android/gradle.properties`·`app/build.gradle`에 서명 설정을 추가해야 함.
- 하드웨어 백버튼 수정은 디버그 빌드로만 검증됨 — Phase 3에서 만든 `app-release.apk`(운영 URL+새 아이콘)는 이 수정 이전 빌드라, 배포용 릴리즈 APK가 다시 필요해지면 `npx expo run:android --variant release`로 재빌드해야 이 수정이 반영됨(웹 쪽 `backHandler.ts`/Flow 변경은 운영 서버에 `dist` 재배포만 하면 되지만, 네이티브 쪽 `WebViewScreen.tsx`의 `BackHandler` 연동은 APK 자체를 다시 빌드해야 함).
