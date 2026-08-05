// CU-RSVC-18 / CU-NCPK-06: 업체 상세(프로필) - 대표사진·소개글·인사말·위치·평점·후기·시공가능카테고리(조회 전용)
// 신차패키지·예약시공 등 여러 채널에서 공통으로 쓰는 화면. 업체 선택은 이 화면 진입 전(카드 선택)에 이미 끝나 있어 CTA가 없다.
import shopThumb from "../../assets/images/shop.png";
import { BackIcon, StarIcon, PinIcon } from "./commonIcons";

const DEFAULT_CATS = ["썬팅", "유리막 코팅", "PPF", "블랙박스", "광택·디테일링"];
const DEFAULT_INTRO =
  "10년 경력의 전문 시공팀이 상주하며, 수입차·전기차 전용 시공 라인을 갖추고 있어요. 시공 전후 사진을 모두 기록해 드리고, 시공 이력은 앱에서 언제든 확인할 수 있습니다.";
const DEFAULT_ADDRESS = "서울 강남구 논현로 123 · 지하 1층 전용 작업장";
const DEFAULT_REVIEWS = [
  { name: "김OO", stars: "★★★★★", text: "설명도 자세하고 마감이 깔끔했어요. 시공 과정을 사진으로 다 보내주셔서 믿음이 갔습니다." },
  { name: "이OO", stars: "★★★★★", text: "예약부터 시공까지 일정 조율이 편했어요. 다음에도 재방문할 의사 있습니다." },
];
const DEFAULT_REVIEW_COUNT = "128";

export interface CoDtlReview {
  name: string;
  stars: string;
  text: string;
}

interface CoDtlProfScreenProps {
  name: string;
  rating: string;
  dist: string;
  reviewCount?: string;
  categories?: string[];
  intro?: string;
  greeting?: string;
  address?: string;
  reviews?: CoDtlReview[];
  photoUrl?: string | null;
  onBack: () => void;
}

export default function CoDtlProfScreen({
  name,
  rating,
  dist,
  reviewCount = DEFAULT_REVIEW_COUNT,
  categories = DEFAULT_CATS,
  intro = DEFAULT_INTRO,
  greeting,
  address = DEFAULT_ADDRESS,
  reviews = DEFAULT_REVIEWS,
  photoUrl,
  onBack,
}: CoDtlProfScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <div className="mp-scroll flex-1 overflow-y-auto">
        <div className="relative h-[200px] w-full overflow-hidden bg-gray-100">
          <img
            src={photoUrl ?? shopThumb}
            alt={name}
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.src = shopThumb;
            }}
          />
          <span onClick={onBack} className="absolute top-[50px] left-3.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white">
            <BackIcon />
          </span>
        </div>
        <div className="px-5 pt-[18px] pb-6">
          <div className="text-[19px] font-extrabold text-gray-900">{name}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {rating && (
              <>
                <StarIcon color="var(--color-accent)" />
                <span className="text-[13.5px] font-extrabold text-gray-900">{rating}</span>
              </>
            )}
            <span className="text-[12.5px] text-gray-500">
              후기 {reviewCount}
              {dist ? ` · ${dist}` : ""}
            </span>
          </div>
          <div className="mt-3.5 rounded-xl bg-brand-subtle px-[15px] py-3.5 text-[13px] leading-[1.55] text-gray-600">
            {greeting || `안녕하세요, ${name}입니다. 정품 시공과 투명한 견적, 1년 A/S 보증으로 오너님의 차를 정성껏 시공해 드릴게요 :)`}
          </div>

          <div className="mx-0.5 mt-5 mb-2 text-[13px] font-extrabold text-gray-900">시공 가능 카테고리</div>
          <div className="flex flex-wrap gap-[7px]">
            {categories.map((c) => (
              <span key={c} className="rounded-full bg-gray-100 px-3.5 py-[7px] text-xs font-bold text-gray-600">
                {c}
              </span>
            ))}
          </div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">소개</div>
          <div className="text-[13px] leading-relaxed text-gray-600">{intro}</div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">위치</div>
          <div className="relative flex h-[120px] items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 text-gray-500">
            <svg width="150" height="120" viewBox="0 0 150 120" className="absolute inset-0 opacity-50">
              <rect width="150" height="120" fill="var(--gray-100)" />
              <path d="M0 40h150M0 80h150M50 0v120M100 0v120" stroke="var(--gray-200)" strokeWidth="2" />
            </svg>
            <span className="relative">
              <PinIcon />
            </span>
          </div>
          <div className="mt-2 text-[12.5px] text-gray-600">{address}</div>

          <div className="mx-0.5 mt-[22px] mb-2.5 text-[13px] font-extrabold text-gray-900">후기 {reviewCount}</div>
          <div className="flex flex-col gap-2.5">
            {reviews.map((v) => (
              <div key={v.name} className="rounded-xl border border-gray-200 px-3.5 py-[13px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-900">{v.name}</span>
                  <span className="text-[11px] text-accent-strong">{v.stars}</span>
                </div>
                <div className="mt-[5px] text-[12.5px] leading-relaxed text-gray-600">{v.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
