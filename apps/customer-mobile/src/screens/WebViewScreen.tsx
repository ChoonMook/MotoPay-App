// apps/customer-app을 그대로 띄우는 웹뷰 셸. 웹 쪽 window.MotoBridge.postMessage 호출을 받아 네이티브 기능(카메라·앨범)을 실행하고
// 결과를 "motobridge" CustomEvent로 웹에 되돌려준다. 프로토콜 정의는 ../bridge/protocol.ts 참고
// 하드웨어 백버튼: 웹의 window.__motoConsumeBack()을 먼저 호출해 화면 안에서 처리됐는지 확인하고,
// 처리 못 했을 때만(=더 갈 곳이 없는 화면 루트) nav:exit 메시지를 받아 앱을 종료함
import { useEffect, useRef } from "react";
import { BackHandler, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { WEB_URL } from "../config";
import { handleBridgeRequest } from "../bridge/nativeHandler";
import type { BridgeRequest } from "../bridge/protocol";

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

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      webViewRef.current?.injectJavaScript(CONSUME_BACK_SCRIPT);
      return true;
    });
    return () => sub.remove();
  }, []);

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

  return (
    // top은 SafeAreaView로 이중 확보하지 않음: apps/customer-app 화면들이 이미 자체적으로 상단 46~50px를
    // 상태바 영역으로 예약해두고 있어(HomeScreen.tsx의 pt-[46px] 등), 여기서도 top 인셋을 적용하면 그 여백이 중복됨
    <SafeAreaView style={styles.flex} edges={["bottom"]}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE_LOAD}
        onMessage={onMessage}
        style={styles.flex}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
