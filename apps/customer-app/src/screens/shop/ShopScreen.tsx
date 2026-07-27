// CU-SHOP-01: 쇼핑몰 주화면 - 프로모션 배너, 카테고리 바로가기, 베스트 상품 그리드, 하단 내비게이션
import { NavHomeIcon, NavResvIcon, NavShopIcon, NavMyIcon } from "../home/homeIcons";
import { SearchIcon, CartIcon, HeartIcon, CategoryIcon } from "./shopIcons";
import { PRODUCTS, BEST_PRODUCT_IDS, CATEGORY_META } from "./shopData";
import { nfmt } from "./shopFormat";

const NAV_ITEMS = [
  { key: "home", label: "홈", Icon: NavHomeIcon, active: false },
  { key: "resv", label: "예약시공", Icon: NavResvIcon, active: false },
  { key: "shop", label: "쇼핑몰", Icon: NavShopIcon, active: true },
  { key: "my", label: "내 정보", Icon: NavMyIcon, active: false },
];

interface ShopScreenProps {
  onExit: () => void;
  onOpenRsv: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenWish: () => void;
  onOpenCategory: (cat: string) => void;
  onOpenListAll: () => void;
  onOpenDetail: (pid: string) => void;
  onOpenMyPage: () => void;
  cartCount: number;
  wish: Record<string, boolean>;
  onToggleWish: (pid: string) => void;
  onToast: (label: string) => void;
}

export default function ShopScreen({
  onExit,
  onOpenRsv,
  onOpenSearch,
  onOpenCart,
  onOpenWish,
  onOpenCategory,
  onOpenListAll,
  onOpenDetail,
  onOpenMyPage,
  cartCount,
  wish,
  onToggleWish,
  onToast,
}: ShopScreenProps) {
  const bestItems = BEST_PRODUCT_IDS.map((id) => PRODUCTS[id]);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex h-[98px] flex-none items-center justify-between border-b border-gray-100 bg-white px-[18px] pt-[46px]">
        <span className="text-[19px] font-extrabold tracking-tight text-gray-900">쇼핑몰</span>
        <div className="flex items-center gap-3.5">
          <span onClick={onOpenWish} className="cursor-pointer text-gray-800">
            <HeartIcon />
          </span>
          <span onClick={onOpenSearch} className="cursor-pointer text-gray-800">
            <SearchIcon />
          </span>
          <span onClick={onOpenCart} className="relative cursor-pointer text-gray-800">
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-accent px-[3px] text-[9px] font-extrabold text-white">
                {cartCount}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-[26px]">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-strong p-[18px] text-white">
          <div className="text-[15.5px] font-extrabold tracking-tight">정품 인증 카용품</div>
          <div className="mt-[5px] text-[12.5px] leading-relaxed text-white/88">
            엔진오일·블랙박스·타이어까지
            <br />
            믿을 수 있는 정품만 모았어요
          </div>
        </div>

        <div className="mp-scroll mt-[18px] flex gap-3.5 overflow-x-auto pb-0.5">
          {CATEGORY_META.filter((c) => c.key !== "all").map((c) => (
            <div key={c.key} onClick={() => onOpenCategory(c.key)} className="flex w-[58px] flex-none cursor-pointer flex-col items-center gap-1.5">
              <span className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-brand-subtle text-brand">
                <CategoryIcon cat={c.key} />
              </span>
              <span className="text-center text-[11px] font-semibold text-gray-600">{c.label}</span>
            </div>
          ))}
        </div>

        <div className="mx-0.5 mt-[22px] mb-3 flex items-center justify-between">
          <span className="text-[15px] font-extrabold text-gray-900">베스트 상품</span>
          <span onClick={onOpenListAll} className="cursor-pointer text-xs font-bold text-gray-500">
            전체보기 ›
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bestItems.map((p) => {
            const hasDisc = !!p.orig;
            const discPct = hasDisc ? Math.round((1 - p.price / (p.orig as number)) * 100) : 0;
            const wished = !!wish[p.id];
            return (
              <div key={p.id} onClick={() => onOpenDetail(p.id)} className="cursor-pointer">
                <span className="relative block aspect-square w-full overflow-hidden rounded-[14px] bg-gray-100">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWish(p.id);
                    }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90"
                  >
                    <HeartIcon filled={wished} color={wished ? "var(--color-accent)" : "var(--gray-400)"} />
                  </span>
                </span>
                <div className="mt-2 truncate text-xs font-semibold text-gray-600">{p.brand}</div>
                <div className="mt-0.5 line-clamp-2 text-[13.5px] leading-[1.35] font-bold text-gray-900">{p.name}</div>
                <div className="mt-[5px] flex items-baseline gap-1.5">
                  {hasDisc && <span className="text-[13px] font-extrabold text-accent-strong">{discPct}%</span>}
                  <span className="text-[14.5px] font-extrabold text-gray-900 tabular-nums">{nfmt(p.price)}원</span>
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  ★ {p.rating} · {p.reviews}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex h-[66px] flex-none border-t border-gray-100 bg-white pb-2">
        {NAV_ITEMS.map(({ key, label, Icon, active }) => (
          <div
            key={key}
            onClick={() =>
              active ? undefined : key === "home" ? onExit() : key === "my" ? onOpenMyPage() : key === "resv" ? onOpenRsv() : onToast(label)
            }
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-1"
          >
            <Icon color={active ? "var(--color-brand)" : "var(--text-tertiary)"} />
            <span className={`text-[10.5px] ${active ? "font-bold text-brand" : "font-medium text-gray-500"}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
