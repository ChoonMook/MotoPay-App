// CU-RSVC-11: 입찰 내용 상세 - 시공항목별 상품·가격과 합계 확인 후 선택하거나 업체 프로필로 이동
// 항목명 옆에 고객이 요청한 제품명·부위별 농도(썬팅)를 바로 노출하고, "제품 상세"는 실제 카탈로그(tintProducts,
// RsvFlow.tsx가 GET /products?prodCat=TINT&bidApplicable=true로 조회)에서 이름이 일치하는 상품을 찾아
// 브랜드·가격을 채워준다(평점은 DB에 리뷰 데이터가 없어 미표시)
import shopThumb from "../../../assets/images/shop.png";
import Button from "../../../components/ui/Button";
import RsvHeader from "../RsvHeader";
import { ChevronRightIcon, InfoIcon } from "../rsvIcons";
import { INST_CODE_LABELS, TINT_POSITION_LABELS, type Bidder } from "../rsvTypes";
import type { BidRequestItemApi, BidRequestPositionApi } from "../../../api/bidRequests";
import type { ProductApi } from "../../../api/products";
import type { ProdDtlInfo } from "../ProdDtlScreen";
import { nfmt, formatDateOnlyLabel } from "../rsvFormat";

const EMPTY_BIDDER: Bidder = { id: "", shopCode: "", name: "", when: "", date: "", memo: null, items: [] };

function findRequestItem(itemName: string, requestItems: BidRequestItemApi[]) {
  return requestItems.find((it) => (INST_CODE_LABELS[it.instCode] ?? it.instCode) === itemName);
}

/** 항목 행 아래에 바로 보여줄 서브텍스트 — 제품명 + (썬팅이면) 부위별 농도 */
function itemSubtitle(itemName: string, requestItems: BidRequestItemApi[], requestPositions: BidRequestPositionApi[]): string {
  const reqItem = findRequestItem(itemName, requestItems);
  const productName = reqItem?.productName ?? null;
  if (reqItem?.instCode === "TINT" && requestPositions.length) {
    const posSummary = requestPositions.map((p) => `${TINT_POSITION_LABELS[p.position] ?? p.position} ${p.level}%`).join(" · ");
    return productName ? `${productName} · ${posSummary}` : posSummary;
  }
  return productName ?? "제품 미지정";
}

/** "제품 상세" 진입 시 넘길 정보 — 썬팅(TINT)이고 제품명이 실제 카탈로그(tintProducts)에 있으면 브랜드·가격까지 채워줌 */
function buildProdDtlInfo(
  itemName: string,
  requestItems: BidRequestItemApi[],
  requestPositions: BidRequestPositionApi[],
  tintProducts: ProductApi[],
  brandLabel: (code: string) => string,
): ProdDtlInfo {
  const reqItem = findRequestItem(itemName, requestItems);
  const isTint = reqItem?.instCode === "TINT";
  const productName = reqItem?.productName ?? null;
  const matched = isTint && productName ? tintProducts.find((p) => p.name === productName) : undefined;
  return {
    itemLabel: itemName,
    productName,
    brand: matched?.brand ? brandLabel(matched.brand) : null,
    spec: matched ? `${nfmt(matched.price)}원` : null,
    description: matched?.description ?? null,
    positions: isTint ? requestPositions : [],
  };
}

interface BidContDtlScreenProps {
  selId: string;
  bidders: Bidder[];
  /** 요청의 희망일("YYYY-MM-DD") — 업체가 다른 날짜로 응찰했으면 함께 표시 */
  desiredDate: string;
  /** shopCode -> 실제 업체 사진 URL(없으면 null) — GET /shops 응답 기반 */
  photoUrlByShopCode: Record<string, string | null>;
  requestItems: BidRequestItemApi[];
  requestPositions: BidRequestPositionApi[];
  /** "제품 상세" 진입 시 썬팅 제품의 브랜드·가격을 채우기 위한 실제 카탈로그 — RsvFlow.tsx에서 이미 조회해둔 값 재사용 */
  tintProducts: ProductApi[];
  brandLabel: (code: string) => string;
  /** 이미 업체가 선정(SELECTED)됐거나 마감·취소된 요청이면 true — 더 이상 새로 선택할 수 없음 */
  decided: boolean;
  /** 고객이 이미 선택한 응찰번호(없으면 null) — decided일 때 이 업체가 선택된 업체인지 구분 */
  selectedOfferNo: string | null;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenProdDtl: (info: ProdDtlInfo) => void;
  onPick: () => void;
}

export default function BidContDtlScreen({
  selId,
  bidders,
  desiredDate,
  photoUrlByShopCode,
  requestItems,
  requestPositions,
  tintProducts,
  brandLabel,
  decided,
  selectedOfferNo,
  onBack,
  onOpenProfile,
  onOpenProdDtl,
  onPick,
}: BidContDtlScreenProps) {
  const bidder = bidders.find((b) => b.id === selId) ?? bidders[0] ?? EMPTY_BIDDER;
  const total = bidder.items.reduce((s, [, p]) => s + p, 0);
  const isSelectedBidder = selectedOfferNo === selId;
  const ctaLabel = decided
    ? isSelectedBidder
      ? "선택 완료된 업체예요"
      : "다른 업체가 선정되었어요"
    : `이 업체로 선택 · ${nfmt(total)}원`;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <RsvHeader title="입찰 내용 상세" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <span className="h-12 w-12 flex-none overflow-hidden rounded-xl bg-gray-100">
            <img
              src={photoUrlByShopCode[bidder.shopCode] ?? shopThumb}
              alt={bidder.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = shopThumb;
              }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold text-gray-900">{bidder.name}</div>
            <div className="mt-[3px] text-[11.5px] text-gray-500">{bidder.when}</div>
            {bidder.date !== desiredDate && (
              <div className="mt-0.5 text-[11px] text-gray-400">내 희망일 {formatDateOnlyLabel(desiredDate)}</div>
            )}
          </div>
          <span onClick={onOpenProfile} className="flex-none cursor-pointer text-[11.5px] font-bold text-brand">
            프로필 ›
          </span>
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">시공 항목별 견적</div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {bidder.items.map(([name, price], i) => (
            <div
              key={name}
              onClick={() => onOpenProdDtl(buildProdDtlInfo(name, requestItems, requestPositions, tintProducts, brandLabel))}
              className={`flex cursor-pointer items-center justify-between gap-3 py-3.5 ${i < bidder.items.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-gray-900">{name}</div>
                <div className="mt-0.5 text-[11.5px] text-gray-500">{itemSubtitle(name, requestItems, requestPositions)}</div>
                <div className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-brand">
                  제품 상세
                  <ChevronRightIcon color="var(--color-brand)" />
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900 tabular-nums">{nfmt(price)}원</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t-2 border-gray-100 py-[15px]">
            <span className="text-sm font-extrabold text-gray-900">합계</span>
            <span className="text-xl font-extrabold tracking-tight text-brand tabular-nums">{nfmt(total)}원</span>
          </div>
        </div>

        {bidder.memo && bidder.memo.trim() && (
          <>
            <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">업체 메모</div>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[12.5px] leading-relaxed text-gray-600 shadow-sm">
              {bidder.memo}
            </div>
          </>
        )}

        <div className="mt-3.5 flex items-start gap-[9px] rounded-xl bg-gray-100 px-[15px] py-[13px]">
          <span className="mt-px flex-none text-gray-500">
            <InfoIcon />
          </span>
          <div className="text-xs leading-relaxed text-gray-600">
            항목별 가격이 투명하게 공개돼요. 선택하면 결제 단계로 이동하며, 결제 후 업체가 일정 조율 연락을 드려요.
          </div>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" variant={decided ? "secondary" : "primary"} disabled={decided} onClick={onPick}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
