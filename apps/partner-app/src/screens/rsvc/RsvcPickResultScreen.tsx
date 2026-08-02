// PT-RSVC-08: 선정 결과 확인 - 선정/미선정 결과 확인, 선정 시 시공 착수 등록으로 이동
import Button from "../../components/ui/Button";
import { reqInfoRows } from "./rsvcData";
import type { BidReq } from "./rsvcTypes";
import { CheckBadgeIcon, CrossBadgeIcon } from "./rsvcIcons";

interface RsvcPickResultScreenProps {
  req: BidReq;
  onBack: () => void;
  onStartRegister: () => void;
}

export default function RsvcPickResultScreen({ req, onBack, onStartRegister }: RsvcPickResultScreenProps) {
  const picked = !!req.picked;
  const rows = reqInfoRows(req);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">선정 결과 확인</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className={`flex items-center gap-3 rounded-2xl p-4 ${picked ? "bg-brand-subtle" : "bg-gray-100"}`}>
          <span className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full ${picked ? "bg-brand" : "bg-gray-500"}`}>
            {picked ? <CheckBadgeIcon /> : <CrossBadgeIcon />}
          </span>
          <div>
            <div className={`text-[15.5px] font-extrabold ${picked ? "text-brand" : "text-gray-900"}`}>
              {picked ? "축하해요, 선정되었어요!" : "이번엔 선정되지 않았어요"}
            </div>
            <div className="mt-[3px] text-[12.5px] text-gray-600">
              {picked ? "고객이 견적을 확정했어요. 시공 착수를 등록해 주세요." : "다른 요청에도 계속 도전해 보세요."}
            </div>
          </div>
        </div>

        <div className="my-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {rows.map((r, i) => (
            <div key={r.k} className={`flex items-center justify-between py-[11px] ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-[13px] text-gray-500">{r.k}</span>
              <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {picked && (
        <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
          <Button onClick={onStartRegister}>시공 착수 등록하기</Button>
        </div>
      )}
    </div>
  );
}
