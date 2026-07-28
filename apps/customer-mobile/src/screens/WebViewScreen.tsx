// apps/customer-app을 그대로 띄우는 웹뷰 셸. 웹 쪽 window.MotoBridge.postMessage 호출을 받아 네이티브 기능(카메라·앨범)을 실행하고
// 결과를 "motobridge" CustomEvent로 웹에 되돌려준다. 프로토콜 정의는 ../bridge/protocol.ts 참고
// 하드웨어 백버튼: 웹의 window.__motoConsumeBack()을 먼저 호출해 화면 안에서 처리됐는지 확인하고,
// 처리 못 했을 때만(=더 갈 곳이 없는 화면 루트) nav:exit 메시지를 받아 앱을 종료함
// 고객앱/파트너앱 중 마지막으로 보던 쪽을 기억: 두 앱이 서로 다른 origin(포트)이라 각자의 localStorage로는
// 공유가 안 되므로, 네이티브 레이어(AsyncStorage)에서 웹뷰의 최초 진입 URL 자체를 결정한다
import { useEffect, useRef, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const lastAppRef = useRef<AppKind | null>(null);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

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

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    const appKind = classifyUrl(navState.url);
    if (appKind && appKind !== lastAppRef.current) {
      lastAppRef.current = appKind;
      AsyncStorage.setItem(LAST_APP_KEY, appKind);
    }
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
        style={styles.flex}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
