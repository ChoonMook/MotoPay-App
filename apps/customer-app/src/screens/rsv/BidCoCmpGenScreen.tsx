// CU-RSVC-10: 입찰 업체 비교(일반) - 응찰 업체 항목별 견적 비교(견적가순 고정 정렬). 카드 탭 시 입찰 내용 상세로 이동
// 평점·거리는 DB에 리뷰/좌표 데이터가 없어 미표시(정렬 옵션도 견적가 하나뿐이라 정렬 UI 자체를 제거)
import shopThumb from "../../assets/images/shop.png";
import RsvHeader from "./RsvHeader";
import Button from "../../components/ui/Button";
import { ClockIcon, CircleXIcon, ChevronRightIcon } from "./rsvIcons";
import type { Bidder } from "./rsvTypes";
import { nfmt, formatDateOnlyLabel } from "./rsvFormat";

function bidTotal(items: Array<[string, number, string]>) {
  return items.reduce((s, [, p]) => s + p, 0);
}

interface BidCoCmpGenScreenProps {
  bidders: Bidder[];
  loading: boolean;
  /** 요청의 희망일("YYYY-MM-DD") — 업체가 다른 날짜로 응찰했으면 카드에 함께 표시 */
  desiredDate: string;
  /** shopCode -> 실제 업체 사진 URL(없으면 null) — GET /shops 응답 기반 */
  photoUrlByShopCode: Record<string, string | null>;
  onSelectBid: (id: string) => void;
  onReRequest: () => void;
  onOpenMyReq: () => void;
  onBack: () => void;
}

export default function BidCoCmpGenScreen({
  bidders,
  loading,
  desiredDate,
  photoUrlByShopCode,
  onSelectBid,
  onReRequest,
  onOpenMyReq,
  onBack,
}: BidCoCmpGenScreenProps) {
  const sorted = [...bidders].sort((a, b) => bidTotal(a.items) - bidTotal(b.items));
  const lowestTotal = sorted.length ? bidTotal(sorted[0].items) : 0;
  const showEmpty = !loading && sorted.length === 0;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="입찰 업체 비교" onBack={onBack} />

      <div className="flex-none flex items-center justify-between border-b border-gray-100 bg-brand-subtle px-5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand">
          <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">
            <ClockIcon />
          </span>
          입찰 진행중 · 마감 D-1
        </span>
        <span onClick={onOpenMyReq} className="inline-flex cursor-pointer items-center gap-0.5 text-[11.5px] font-bold text-brand">
          내 요청 내용
          <ChevronRightIcon color="var(--color-brand)" />
        </span>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center gap-3 px-6 pt-11 pb-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
              <CircleXIcon />
            </span>
            <div className="text-base font-extrabold text-gray-900">도착한 입찰이 없어요</div>
            <div className="max-w-[280px] text-[13px] leading-[1.55] text-gray-600">
              마감까지 응찰한 업체가 없으면 요청은 <b>자동 취소</b>되며, 취소 전 알림으로 미리 안내해 드려요.
            </div>
            <div className="mt-1.5 w-full rounded-xl border border-orange-100 bg-accent-subtle px-[15px] py-[13px] text-left text-xs leading-relaxed text-gray-600">
              <b className="text-accent-strong">자동 취소 예정 · D-1</b>
              <br />
              반경을 넓히거나 조건을 완화해 다시 요청하면 응찰 확률이 높아져요.
            </div>
            <div className="mt-2 w-full">
              <Button variant="outline" size="lg" onClick={onReRequest}>
                조건 바꿔 다시 요청
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((b) => {
              const total = bidTotal(b.items);
              const best = total === lowestTotal;
              return (
                <div key={b.id} onClick={() => onSelectBid(b.id)} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="h-[46px] w-[46px] flex-none overflow-hidden rounded-xl bg-gray-100">
                      <img
                        src={photoUrlByShopCode[b.shopCode] ?? shopThumb}
                        alt={b.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = shopThumb;
                        }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14.5px] font-extrabold text-gray-900">{b.name}</span>
                        {best && <span className="flex-none rounded bg-accent-subtle px-1.5 py-0.5 text-[9.5px] font-extrabold text-accent-strong">최저가</span>}
                      </div>
                      <div className="mt-[3px] text-[11.5px] text-gray-500">{b.when}</div>
                      {b.date !== desiredDate && (
                        <div className="mt-0.5 text-[11px] text-gray-400">내 희망일 {formatDateOnlyLabel(desiredDate)}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-600">{b.items.length}개 항목 · 견적 합계</span>
                    <span className="text-[19px] font-extrabold tracking-tight text-brand tabular-nums">{nfmt(total)}원</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
