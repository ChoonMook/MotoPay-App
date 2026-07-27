// PT-PROF-02: 기본정보 관리 - 소개글·인사말·주소·전화번호·운영시간·시공가능 카테고리 수정
// 대표사진/소개사진 업로드는 이번 스코프 밖 — 플레이스홀더만 표시
import { useEffect, useState } from "react";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { updateMyShop, type MyShop } from "../../api/shops";
import { useDaumPostcode } from "../../hooks/useDaumPostcode";
import { BackIcon } from "./bizIcons";

interface BizBasicInfoScreenProps {
  shop: MyShop;
  onBack: () => void;
  onSaved: (shop: MyShop) => void;
  onError: (message: string) => void;
}

export default function BizBasicInfoScreen({ shop, onBack, onSaved, onError }: BizBasicInfoScreenProps) {
  const [intro, setIntro] = useState(shop.intro ?? "");
  const [greeting, setGreeting] = useState(shop.greeting ?? "");
  const [zipCode, setZipCode] = useState(shop.zipCode ?? "");
  const [address, setAddress] = useState(shop.address ?? "");
  const [addressDetail, setAddressDetail] = useState(shop.addressDetail ?? "");
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [businessHours, setBusinessHours] = useState(shop.businessHours ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(shop.categories);
  const [allCategories, setAllCategories] = useState<CommonCodeDetailApi[]>([]);
  const [saving, setSaving] = useState(false);
  const [basicSaved, setBasicSaved] = useState(false);
  const { open: openAddressSearch } = useDaumPostcode();

  useEffect(() => {
    getCommonCodeDetails("CAR_INST")
      .then(setAllCategories)
      .catch((err) => onError(err instanceof Error ? err.message : "시공가능 카테고리를 불러오지 못했어요"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchAddress = () => {
    openAddressSearch(
      (result) => {
        setZipCode(result.zonecode);
        setAddress(result.address);
      },
      (message) => onError(message),
    );
  };

  const toggleCategory = (detailCode: string) => {
    setSelectedCategories((prev) =>
      prev.includes(detailCode) ? prev.filter((c) => c !== detailCode) : [...prev, detailCode],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMyShop({
        intro,
        greeting,
        zipCode,
        address,
        addressDetail,
        phone,
        businessHours,
        categories: selectedCategories,
      });
      setBasicSaved(true);
      onSaved(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-50">
      {/* top app bar (sub) */}
      <div className="absolute inset-x-0 top-[46px] z-50 flex h-[52px] items-center gap-1.5 border-b border-gray-100 bg-white px-1.5">
        <span onClick={onBack} className="inline-flex cursor-pointer p-2.5 text-gray-800">
          <BackIcon />
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">기본정보 관리</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-0 overflow-y-auto px-5 pt-5 pb-[120px]"
        style={{ animation: "mp-screen .32s ease" }}
      >
        {basicSaved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-subtle px-3.5 py-2.5">
            <span className="text-[12.5px] font-bold text-brand">
              승인대기 중이에요 · 관리자 승인 후 고객앱에 반영돼요
            </span>
          </div>
        )}

        <div className="mb-2 text-[13px] font-extrabold tracking-[0.02em] text-gray-500">대표사진</div>
        <div className="mb-5 flex h-40 w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
          대표사진 등록
        </div>

        <div className="mb-2 text-[13px] font-extrabold tracking-[0.02em] text-gray-500">
          소개 사진 <span className="font-semibold text-gray-500">(최대 10장)</span>
        </div>
        <div className="mb-5 grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[74px] items-center justify-center rounded-[10px] bg-gray-100 text-[11px] text-gray-400"
            >
              사진
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <Textarea
            label="소개글"
            placeholder="고객에게 보여줄 업체 소개를 입력하세요"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
          />
          <Textarea
            label="인사말"
            placeholder="고객에게 전할 인사말을 입력하세요"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <div className="mb-2 text-sm font-semibold">주소</div>
          <div className="mb-2 flex gap-2">
            <div className="flex-1">
              <Input value={address} disabled placeholder="주소 검색" />
            </div>
            <Button variant="secondary" size="lg" fullWidth={false} onClick={handleSearchAddress}>
              검색
            </Button>
          </div>
          <Input placeholder="상세주소" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} />
        </div>

        <div className="mb-5">
          <Input label="대표 전화번호" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="mb-5">
          <Input
            label="운영시간"
            placeholder="예) 평일 09:00 ~ 19:00, 토/일 휴무"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
          />
        </div>

        <div className="mb-2 text-[13px] font-extrabold tracking-[0.02em] text-gray-500">
          시공 가능 카테고리 <span className="font-semibold text-gray-500">(중복 선택)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((c) => {
            const on = selectedCategories.includes(c.detailCode);
            return (
              <span
                key={c.detailCode}
                onClick={() => toggleCategory(c.detailCode)}
                className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[13px] font-bold ${
                  on ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {c.detailName}
              </span>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[55] border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
