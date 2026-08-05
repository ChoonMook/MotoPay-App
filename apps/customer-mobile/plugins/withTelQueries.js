// tel: 링크(해피콜 등)를 네이티브 다이얼러로 넘기려면 Android 11+(API 30+) 패키지 가시성 제한 때문에
// AndroidManifest.xml에 tel: 스킴 조회 권한(<queries>)을 명시적으로 선언해야 한다 — 없으면 Linking.openURL이
// "Can't open url" 경고와 함께 조용히 실패한다(WebViewScreen.tsx의 onShouldStartLoadWithRequest 참고)
const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withTelQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.queries) manifest.queries = [];
    manifest.queries.push({
      intent: [
        {
          action: [{ $: { "android:name": "android.intent.action.DIAL" } }],
          data: [{ $: { "android:scheme": "tel" } }],
        },
        {
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          data: [{ $: { "android:scheme": "tel" } }],
        },
      ],
    });
    return config;
  });
};
