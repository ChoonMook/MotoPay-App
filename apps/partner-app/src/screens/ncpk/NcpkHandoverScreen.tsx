// PT-NCPK-05: 인수확인 대기 - 고객 인수확인 상태 조회, 3일 미확인 시 자동 확정 안내, 인수확인 알림 재발송
import Button from "../../components/ui/Button";
import carImg from "../../assets/images/car.png";
import { CheckBadgeIcon } from "./ncpkIcons";
import type { PackageJobDetail } from "../../api/reservations";

const HO_ROWS = [
  { k: "시공 완료", v: "2026.07.02(목) 오후 5:10" },
  { k: "인수확인 요청", v: "2026.07.02(목) 오후 5:10" },
  { k: "자동 확정 예정", v: "2026.07.05(일)" },
  { k: "정산 예정", v: "인수 확정 후 익월 10일" },
];

interface NcpkHandoverScreenProps {
  job: PackageJobDetail;
  photos: number;
  onBack: () => void;
  onRemind: () => void;
}

export default function NcpkHandoverScreen({ job, photos, onBack, onRemind }: NcpkHandoverScreenProps) {
  // 인수확인 확정 상태를 저장할 모델이 아직 없어 이 화면은 항상 대기 배너만 보여주는 자리표시(placeholder)로 남겨둠
  const hoPending = job.progressStatus !== "인수확정";

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">인수확인 대기</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 ${
            hoPending ? "bg-brand-subtle" : "border border-green-500 bg-status-success-bg"
          }`}
        >
          <span
            className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full ${
              hoPending ? "bg-brand" : "bg-status-success"
            }`}
          >
            <CheckBadgeIcon />
          </span>
          <div>
            <div className={`text-[14.5px] font-extrabold ${hoPending ? "text-brand" : "text-green-600"}`}>
              {hoPending ? "고객 인수확인을 기다리고 있어요" : "인수가 확정됐어요"}
            </div>
            <div className="mt-[3px] text-[12.5px] text-gray-600">
              {hoPending ? "3일 내 미확인 시 자동으로 인수 확정돼요." : "정산 대상에 포함되었어요."}
            </div>
          </div>
        </div>

        <div className="my-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {HO_ROWS.map((r, i) => (
            <div
              key={r.k}
              className={`flex items-center justify-between py-[13px] ${i < HO_ROWS.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <span className="text-[13px] text-gray-500">{r.k}</span>
              <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
            </div>
          ))}
        </div>

        <div className="mx-0.5 mt-[18px] mb-2.5 text-[15px] font-extrabold text-gray-900">
          고객에게 전달된 시공 사진
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: photos }, (_, i) => (
            <div key={i} className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-100">
              <img src={carImg} alt="시공 사진" className="h-auto w-4/5 object-contain" />
            </div>
          ))}
        </div>

        <div className="mt-[18px] rounded-xl bg-gray-100 px-[15px] py-[13px] text-[12.5px] leading-[1.55] text-gray-600">
          고객이 3일 내 확인하지 않으면 자동 인수 확정되며, 확정 시점부터 정산 대상에 포함돼요.
        </div>
      </div>

      {hoPending && (
        <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
          <Button variant="outline" onClick={onRemind}>
            인수확인 알림 재발송
          </Button>
        </div>
      )}
    </div>
  );
}
