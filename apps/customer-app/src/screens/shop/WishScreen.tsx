// 찜 목록 - 찜한 상품 그리드, 하트 토글로 찜 해제 (원본 캔버스엔 있으나 프로그램목록표 CU-SHOP 문서엔 없어 사용자 확인 후 부가 화면으로 구현)
import { HeartIcon } from "./shopIcons";
import { PRODUCTS } from "./shopData";
import { nfmt } from "./shopFormat";

interface WishScreenProps {
  onBack: () => void;
  wish: Record<string, boolean>;
  onToggleWish: (pid: string) => void;
  onOpenDetail: (pid: string) => void;
}

export default function WishScreen({ onBack, wish, onToggleWish, onOpenDetail }: WishScreenProps) {
  const wishIds = Object.keys(PRODUCTS).filter((id) => wish[id]);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="flex-none bg-white pt-[50px] pr-2.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-gray-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900">찜한 상품 {wishIds.length}</span>
        </div>
      </div>

      {wishIds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 text-center">
          <span className="text-gray-300">
            <HeartIcon />
          </span>
          <div className="text-sm font-bold text-gray-600">찜한 상품이 없어요</div>
        </div>
      ) : (
        <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {wishIds.map((id) => {
              const p = PRODUCTS[id];
              return (
                <div key={id} onClick={() => onOpenDetail(id)} className="cursor-pointer">
                  <span className="relative block aspect-square w-full overflow-hidden rounded-[14px] bg-gray-100">
                    <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWish(p.id);
                      }}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90"
                    >
                      <HeartIcon filled color="var(--color-accent)" />
                    </span>
                  </span>
                  <div className="mt-2 text-xs font-semibold text-gray-600">{p.brand}</div>
                  <div className="mt-0.5 line-clamp-2 text-[13.5px] leading-[1.35] font-bold text-gray-900">{p.name}</div>
                  <div className="mt-[5px] text-[14.5px] font-extrabold text-gray-900 tabular-nums">{nfmt(p.price)}원</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
