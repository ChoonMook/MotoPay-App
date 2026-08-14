// CU-MYPG-02: 내 차량 목록 - 등록 차량 리스트(대표차량 뱃지, 딜러사 구매 뱃지), 차량 등록 진입
import CommonHeader from "../common/CommonHeader";
import { CarIcon, ChevronRightIcon, PlusIcon } from "./mypIcons";
import type { Car } from "./mypTypes";

const shortVin = (v?: string) => (v && v.length > 12 ? `${v.slice(0, 4)}···${v.slice(-4)}` : v);

interface MyCarListScreenProps {
  onBack: () => void;
  cars: Car[];
  onOpenCar: (id: string) => void;
  onAddCar: () => void;
  onSetDefault: (id: string) => void;
}

export default function MyCarListScreen({ onBack, cars, onOpenCar, onAddCar, onSetDefault }: MyCarListScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="내 차량 목록" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-4 pb-6">
        <div className="flex flex-col gap-3">
          {cars.map((c) => {
            const plateLabel = `${c.plate ? `${c.plate} · ` : ""}${c.year}년식`;
            return (
              <div key={c.id} onClick={() => onOpenCar(c.id)} className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-[15px] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-subtle text-brand">
                    <CarIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[14.5px] font-extrabold text-gray-900">
                        {c.maker} {c.model}
                        {c.trimName ? ` ${c.trimName}` : ""}
                      </span>
                      {c.isDefault && <span className="rounded bg-brand-subtle px-1.5 py-0.5 text-[9.5px] font-extrabold text-brand">대표차량</span>}
                      {c.fromDealer && <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-[9.5px] font-extrabold text-accent-strong">딜러사 구매</span>}
                    </div>
                    <div className="mt-[3px] text-xs text-gray-500">{plateLabel}</div>
                  </div>
                  <span className="flex-none text-gray-500">
                    <ChevronRightIcon size={18} />
                  </span>
                </div>
                {c.fromDealer && (
                  <div className="mt-[11px] border-t border-gray-100 pt-[11px] text-[11.5px] text-gray-500">
                    구매처 {c.dealerName} · VIN {shortVin(c.vin)}
                  </div>
                )}
                {!c.isDefault && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDefault(c.id);
                    }}
                    className="mt-[11px] border-t border-gray-100 pt-[11px] text-xs font-bold text-brand"
                  >
                    대표차량으로 지정
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          onClick={onAddCar}
          className="mt-3.5 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-gray-300 py-3.5 text-[13px] font-bold text-gray-600"
        >
          <PlusIcon />
          차량 등록
        </div>
      </div>
    </div>
  );
}
