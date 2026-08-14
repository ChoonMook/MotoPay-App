// PT-RSVC-12: 시공일시 변경 요청 - 노쇼 등 오프라인 협의 결과를 반영해 새 일시를 제안, 고객이 수락해야 실제 예약 일시가 바뀜
import Button from "../../components/ui/Button";
import type { DailySlot } from "../../api/shopSchedule";
import { formatDesiredDateLabel } from "./rsvcData";
import type { RsvcJob } from "./rsvcTypes";

const RESCHED_REASONS = ["노쇼", "고객 요청", "현장 사정", "기타"];

interface RsvcReschedScreenProps {
  job: RsvcJob;
  reasonDraft: string;
  onChangeReason: (reason: string) => void;
  dateDraft: string; // "YYYY-MM-DD" — 미선택이면 ""
  onOpenDatePick: () => void;
  timeDraft: string; // "HH:mm"
  onChangeTime: (time: string) => void;
  daySlots: DailySlot[];
  loadingSlots: boolean;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export default function RsvcReschedScreen({
  job,
  reasonDraft,
  onChangeReason,
  dateDraft,
  onOpenDatePick,
  timeDraft,
  onChangeTime,
  daySlots,
  loadingSlots,
  submitting,
  onBack,
  onSubmit,
}: RsvcReschedScreenProps) {
  const pending = job.reschedStatus === "sent";
  const rejected = job.reschedStatus === "rejected";

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">시공일시 변경 요청</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="mb-5 rounded-[14px] bg-gray-100 px-4 py-3.5">
          <div className="mb-1 text-[12.5px] text-gray-500">현재 예약</div>
          <div className="text-[15px] font-extrabold text-gray-900">
            {job.customer} · {job.car}
          </div>
          <div className="mt-0.5 text-[13px] text-gray-800">{job.schedule}</div>
        </div>

        {pending ? (
          <div className="flex items-center gap-2 rounded-xl bg-brand-subtle px-3.5 py-3">
            <span className="text-[12.5px] font-bold text-brand">
              {formatDesiredDateLabel(job.reschedDate)} {job.reschedTime}로 변경 요청을 보냈어요 · 고객 확인 대기중이에요
            </span>
          </div>
        ) : (
          <>
            {rejected && (
              <div className="mb-5 rounded-xl border border-status-danger/30 bg-status-danger-bg px-3.5 py-3">
                <div className="text-[12.5px] font-bold text-status-danger">
                  지난 요청({formatDesiredDateLabel(job.reschedDate)} {job.reschedTime})이 거절됐어요
                </div>
                {job.reschedRejectReason && <div className="mt-1 text-[12px] text-gray-600">거절 사유: {job.reschedRejectReason}</div>}
                <div className="mt-1 text-[11.5px] text-gray-500">다른 일시로 다시 요청할 수 있어요</div>
              </div>
            )}

            <div className="mb-2 text-[13px] font-bold text-gray-800">변경 사유</div>
            <div className="mb-[18px] flex flex-wrap gap-2">
              {RESCHED_REASONS.map((r) => (
                <span
                  key={r}
                  onClick={() => onChangeReason(r)}
                  className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] font-bold ${
                    reasonDraft === r ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>

            <div className="mb-2 text-[13px] font-bold text-gray-800">희망 변경 일자</div>
            <div
              onClick={onOpenDatePick}
              className="mb-[18px] flex cursor-pointer items-center justify-between rounded-xl border border-gray-400 bg-white px-3.5 py-[13px]"
            >
              <span className={`text-[13.5px] font-bold ${dateDraft ? "text-gray-800" : "text-gray-400"}`}>
                {dateDraft ? formatDesiredDateLabel(dateDraft) : "날짜를 선택하세요"}
              </span>
              <span className="text-xs font-bold text-brand">선택 ›</span>
            </div>

            {dateDraft && (
              <>
                <div className="mb-2 text-[13px] font-bold text-gray-800">희망 변경 시간</div>
                {loadingSlots ? (
                  <div className="py-6 text-center text-[12.5px] text-gray-400">불러오는 중...</div>
                ) : daySlots.length === 0 ? (
                  <div className="py-6 text-center text-[12.5px] text-gray-400">이 날짜엔 예약 가능한 시간이 없어요</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {daySlots.map((s) => {
                      const full = s.capacity === null || s.isLocked || s.reservedCount >= s.capacity;
                      const sel = timeDraft === s.time;
                      return (
                        <span
                          key={s.time}
                          onClick={() => !full && onChangeTime(s.time)}
                          className={`rounded-[10px] py-3 text-center text-[13px] font-semibold tabular-nums ${
                            full ? "cursor-default" : "cursor-pointer"
                          } ${
                            sel
                              ? "bg-brand font-extrabold text-white"
                              : full
                                ? "bg-gray-100 text-gray-300 line-through"
                                : "border border-gray-400 bg-white text-gray-800"
                          }`}
                        >
                          {s.time}
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {!pending && (
        <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
          <Button disabled={!reasonDraft || !dateDraft || !timeDraft || submitting} onClick={onSubmit}>
            {submitting ? "요청하는 중..." : "변경 요청 보내기"}
          </Button>
        </div>
      )}
    </div>
  );
}
