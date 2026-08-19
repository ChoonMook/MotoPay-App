// CU-MYPG-12: 알림함 - 수신 알림 이력 목록 조회, 안읽음 표시, 탭 시 읽음 처리
import { BackIcon } from "../common/commonIcons";
import { NotiIcon } from "./mypIcons";
import type { NotiItem } from "./mypData";

interface NotiInboxScreenProps {
  onBack: () => void;
  onOpenSettings: () => void;
  notifications: NotiItem[];
  onMarkRead: (id: string) => void;
  loading?: boolean;
}

export default function NotiInboxScreen({ onBack, onOpenSettings, notifications, onMarkRead, loading = false }: NotiInboxScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <BackIcon />
          </span>
          <span className="text-base font-bold text-gray-900">알림함</span>
          <span onClick={onOpenSettings} className="ml-auto cursor-pointer text-xs font-bold text-gray-500">
            알림 설정
          </span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-2 pb-6">
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-[60px] text-center">
            <div className="text-sm font-bold text-gray-400">불러오는 중...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-[60px] text-center">
            <div className="text-sm font-bold text-gray-600">받은 알림이 없어요</div>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n, i) => {
              const unread = !n.isRead;
              return (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`flex cursor-pointer gap-2.5 py-3.5 ${i < notifications.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-brand-subtle text-brand">
                    <NotiIcon icon={n.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13.5px] ${unread ? "font-extrabold" : "font-semibold"} text-gray-800`}>{n.title}</div>
                    <div className="mt-[3px] text-xs leading-[1.4] text-gray-600">{n.body}</div>
                    <div className="mt-[5px] text-[11px] text-gray-500">{n.time}</div>
                  </div>
                  {unread && <span className="mt-1 h-2 w-2 flex-none rounded-full bg-accent" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
