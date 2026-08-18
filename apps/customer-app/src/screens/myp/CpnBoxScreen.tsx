// CU-MYPG-16: 보유 쿠폰함 - 보유 쿠폰(신차패키지쿠폰+이벤트 할인권·교환권·금액권) 조회, 사용가능/사용완료/만료 필터
import CommonHeader from "../common/CommonHeader";
import { COUPON_STATUS_META, COUPON_ISSUER_META, COUPON_TAB_DEFS } from "./mypData";
import type { CouponItem, CouponStatus } from "./mypData";

interface CpnBoxScreenProps {
  onBack: () => void;
  filter: CouponStatus;
  onSelectFilter: (filter: CouponStatus) => void;
  loading: boolean;
  coupons: CouponItem[];
}

export default function CpnBoxScreen({ onBack, filter, onSelectFilter, loading, coupons }: CpnBoxScreenProps) {
  const cards = coupons.filter((c) => c.status === filter);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="보유 쿠폰함" onBack={onBack} />

      <div className="flex-none bg-white px-5 pt-3.5 pb-1.5">
        <div className="flex gap-1.5">
          {COUPON_TAB_DEFS.map((t) => {
            const on = filter === t.key;
            return (
              <span
                key={t.key}
                onClick={() => onSelectFilter(t.key)}
                className={`cursor-pointer rounded-full px-3.5 py-[9px] text-[13px] font-bold ${on ? "bg-brand text-white" : "bg-gray-50 text-gray-600"}`}
              >
                {t.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-3.5 pb-6">
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-[60px] text-center">
            <div className="text-sm font-bold text-gray-400">불러오는 중...</div>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-[60px] text-center">
            <div className="text-sm font-bold text-gray-600">해당 쿠폰이 없어요</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cards.map((c) => {
              const sm = COUPON_STATUS_META[c.status];
              const im = COUPON_ISSUER_META[c.issuer];
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm"
                  style={{ opacity: c.status === "usable" ? 1 : 0.6 }}
                >
                  <div className="mb-[9px] flex items-center justify-between">
                    <span className="rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold" style={{ color: im.color, background: im.bg }}>
                      {c.issuer}
                    </span>
                    <span className="rounded-md px-[9px] py-[3px] text-[10.5px] font-extrabold" style={{ color: sm.color, background: sm.bg }}>
                      {sm.label}
                    </span>
                  </div>
                  <div className="text-[14.5px] font-extrabold text-gray-800">{c.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{c.desc}</div>
                  <div className="mt-[11px] flex items-center justify-between border-t border-dashed border-gray-200 pt-[11px]">
                    <span className="text-[11.5px] text-gray-500">{c.expiryLabel}</span>
                    <span className="text-[15px] font-extrabold text-brand">{c.discountLabel}</span>
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
