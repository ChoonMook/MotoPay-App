// CU-RSVC-15: 결제완료 - 결제 내역 요약(시공 항목별 가격, 썬팅 부위별 농도) + 시공업체 해피콜 예정 안내. 예약시공 메인 진행중 요청으로 이동
import Button from "../../components/ui/Button";
import { PhoneIcon } from "./rsvIcons";
import { selectedEntry, computePayBreakdown } from "./rsvCalc";
import { nfmt } from "./rsvFormat";
import type { Bidder, PayMethodKey, RecoPlan } from "./rsvTypes";
import { TINT_POSITION_LABELS, type PackageSelectionItemView } from "../common/commonTypes";

const PAY_LABEL: Record<PayMethodKey, string> = { card: "신용/체크카드", bank: "무통장 입금" };

interface PayDoneScreenProps {
  selId: string;
  isExpert: boolean;
  bidders: Bidder[];
  recos: RecoPlan[];
  positions: { position: string; level: string }[];
  payMethod: PayMethodKey;
  couponSel: string | null;
  pointUse: number;
  /** 업체·추천안 선택 직후 새로 생성된 실제 예약의 reservationNo — 아직 못 불러왔으면 행 자체를 생략 */
  reservationNo?: string;
  /** 결제 확정 응답의 실제 결제금액 — 결제 이후 보유 포인트가 이미 차감돼 재계산 값과 어긋날 수 있어 이 값을 우선 사용 */
  paidAmount?: number | null;
  onConfirm: () => void;
}

export default function PayDoneScreen({
  selId,
  isExpert,
  bidders,
  recos,
  positions,
  payMethod,
  couponSel,
  pointUse,
  reservationNo,
  paidAmount,
  onConfirm,
}: PayDoneScreenProps) {
  const { isRec, bidder, reco, name: selName } = selectedEntry(selId, isExpert, bidders, recos);
  const { payRemain: computedPayRemain } = computePayBreakdown(selId, isExpert, couponSel, pointUse, Infinity, bidders, recos);
  const payRemain = paidAmount ?? computedPayRemain;
  const rows = [
    { k: "시공 업체", v: selName },
    { k: "결제 수단", v: PAY_LABEL[payMethod] },
    ...(reservationNo ? [{ k: "예약 번호", v: reservationNo }] : []),
  ];

  // CU-RSVC-15 시공 항목 카드 — 응찰(일반입찰)은 instCode 라벨 자체가 항목명, 추천안(전문가추천)은 실제 제품명을 표시.
  // 썬팅(TINT) 항목에는 요청 시점에 선택한 부위별 농도를 함께 표기
  const tintDetail =
    positions.length > 0
      ? positions.map((p) => `${TINT_POSITION_LABELS[p.position] ?? p.position} ${p.level}%`).join(" · ")
      : undefined;
  const items: PackageSelectionItemView[] = isRec
    ? (reco?.plans ?? []).map(([name, , offerPrice, instCode]) => ({
        product: name,
        price: offerPrice,
        tintDetail: instCode === "TINT" ? tintDetail : undefined,
      }))
    : (bidder?.items ?? []).map(([name, price, instCode]) => ({
        product: name,
        price,
        tintDetail: instCode === "TINT" ? tintDetail : undefined,
      }));

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto">
        <div className="px-6 pt-[66px] pb-[34px] text-center text-white" style={{ background: "linear-gradient(160deg,var(--color-brand),var(--color-brand-strong))" }}>
          <div className="mx-auto mb-4 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-white/22">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-[22px] font-extrabold tracking-tight">결제가 완료됐어요</div>
          <div className="mt-1.5 text-[13.5px] text-white/90">{selName} · 시공 예약이 확정됐어요</div>
        </div>

        <div className="px-5 pt-5 pb-6">
          <div className="rounded-2xl border border-gray-200 bg-white px-[18px] shadow-sm">
            {rows.map((r, i) => (
              <div key={r.k} className={`flex items-center justify-between gap-3 py-3.5 ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-xs text-gray-500">{r.k}</span>
                <span className="text-right text-[13.5px] font-bold text-gray-900 tabular-nums">{r.v}</span>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-[18px] shadow-sm">
              <div className="pt-[15px] pb-1 text-[12.5px] font-bold text-gray-500">시공 항목</div>
              {items.map((it, i) => (
                <div key={`${it.product}-${i}`} className="border-b border-gray-100 py-3">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="min-w-0 text-[13.5px] font-bold text-gray-900">{it.product}</div>
                    <span className="flex-none text-[13.5px] font-bold text-gray-900">{nfmt(it.price)}원</span>
                  </div>
                  {it.tintDetail && <div className="mt-1.5 text-[11.5px] text-gray-500">{it.tintDetail}</div>}
                </div>
              ))}
              <div className="flex items-center justify-between py-[13px]">
                <span className="text-[12.5px] text-gray-500">결제 금액</span>
                <span className="text-right text-[13.5px] font-bold text-gray-900">{nfmt(payRemain)}원</span>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-subtle p-3.5">
            <span className="mt-px flex-none text-brand">
              <PhoneIcon />
            </span>
            <div>
              <div className="text-[13px] font-bold text-gray-900">곧 업체가 해피콜을 드려요</div>
              <div className="mt-0.5 text-xs leading-relaxed text-gray-600">
                시공업체가 정확한 방문 일정 조율을 위해 전화를 드릴 예정이에요. 진행 상황은 예약시공 탭에서 확인할 수 있어요.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onConfirm}>
          요청 현황 보기
        </Button>
      </div>
    </div>
  );
}
