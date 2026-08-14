// CU-RSVC-19: 내 요청 상세 - 입찰/추천 도착 여부와 무관하게 언제든 내가 신청한 시공항목·제품·부위별 농도·조건을 확인
import RsvHeader from "./RsvHeader";
import { INST_CODE_LABELS, TINT_POSITION_LABELS } from "./rsvTypes";
import type { BidRequestItemApi, BidRequestPositionApi } from "../../api/bidRequests";
import { nfmt } from "./rsvFormat";

interface RsvMyReqDtlScreenProps {
  reqType: "GENERAL" | "EXPERT";
  items: BidRequestItemApi[];
  positions: BidRequestPositionApi[];
  budget: number | null;
  radiusKm: number;
  minRating: number | null;
  desiredDate: string; // "YYYY-MM-DD"
  /** 요청 시점 제품명 -> 실 카탈로그 참고 판매가(GET /products) — 없으면 가격 행을 표시하지 않음 */
  priceByProductName: Record<string, number>;
  loadingPrices: boolean;
  onBack: () => void;
}

function formatDateLabel(desiredDate: string): string {
  const d = new Date(`${desiredDate}T00:00:00`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${weekday})`;
}

export default function RsvMyReqDtlScreen({
  reqType,
  items,
  positions,
  budget,
  radiusKm,
  minRating,
  desiredDate,
  priceByProductName,
  loadingPrices,
  onBack,
}: RsvMyReqDtlScreenProps) {
  const infoRows: Array<[string, string]> =
    reqType === "GENERAL"
      ? [
          ["희망 시공일", formatDateLabel(desiredDate)],
          ["업체 검색 반경", `${radiusKm}km`],
          ["업체 평점 조건", minRating ? `${minRating.toFixed(1)}★ 이상` : "전체"],
        ]
      : [
          ["희망 시공일", formatDateLabel(desiredDate)],
          ["예산", `${nfmt(budget ?? 0)}원 이하`],
        ];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="내 요청 상세" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {infoRows.map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between py-[11px] ${i < infoRows.length - 1 ? "border-b border-gray-100" : ""}`}>
              <span className="text-[13px] text-gray-500">{k}</span>
              <span className="text-[13.5px] font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[15px] font-extrabold text-gray-900">
          {reqType === "GENERAL" ? "요청한 시공 항목" : "관심 카테고리"}
        </div>
        <div className="flex flex-col gap-2">
          {items.map((it, i) => {
            const name = INST_CODE_LABELS[it.instCode] ?? it.instCode;
            const posSummary =
              it.instCode === "TINT" && positions.length > 0
                ? positions.map((p) => `${TINT_POSITION_LABELS[p.position] ?? p.position} ${p.level}%`).join(" · ")
                : "";
            const spec = [it.productName, posSummary].filter(Boolean).join(" · ");
            const refPrice = it.productName ? priceByProductName[it.productName] : undefined;
            return (
              <div key={`${it.instCode}-${i}`} className="flex items-center gap-2.5 rounded-[14px] border border-gray-200 bg-white px-[15px] py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-gray-800">{name}</div>
                  {spec && <div className="mt-0.5 text-[11.5px] text-gray-500">{spec}</div>}
                </div>
                {loadingPrices ? (
                  <div className="flex-none text-[11px] text-gray-400">조회중...</div>
                ) : (
                  refPrice != null && (
                    <div className="flex-none text-right">
                      <div className="text-[10.5px] text-gray-400">판매가</div>
                      <div className="text-[12.5px] font-bold text-gray-600">{nfmt(refPrice)}원</div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
