// PT-RSVC-11: 시공일시 변경 요청 - 노쇼 등 오프라인 협의 결과를 반영해 일정 변경을 신청, 고객 확인 전까지 기존 예약 유지
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import type { RsvcJob } from "./rsvcTypes";

const RESCHED_REASONS = ["노쇼", "고객 요청", "현장 사정", "기타"];

interface RsvcReschedScreenProps {
  job: RsvcJob;
  onChangeReason: (reason: string) => void;
  onChangeDt: (dt: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function RsvcReschedScreen({ job, onChangeReason, onChangeDt, onBack, onSubmit }: RsvcReschedScreenProps) {
  const pending = job.reschedStatus === "sent";

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
            <span className="text-[12.5px] font-bold text-brand">변경 요청을 보냈어요 · 고객 확인 대기중이에요</span>
          </div>
        ) : (
          <>
            <div className="mb-2 text-[13px] font-bold text-gray-800">변경 사유</div>
            <div className="mb-[18px] flex flex-wrap gap-2">
              {RESCHED_REASONS.map((r) => (
                <span
                  key={r}
                  onClick={() => onChangeReason(r)}
                  className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] font-bold ${
                    job.reschedReason === r ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
            <Input
              label="희망 변경 일시"
              placeholder="예) 2026-08-05 14:00"
              value={job.reschedDt}
              onChange={(e) => onChangeDt(e.target.value)}
            />
          </>
        )}
      </div>

      {!pending && (
        <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
          <Button disabled={!job.reschedReason || !job.reschedDt} onClick={onSubmit}>
            변경 요청 보내기
          </Button>
        </div>
      )}
    </div>
  );
}
