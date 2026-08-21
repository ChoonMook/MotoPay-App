// PT-PROF-01 부가메뉴: 알림함 - 수신 알림 이력 목록 조회, 안읽음 표시, 탭 시 읽음 처리
import { BackIcon } from "./bizIcons";
import type { NotificationApi } from "../../api/notifications";

function NotiBellIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

/** ISO datetime -> "2시간 전"/"어제"/"3일 전" 같은 상대 시간 표기 */
function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  return `${days}일 전`;
}

interface NotiInboxScreenProps {
  onBack: () => void;
  notifications: NotificationApi[];
  loading: boolean;
  onMarkRead: (id: number) => void;
  onOpenTarget: (type: string, data: Record<string, string> | null) => void;
}

export default function NotiInboxScreen({ onBack, notifications, loading, onMarkRead, onOpenTarget }: NotiInboxScreenProps) {
  return (
    <div className="absolute inset-0 bg-gray-50">
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-1.5 border-b border-gray-100 bg-white px-1.5">
        <span onClick={onBack} className="inline-flex cursor-pointer p-2.5 text-gray-800">
          <BackIcon />
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">알림함</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-0 overflow-y-auto px-5 pt-2 pb-6"
        style={{ animation: "mp-screen .32s ease" }}
      >
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
                  onClick={() => {
                    onMarkRead(n.id);
                    onOpenTarget(n.type, n.data);
                  }}
                  className={`flex cursor-pointer gap-2.5 py-3.5 ${i < notifications.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-brand-subtle text-brand">
                    <NotiBellIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13.5px] ${unread ? "font-extrabold" : "font-semibold"} text-gray-800`}>{n.title}</div>
                    <div className="mt-[3px] text-xs leading-[1.4] text-gray-600">{n.body}</div>
                    <div className="mt-[5px] text-[11px] text-gray-500">{formatRelativeTime(n.createdAt)}</div>
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
