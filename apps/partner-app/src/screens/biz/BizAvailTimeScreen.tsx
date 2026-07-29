// PT-PROF-04: 예약 가능 시간 설정 - 평일/토요일/일요일/공휴일 구분별 시간대·정원(요일구분은 CommonCodeDetail(code=SHOP_DAY_TYPE) 기준) 관리
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import { getCommonCodeDetails, type CommonCodeDetailApi } from "../../api/commonCodes";
import { getTimeSlots, replaceTimeSlots, type TimeSlot } from "../../api/shopSchedule";
import type { MyShop } from "../../api/shops";
import { BackIcon } from "./bizIcons";

// 원본 dc.html 목업과 동일한 고정 옵션(08:00~19:00 매시)
const TIME_OPTIONS = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

// GET /common-codes/:code는 detailCode 알파벳순으로 내려와(정렬 전용 컬럼이 없음) 탭 순서가 디자인과 달라지므로,
// 여기서만 원본 dc.html의 탭 순서(평일→토요일→일요일→공휴일)로 고정 재정렬
const DAY_TYPE_ORDER = ["WEEKDAY", "SAT", "SUN", "HOLIDAY"];

interface BizAvailTimeScreenProps {
  shop: MyShop;
  onBack: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

export default function BizAvailTimeScreen({ shop, onBack, onSaved, onError }: BizAvailTimeScreenProps) {
  const [dayTypes, setDayTypes] = useState<CommonCodeDetailApi[]>([]);
  const [activeDayType, setActiveDayType] = useState("");
  const [slotsByDayType, setSlotsByDayType] = useState<Record<string, TimeSlot[]>>({});
  const [originalSlotsByDayType, setOriginalSlotsByDayType] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState(TIME_OPTIONS[0]);

  useEffect(() => {
    setLoading(true);
    getCommonCodeDetails("SHOP_DAY_TYPE")
      .then(async (fetched) => {
        const codes = fetched
          .slice()
          .sort((a, b) => DAY_TYPE_ORDER.indexOf(a.detailCode) - DAY_TYPE_ORDER.indexOf(b.detailCode));
        setDayTypes(codes);
        if (codes.length > 0) setActiveDayType(codes[0].detailCode);
        const entries = await Promise.all(
          codes.map(async (c) => [c.detailCode, await getTimeSlots(shop.shopCode, c.detailCode)] as const),
        );
        const map = Object.fromEntries(entries);
        setSlotsByDayType(map);
        setOriginalSlotsByDayType(map);
      })
      .catch((err) => onError(err instanceof Error ? err.message : "예약 가능 시간을 불러오지 못했어요"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSlots = slotsByDayType[activeDayType] ?? [];

  const updateActiveSlots = (updater: (prev: TimeSlot[]) => TimeSlot[]) => {
    setSlotsByDayType((prev) => ({ ...prev, [activeDayType]: updater(prev[activeDayType] ?? []) }));
  };

  const changeCapacity = (index: number, delta: number) => {
    updateActiveSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, capacity: Math.max(0, slot.capacity + delta) } : slot)),
    );
  };

  const removeSlot = (index: number) => {
    updateActiveSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmAddSlot = () => {
    updateActiveSlots((prev) => {
      if (prev.some((slot) => slot.time === newSlotTime)) return prev;
      return [...prev, { time: newSlotTime, capacity: 1 }].sort((a, b) => a.time.localeCompare(b.time));
    });
    setAddingSlot(false);
  };

  const isDayTypeDirty = (code: string) => {
    const current = slotsByDayType[code] ?? [];
    const original = originalSlotsByDayType[code] ?? [];
    if (current.length !== original.length) return true;
    return current.some((slot, i) => slot.time !== original[i]?.time || slot.capacity !== original[i]?.capacity);
  };

  const handleSave = async () => {
    const dirtyCodes = dayTypes.map((d) => d.detailCode).filter(isDayTypeDirty);
    if (dirtyCodes.length === 0) {
      onSaved();
      return;
    }
    setSaving(true);
    try {
      await Promise.all(dirtyCodes.map((code) => replaceTimeSlots(shop.shopCode, code, slotsByDayType[code])));
      setOriginalSlotsByDayType(slotsByDayType);
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "예약 가능 시간 저장에 실패했습니다");
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
        <span className="text-[17px] font-extrabold tracking-tight text-gray-900">예약 가능 시간 설정</span>
      </div>

      <div
        className="mp-scroll absolute inset-x-0 top-[98px] bottom-0 overflow-y-auto px-[18px] pt-4 pb-[120px]"
        style={{ animation: "mp-screen .32s ease" }}
      >
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <>
            <div className="mb-4 flex gap-1.5">
              {dayTypes.map((d) => (
                <span
                  key={d.detailCode}
                  onClick={() => setActiveDayType(d.detailCode)}
                  className={`flex-1 rounded-[10px] py-[9px] text-center text-[13px] font-bold ${
                    activeDayType === d.detailCode ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {d.detailName}
                </span>
              ))}
            </div>

            <div className="mb-3.5 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {activeSlots.map((slot, i) => (
                <div key={slot.time} className="flex items-center gap-2.5 px-4 py-[13px]">
                  <span className="flex-1 text-[14.5px] font-bold tracking-tight text-gray-900 tabular-nums">
                    {slot.time}
                  </span>
                  <span
                    onClick={() => changeCapacity(i, -1)}
                    className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-base text-gray-800"
                  >
                    −
                  </span>
                  <span className="w-[26px] text-center text-[14.5px] font-extrabold text-gray-900 tabular-nums">
                    {slot.capacity}
                  </span>
                  <span
                    onClick={() => changeCapacity(i, 1)}
                    className="flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-base text-gray-800"
                  >
                    ＋
                  </span>
                  <span
                    onClick={() => removeSlot(i)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center text-[15px] text-gray-500"
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>

            {!addingSlot && (
              <span
                onClick={() => {
                  setAddingSlot(true);
                  setNewSlotTime(TIME_OPTIONS[0]);
                }}
                className="block cursor-pointer py-1.5 text-center text-[13.5px] font-bold text-brand"
              >
                + 시간대 추가
              </span>
            )}
            {addingSlot && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select value={newSlotTime} onChange={(e) => setNewSlotTime(e.target.value)}>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button variant="primary" size="lg" fullWidth={false} onClick={confirmAddSlot}>
                  추가
                </Button>
                <Button variant="secondary" size="lg" fullWidth={false} onClick={() => setAddingSlot(false)}>
                  취소
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[55] border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={saving || loading} onClick={handleSave}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}
