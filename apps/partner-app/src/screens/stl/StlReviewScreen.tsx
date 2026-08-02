// PT-STL-03: 후기 조회 - 평균 평점·후기 건수 요약 + 개별 후기 목록(별점·내용·고객명 마스킹·차종), 스크롤 시 페이징 로드
import { stars } from "./stlData";
import type { Review } from "./stlTypes";

interface StlReviewScreenProps {
  avgRating: string;
  avgRatingRounded: number;
  reviewCount: number;
  reviewRows: Review[];
  onBack: () => void;
  onLoadMore: () => void;
}

export default function StlReviewScreen({
  avgRating,
  avgRatingRounded,
  reviewCount,
  reviewRows,
  onBack,
  onLoadMore,
}: StlReviewScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
        <div className="flex h-[50px] items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
            ‹
          </span>
          <span className="text-[17px] font-bold text-gray-900">후기 조회</span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-[18px] py-4">
        <div className="mb-4 flex items-center gap-4 rounded-[14px] border border-gray-200 bg-white p-[18px] shadow-sm">
          <div className="text-center">
            <div className="text-[26px] font-extrabold tabular-nums text-gray-900">{avgRating}</div>
            <div className="mt-0.5 flex gap-px text-[#F5A623]">{stars(avgRatingRounded)}</div>
          </div>
          <div className="flex-1 border-l border-gray-100 pl-4">
            <div className="text-[13px] text-gray-600">전체 후기</div>
            <div className="text-base font-extrabold tabular-nums text-gray-900">{reviewCount}건</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {reviewRows.map((r) => (
            <div key={r.id} className="rounded-[14px] border border-gray-200 bg-white px-4 py-[15px]">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex gap-px text-[13px] text-[#F5A623]">{stars(r.rating)}</span>
                <span className="text-[11.5px] text-gray-500">{r.date}</span>
              </div>
              <div className="mb-2 text-[13.5px] leading-[1.55] text-gray-800">{r.content}</div>
              <div className="text-[11.5px] text-gray-500">
                {r.customer} · {r.car}
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={onLoadMore}
          className="mt-3.5 cursor-pointer rounded-[10px] bg-gray-100 p-[11px] text-center text-[12.5px] font-bold text-gray-600"
        >
          후기 더 보기
        </div>
      </div>
    </div>
  );
}
