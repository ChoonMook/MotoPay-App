// apps/customer-app을 그대로 띄우는 웹뷰 셸. 웹 쪽 window.MotoBridge.postMessage 호출을 받아 네이티브 기능(카메라·앨범)을 실행하고
// 결과를 "motobridge" CustomEvent로 웹에 되돌려준다. 프로토콜 정의는 ../bridge/protocol.ts 참고
// 하드웨어 백버튼: 웹의 window.__motoConsumeBack()을 먼저 호출해 화면 안에서 처리됐는지 확인하고,
// 처리 못 했을 때만(=더 갈 곳이 없는 화면 루트) nav:exit 메시지를 받아 앱을 종료함
// 고객앱/파트너앱 중 마지막으로 보던 쪽을 기억: 두 앱이 서로 다른 origin(포트)이라 각자의 localStorage로는
// 공유가 안 되므로, 네이티브 레이어(AsyncStorage)에서 웹뷰의 최초 진입 URL 자체를 결정한다
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  DeviceEventEmitter,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent, type WebViewNavigation, type WebViewProps } from "react-native-webview";

// WebViewOpenWindowEvent는 react-native-webview 최상위에서 export되지 않아 Props 타입에서 역으로 추출
type WebViewOpenWindowEvent = Parameters<NonNullable<WebViewProps["onOpenWindow"]>>[0];
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { WEB_URL, PARTNER_APP_URL } from "../config";
import { handleBridgeRequest } from "../bridge/nativeHandler";
import type { BridgeRequest } from "../bridge/protocol";

type AppKind = "customer" | "partner";

const LAST_APP_KEY = "mp_last_app";

// 안드로이드 기본 WebView User-Agent에는 " wv)" 표시가 붙어 일반 모바일 브라우저와 구분된다 — PASS/NICE 등
// 일부 PG사 페이지는 이를 감지해 "인앱 웹뷰"로 판단하고 이름 확인 등 일부 UI 단계를 건너뛴 축약 흐름을 태우는
// 것으로 확인됨(실제 발생: SMS 인증은 정상, PASS 인증만 이름입력 없이 바로 완료로 넘어감 — 웹 브라우저에서는
// 둘 다 정상). "wv" 마커만 제거한 일반 Chrome 모바일 UA로 오버라이드해 PG사가 일반 브라우저로 인식하게 한다
const ANDROID_CHROME_USER_AGENT =
  Platform.OS === "android"
    ? `Mozilla/5.0 (Linux; Android ${Platform.constants.Release}; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.122 Mobile Safari/537.36`
    : undefined;

function classifyUrl(url: string): AppKind | null {
  if (url.startsWith(WEB_URL)) return "customer";
  if (url.startsWith(PARTNER_APP_URL)) return "partner";
  return null;
}

const INJECTED_BEFORE_LOAD = `
  window.MotoBridge = {
    postMessage: function (message) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    },
  };
  true;
`;

const CONSUME_BACK_SCRIPT = `
  (function () {
    var handled = window.__motoConsumeBack && window.__motoConsumeBack();
    if (!handled) {
      window.MotoBridge.postMessage({ type: "nav:exit" });
    }
    true;
  })();
`;

// 백그라운드→포그라운드 복귀 시 웹의 강제 업데이트 재확인 트리거(App.tsx의 window.__motoHandleForeground) — 앱을 오래
// 켜둔 채 쓰는 사용자도 다음 포그라운드 복귀 시점엔 최신 정책을 반영하도록
const FOREGROUND_SCRIPT = `
  (function () {
    window.__motoHandleForeground && window.__motoHandleForeground();
    true;
  })();
`;

// PortOne 본인인증 팝업(모달 웹뷰)이 우리 origin으로 돌아와 닫혔을 때 웹의 재확인 트리거(App.tsx의
// window.__motoHandlePortOneReturn) — 팝업 자체는 창 참조가 없는 별도 웹뷰라 window.opener/postMessage로
// 결과를 돌려줄 수 없어서, "우리 도메인으로 돌아왔다 = 끝났다"만 신호로 주고 실제 결과는 서버에 재조회한다
const PORTONE_RETURN_SCRIPT = `
  (function () {
    window.__motoHandlePortOneReturn && window.__motoHandlePortOneReturn();
    true;
  })();
`;

// SMS Retriever API로 받은 인증번호를 웹(아이디/비밀번호 찾기 화면)에 전달(App.tsx의 window.__motoHandleSmsCode)
function smsCodeScript(code: string): string {
  return `
    (function () {
      window.__motoHandleSmsCode && window.__motoHandleSmsCode(${JSON.stringify(code)});
      true;
    })();
  `;
}

// 웹(customer-app/partner-app)이 아직 로딩·부트 중일 수 있어(콜드스타트로 푸시를 탭한 경우 특히) window.__motoHandlePushTap이
// 바로 존재하지 않을 수 있음 — 최대 2초(100ms x 20회) 폴링 후 호출. 웹 쪽 구현은 각 앱 App.tsx 참고
function pushTapScript(data: Record<string, unknown>): string {
  return `
    (function () {
      var data = ${JSON.stringify(data)};
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (window.__motoHandlePushTap) {
          clearInterval(t);
          window.__motoHandlePushTap(data);
        } else if (tries > 20) {
          clearInterval(t);
        }
      }, 100);
    })();
    true;
  `;
}

export default function WebViewScreen() {
  // Modal 안의 팝업 웹뷰 상단 패딩 계산용 — useSafeAreaInsets()와 StatusBar.currentHeight 둘 다
  // 실측상 동일한 값을 반환하지만(둘 다 dp 단위), 기기별 편차에 대비해 더 큰 쪽을 채택한다
  const insets = useSafeAreaInsets();
  const androidStatusBarHeight = StatusBar.currentHeight ?? 0;
  const webViewRef = useRef<WebView>(null);
  const lastAppRef = useRef<AppKind | null>(null);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  // 콜드스타트로 앱이 막 뜬 경우 getLastNotificationResponseAsync가 WebView 페이지 로드가 끝나기 전에 먼저
  // 응답할 수 있음 — 그 시점에 바로 injectJavaScript하면 이후 실제 페이지 탐색이 그 스크립트의 실행 컨텍스트를
  // 통째로 날려버려(콜드스타트 특유의 큰 폰트·번들 다운로드 시간까지 겹치면 거의 항상 발생) 탭이 무시된다.
  // onLoadEnd(페이지 로드 완료)까지 대기 상태로 들고 있다가 그때 주입한다
  const pageLoadedRef = useRef(false);
  const pendingPushDataRef = useRef<Record<string, unknown> | null>(null);
  // PortOne 본인인증 등 window.open()으로 뜨는 팝업 — 안드로이드 WebView는 기본적으로 window.open()을
  // "user gesture 없는 intent"로 취급해 막아버려서(실제 발생 확인), setSupportMultipleWindows로 직접 받아
  // 모달 웹뷰로 띄운다. 진짜 window.opener 관계가 아니라 postMessage로 결과를 받을 수 없으므로, 팝업이
  // 우리 origin(WEB_URL/PARTNER_APP_URL)으로 돌아오면 "끝났다"로 보고 닫은 뒤 웹에 재확인을 맡긴다
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  // 우리 자체 페이지(customer-app/partner-app)는 이미 CSS로 상단 46~50px를 스스로 예약해두지만, PortOne
  // 본인인증처럼 리디렉션으로 나가는 PASS/NICE 등 외부 도메인 페이지는 그런 여백이 전혀 없어 카메라 홀/상태바에
  // 그대로 깔린다(실제 발생 확인) — 외부 도메인일 때만 네이티브에서 상단 안전영역 패딩을 대신 확보해준다
  const [isExternalPage, setIsExternalPage] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LAST_APP_KEY).then((value) => {
      const lastApp = value === "partner" ? "partner" : "customer";
      lastAppRef.current = lastApp;
      setInitialUrl(lastApp === "partner" ? PARTNER_APP_URL : WEB_URL);
    });
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      webViewRef.current?.injectJavaScript(CONSUME_BACK_SCRIPT);
      return true;
    });
    return () => sub.remove();
  }, []);

  // SmsRetrieverModule이 emit하는 원문 SMS 텍스트에서 인증번호(6자리)만 뽑아 웹에 전달
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("SmsRetrieved", (event: { message?: string }) => {
      const code = event.message?.match(/\d{6}/)?.[0];
      if (code) webViewRef.current?.injectJavaScript(smsCodeScript(code));
    });
    return () => sub.remove();
  }, []);

  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        webViewRef.current?.injectJavaScript(FOREGROUND_SCRIPT);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // 페이지가 이미 로드돼 있으면 바로 주입, 아니면 onLoadEnd가 대신 처리하도록 보관만 해둠
  // (pageLoadedRef는 항상 최신값을 봐야 해서 상태 대신 ref — 아래 이펙트가 [initialUrl] 마운트 시점에만
  // 한 번 구독하므로 클로저에 갇힌 state를 쓰면 그 시점 값(false)으로 고정돼버림)
  const deliverPushTap = (data: Record<string, unknown>) => {
    if (pageLoadedRef.current) {
      webViewRef.current?.injectJavaScript(pushTapScript(data));
    } else {
      pendingPushDataRef.current = data;
    }
  };

  // 푸시 알림 탭 → 웹 쪽 window.__motoHandlePushTap(data)로 전달해 특정 화면으로 이동시킴.
  // 포그라운드/백그라운드 탭은 리스너로, 완전종료 상태에서 탭해 앱이 새로 뜬 경우(콜드스타트)는
  // getLastNotificationResponseAsync로 마지막 응답을 조회해 동일하게 처리
  useEffect(() => {
    if (!initialUrl) return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data;
      if (data) deliverPushTap(data);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data) deliverPushTap(data);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  const onLoadEnd = () => {
    pageLoadedRef.current = true;
    if (pendingPushDataRef.current) {
      webViewRef.current?.injectJavaScript(pushTapScript(pendingPushDataRef.current));
      pendingPushDataRef.current = null;
    }
  };

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    const appKind = classifyUrl(navState.url);
    if (appKind && appKind !== lastAppRef.current) {
      lastAppRef.current = appKind;
      AsyncStorage.setItem(LAST_APP_KEY, appKind);
    }
    setIsExternalPage(!appKind);
  };

  const onOpenWindow = (event: WebViewOpenWindowEvent) => {
    setPopupUrl(event.nativeEvent.targetUrl);
  };

  const onPopupNavigationStateChange = (navState: WebViewNavigation) => {
    if (classifyUrl(navState.url)) {
      setPopupUrl(null);
      webViewRef.current?.injectJavaScript(PORTONE_RETURN_SCRIPT);
    }
  };

  // tel: 링크(해피콜 등)는 웹뷰 안에서 열리지 않으므로 가로채 네이티브 다이얼러로 넘김.
  // Linking.openURL은 canOpenURL 검사를 거치지 않아 Android의 패키지 가시성 제한(API 30+)에 걸리지 않음
  const onShouldStartLoadWithRequest = (request: WebViewNavigation) => {
    if (request.url.startsWith("tel:")) {
      Linking.openURL(request.url);
      return false;
    }
    // APK 다운로드(앱버전관리 강제 업데이트 등)는 웹뷰 안에서 열지 않고 시스템 브라우저로 넘김 — 안드로이드 WebView는
    // APK 다운로드를 자체 처리하지 못함. "우리 origin이 아니면 전부 외부로" 식으로 넓게 걸었더니(2026-08-21)
    // PortOne 본인인증처럼 NICE/PASS 등 여러 도메인을 오가며 웹뷰 안에서 그대로 진행돼야 하는 리다이렉트 흐름까지
    // 튕겨나가 멈춰버리는 문제가 있어(실제 발생 확인) .apk 확장자로만 좁힘
    if (request.url.toLowerCase().includes(".apk")) {
      Linking.openURL(request.url);
      return false;
    }
    // PASS 인증 등에서 특정 앱(통신사 PASS 앱)으로 전환하기 위해 쓰는 안드로이드 전용 intent:// URL —
    // WebView는 이 스킴을 그대로 로드하지 못해 net::ERR_ABORTED로 조용히 실패한다(실제 발생 확인: 앱 전환이
    // 아예 안 일어나 PASS 앱 알림 자체가 오지 않았음 — 일반 브라우저는 이 스킴을 자동으로 처리해줘서 정상 작동함).
    // "#Intent;scheme=xxx;...;end" 안의 scheme 파라미터를 뽑아 일반 커스텀 스킴 URL(xxx://호스트+쿼리)로
    // 재구성해 직접 연다. 대상 앱이 없으면 Linking.openURL이 실패하는데, 이 경우 KCP가 별도 fallback URL을
    // 안 주는 게 확인돼(SKT 케이스) 조용히 무시한다(사용자에게는 KCP 페이지 자체의 안내 문구가 노출됨)
    if (request.url.startsWith("intent://")) {
      const schemeMatch = request.url.match(/[;#]scheme=([^;]+);/);
      if (schemeMatch) {
        const path = request.url.slice("intent://".length).split("#")[0];
        Linking.openURL(`${schemeMatch[1]}://${path}`).catch(() => {});
      }
      return false;
    }
    return true;
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    let request: BridgeRequest;
    try {
      request = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (request.type === "nav:exit") {
      BackHandler.exitApp();
      return;
    }
    const response = await handleBridgeRequest(request);
    const script = `window.dispatchEvent(new CustomEvent("motobridge", { detail: ${JSON.stringify(response)} })); true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  if (!initialUrl) {
    // 마지막 사용 앱(AsyncStorage) 조회 중 — 짧은 순간이라 빈 화면으로 대기
    return <View style={styles.flex} />;
  }

  return (
    // top은 기본적으로 SafeAreaView로 이중 확보하지 않음: apps/customer-app 화면들이 이미 자체적으로 상단
    // 46~50px를 상태바 영역으로 예약해두고 있어(HomeScreen.tsx의 pt-[46px] 등), 여기서도 top 인셋을 적용하면
    // 그 여백이 중복됨. 다만 PortOne 본인인증처럼 리디렉션으로 나가는 PASS/NICE 등 외부 도메인 페이지는 그런
    // CSS 여백이 없어 카메라 홀/상태바에 그대로 깔리므로(실제 발생 확인), 외부 페이지일 때만 top도 확보한다
    <SafeAreaView style={styles.flex} edges={isExternalPage ? ["top", "bottom"] : ["bottom"]}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        userAgent={ANDROID_CHROME_USER_AGENT}
        // react-native-webview는 기본적으로 http(s)://만 화이트리스트에 넣어서, 화이트리스트를 벗어난 URL은
        // 우리 onShouldStartLoadWithRequest에 도달하지도 못하고 라이브러리가 원본 URL 그대로 자체
        // Linking.openURL을 먼저 시도해버린다(intent://...#Intent;...;end 형식은 이렇게 열면 항상 실패함 —
        // 실제 발생 확인: PASS 인증 앱전환이 전혀 안 됐던 진짜 원인). intent:를 화이트리스트에 추가해
        // onShouldStartLoadWithRequest의 scheme 재구성 로직까지 도달하게 한다
        originWhitelist={["http://*", "https://*", "intent://*"]}
        injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE_LOAD}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={() => {
          pageLoadedRef.current = false;
        }}
        onLoadEnd={onLoadEnd}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        setSupportMultipleWindows
        javaScriptCanOpenWindowsAutomatically
        onOpenWindow={onOpenWindow}
        style={styles.flex}
      />

      {/* PortOne 본인인증 등 window.open() 팝업 — 별도 모달 웹뷰로 표시(위 onOpenWindow 주석 참고).
          statusBarTranslucent로 안드로이드 상태바 아래 실제 인셋을 받아오고, SafeAreaView 대신 훅으로 직접
          top 패딩을 줌(Modal 안의 SafeAreaView는 별도 윈도우 취급되어 인셋을 못 받아오는 경우가 있어 실제로
          팝업 상단이 카메라 홀/상태바까지 침범하는 문제가 있었음) */}
      <Modal
        visible={!!popupUrl}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPopupUrl(null)}
      >
        <View style={[styles.flex, { paddingTop: Math.max(androidStatusBarHeight, insets.top), paddingBottom: insets.bottom }]}>
          <View style={styles.popupHeader}>
            <Pressable onPress={() => setPopupUrl(null)} hitSlop={12}>
              <Text style={styles.popupClose}>닫기</Text>
            </Pressable>
          </View>
          {popupUrl && (
            <WebView
              source={{ uri: popupUrl }}
              userAgent={ANDROID_CHROME_USER_AGENT}
              onNavigationStateChange={onPopupNavigationStateChange}
              style={styles.flex}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  popupClose: { fontSize: 15, fontWeight: "700", color: "#333" },
});
