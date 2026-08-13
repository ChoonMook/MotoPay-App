// CU-NCPK-05: 시공업체 선택 - 딜러사 지정 업체 목록에서 선택, 업체명 탭 시 프로필 팝업 진입
import Button from "../../components/ui/Button";
import shopThumb from "../../assets/images/shop.png";
import NcpHeader from "./NcpHeader";

// rating/reviews/distLabel 모두 GET /shops 응답(평균평점·후기수·위치기반 거리)을 NcpkFlow가 가공해 내려준다.
// official("공식") 배지만 아직 대응하는 백엔드 데이터가 없어 항상 false
export interface ShopView {
  shopCode: string;
  name: string;
  official: boolean;
  rating: string;
  reviews: string;
  distLabel: string;
  categories: string[];
  intro: string | null;
  greeting: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
}

interface PtnSelScreenProps {
  onBack: () => void;
  onProceed: () => void;
  shops: ShopView[];
  shopIndex: number;
  onSelectShop: (i: number) => void;
  onViewProfile: () => void;
}

export default function PtnSelScreen({ onBack, onProceed, shops, shopIndex, onSelectShop, onViewProfile }: PtnSelScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <NcpHeader title="시공업체 선택" onBack={onBack} step={1} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[18px] pb-6">
        <div className="mb-3.5 rounded-[10px] bg-gray-100 px-[13px] py-[11px] text-[13px] leading-relaxed text-gray-600">
          선택한 시공 항목을 <b>모두 지원</b>하는 딜러사 지정 업체만 보여드려요.
        </div>

        {shops.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-gray-300 bg-white p-6 text-center text-[13px] text-gray-500">
            등록된 시공업체가 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shops.map((s, i) => {
              const sel = shopIndex === i;
              return (
                <div
                  key={s.shopCode}
                  onClick={() => onSelectShop(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3.5 ${
                    sel ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white shadow-sm"
                  }`}
                >
                  <span className="h-[60px] w-[60px] flex-none overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={s.photoUrl ?? shopThumb}
                      alt={s.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = shopThumb;
                      }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-bold text-gray-900">{s.name}</span>
                      {s.official && (
                        <span className="rounded bg-brand-subtle px-[5px] py-[1.5px] text-[9.5px] font-extrabold text-brand">
                          공식
                        </span>
                      )}
                    </div>
                    <div className="mt-[3px] text-xs text-gray-500">
                      ★ {s.rating} · 후기 {s.reviews} · {s.distLabel}
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile();
                      }}
                      className="mt-1.5 inline-flex items-center gap-[3px] text-xs font-bold text-brand"
                    >
                      업체 프로필 보기 ›
                    </div>
                  </div>
                  <span
                    className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-xs text-white ${
                      sel ? "bg-brand" : "border-2 border-gray-300"
                    }`}
                  >
                    {sel ? "✓" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onProceed}>
          이 업체로 진행하기
        </Button>
      </div>
    </div>
  );
}
