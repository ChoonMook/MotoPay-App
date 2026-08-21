// 안드로이드 앱 강제 업데이트 차단 화면 - AD-SYS-06 앱버전관리에서 설정한 최소 지원 버전 미만이면 앱 전체를 덮어 진입을 막는다
// (뒤로가기·다른 화면 진입 불가, "업데이트" 버튼만 동작 — window.location.href로 tel: 링크와 동일하게 네이티브에서 가로채 외부로 열림)
import Button from "./Button";
import type { AppVersionPolicy } from "../../api/appVersion";

interface ForceUpdateScreenProps {
  policy: AppVersionPolicy;
}

export default function ForceUpdateScreen({ policy }: ForceUpdateScreenProps) {
  return (
    <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-white px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-subtle text-3xl">🔄</div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-gray-900">업데이트가 필요해요</h2>
        <p className="text-sm leading-relaxed whitespace-pre-line text-gray-500">{policy.message}</p>
        {policy.latestVersionName && (
          <p className="mt-1 text-xs text-gray-400">최신 버전 {policy.latestVersionName}</p>
        )}
      </div>
      <Button
        onClick={() => {
          if (policy.downloadUrl) window.location.href = policy.downloadUrl;
        }}
        disabled={!policy.downloadUrl}
      >
        업데이트하기
      </Button>
    </div>
  );
}
