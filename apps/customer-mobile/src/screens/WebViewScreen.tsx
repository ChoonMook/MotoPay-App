// apps/customer-app을 그대로 띄우는 웹뷰 셸. 웹 쪽 window.MotoBridge.postMessage 호출을 받아 네이티브 기능(카메라·앨범)을 실행하고
// 결과를 "motobridge" CustomEvent로 웹에 되돌려준다. 프로토콜 정의는 ../bridge/protocol.ts 참고
// 하드웨어 백버튼: 웹의 window.__motoConsumeBack()을 먼저 호출해 화면 안에서 처리됐는지 확인하고,
// 처리 못 했을 때만(=더 갈 곳이 없는 화면 루트) nav:exit 메시지를 받아 앱을 종료함
// 고객앱/파트너앱 중 마지막으로 보던 쪽을 기억: 두 앱이 서로 다른 origin(포트)이라 각자의 localStorage로는
// 공유가 안 되므로, 네이티브 레이어(AsyncStorage)에서 웹뷰의 최초 진입 URL 자체를 결정한다
import { useEffect, useRef, useState } from "react";
import { BackHandler, Linking, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { WEB_URL, PARTNER_APP_URL } from "../config";
import { handleBridgeRequest } from "../bridge/nativeHandler";
import type { BridgeRequest } from "../bridge/protocol";

type AppKind = "customer" | "partner";

const LAST_APP_KEY = "mp_last_app";

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
  const webViewRef = useRef<WebView>(null);
  const lastAppRef = useRef<AppKind | null>(null);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  // 콜드스타트로 앱이 막 뜬 경우 getLastNotificationResponseAsync가 WebView 페이지 로드가 끝나기 전에 먼저
  // 응답할 수 있음 — 그 시점에 바로 injectJavaScript하면 이후 실제 페이지 탐색이 그 스크립트의 실행 컨텍스트를
  // 통째로 날려버려(콜드스타트 특유의 큰 폰트·번들 다운로드 시간까지 겹치면 거의 항상 발생) 탭이 무시된다.
  // onLoadEnd(페이지 로드 완료)까지 대기 상태로 들고 있다가 그때 주입한다
  const pageLoadedRef = useRef(false);
  const pendingPushDataRef = useRef<Record<string, unknown> | null>(null);

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
  };

  // tel: 링크(해피콜 등)는 웹뷰 안에서 열리지 않으므로 가로채 네이티브 다이얼러로 넘김.
  // Linking.openURL은 canOpenURL 검사를 거치지 않아 Android의 패키지 가시성 제한(API 30+)에 걸리지 않음
  const onShouldStartLoadWithRequest = (request: WebViewNavigation) => {
    if (request.url.startsWith("tel:")) {
      Linking.openURL(request.url);
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
    // top은 SafeAreaView로 이중 확보하지 않음: apps/customer-app 화면들이 이미 자체적으로 상단 46~50px를
    // 상태바 영역으로 예약해두고 있어(HomeScreen.tsx의 pt-[46px] 등), 여기서도 top 인셋을 적용하면 그 여백이 중복됨
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE_LOAD}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={() => {
          pageLoadedRef.current = false;
        }}
        onLoadEnd={onLoadEnd}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        style={styles.flex}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
