// CU-RSVC-19: 제품 상세 - 일반입찰(GENERAL)은 고객이 요청한 제품명·부위별 농도(썬팅) 실데이터 표시,
// 전문가추천(EXPERT)은 아직 실 카탈로그 연동이 없어 기존 목업(대표이미지·브랜드·스펙 등) 그대로 유지
import shopThumb from "../../assets/images/shop.png";
import { BackIcon, ShieldCheckIcon } from "./rsvIcons";
import { API_BASE_URL } from "../../api/config";

// 상품 설명(리치텍스트)에 담긴 상대경로 이미지를 실제 업로드 URL로 치환 — admin RichTextEditor·다른 상품 검색 화면과 동일 패턴
const CONTENT_IMAGE_REL_PREFIX = "content-images/";
function hydrateContentImageSrcs(html: string): string {
  return html.replaceAll(`src="${CONTENT_IMAGE_REL_PREFIX}`, `src="${API_BASE_URL}/uploads/${CONTENT_IMAGE_REL_PREFIX}`);
}

const PROD_BRAND = "루마 (LLumar)";
const PROD_NAME = "루마 버텍스 300";
const PROD_DESC =
  "멀티레이어 나노 세라믹 구조로 적외선(IR) 차단율이 높아 여름철 실내 온도 상승을 크게 줄여줍니다. 전자기기 신호 간섭이 없는 논메탈 필름이에요.";
const PROD_SPECS: Array<[string, string]> = [
  ["가시광선 투과율", "35% (VLT)"],
  ["적외선 차단율", "96% (IRR)"],
  ["자외선 차단율", "99% (UV)"],
  ["필름 구조", "논메탈 세라믹"],
  ["제조사 보증", "평생 A/S"],
];
const PROD_WARRANTY = "평생 A/S";

export interface ProdDtlInfo {
  itemLabel: string; // 시공 항목명(예: "썬팅·틴팅")
  productName: string | null; // 고객이 요청한 제품명(자유 텍스트) — 미지정이면 null
  brand: string | null; // 실제 카탈로그(tintProducts)에서 매칭된 브랜드 — 매칭 안 되면 null
  spec: string | null; // 매칭된 상품의 가격 요약("00,000원") — 매칭 안 되면 null
  description: string | null; // 매칭된 상품의 실제 상세설명(리치텍스트, Product.description) — 매칭 안 되면 null
  positions: { position: string; level: string }[]; // 썬팅(TINT)일 때만 값 있음
}

interface ProdDtlScreenProps {
  info?: ProdDtlInfo | null;
  onBack: () => void;
}

export default function ProdDtlScreen({ info, onBack }: ProdDtlScreenProps) {
  if (info) {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
        <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
          <div className="flex h-[50px] items-center gap-1.5">
            <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
              ‹
            </span>
            <span className="text-[17px] font-bold text-gray-900">제품 상세</span>
          </div>
        </div>
        <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
          <div className="text-xs font-extrabold text-brand">{info.brand ?? info.itemLabel}</div>
          <div className="mt-[3px] text-[19px] font-extrabold text-gray-900">{info.productName ?? "제품 미지정"}</div>
          {info.spec && <div className="mt-1.5 text-[15px] font-extrabold text-gray-800">{info.spec}</div>}
          {info.description ? (
            <div
              className="mt-3 text-[13px] leading-relaxed text-gray-600 [&_img]:max-w-full [&_img]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: hydrateContentImageSrcs(info.description) }}
            />
          ) : (
            <div className="mt-3 text-[13px] leading-relaxed text-gray-600">
              {info.productName
                ? "요청하신 제품으로 견적을 받았어요. 실제 시공 제품·사양은 업체와 상담 후 최종 확정돼요."
                : "특정 제품을 지정하지 않고 요청해, 업체가 보유한 제품으로 견적을 받았어요."}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto">
        <div className="relative h-[220px] w-full overflow-hidden bg-gray-100">
          <img src={shopThumb} alt="제품 대표이미지" className="h-full w-full object-cover object-center" />
          <span onClick={onBack} className="absolute top-[50px] left-3.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white">
            <BackIcon />
          </span>
        </div>
        <div className="px-5 pt-[18px] pb-6">
          <div className="text-xs font-extrabold text-brand">{PROD_BRAND}</div>
          <div className="mt-[3px] text-[19px] font-extrabold text-gray-900">{PROD_NAME}</div>
          <div className="mt-3 text-[13px] leading-relaxed text-gray-600">{PROD_DESC}</div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">상세 스펙</div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
            {PROD_SPECS.map(([k, v], i) => (
              <div key={k} className={`flex items-center justify-between gap-3 py-3.5 ${i < PROD_SPECS.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-xs text-gray-500">{k}</span>
                <span className="text-right text-[13px] font-bold text-gray-900">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-3.5 flex items-center gap-2.5 rounded-xl bg-brand-subtle px-[15px] py-[13px]">
            <span className="flex-none text-brand">
              <ShieldCheckIcon />
            </span>
            <div className="text-[12.5px] leading-relaxed text-gray-600">
              <b className="text-gray-900">{PROD_WARRANTY}</b> 품질 보증
            </div>
          </div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">시공 예시</div>
          <div className="grid grid-cols-2 gap-1.5">
            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[10px]">
              <img src={shopThumb} alt="시공 예시" className="h-full w-full object-cover object-center" />
            </span>
            <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[10px]">
              <img src={shopThumb} alt="시공 예시" className="h-full w-full object-cover object-center" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
