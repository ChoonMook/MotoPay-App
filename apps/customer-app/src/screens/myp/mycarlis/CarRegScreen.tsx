// CU-MYPG-03/04: 차량 등록·수정 - 제조사→모델명·상세모델·연식·차량번호 입력, 딜러사 구매차량은 구매정보 읽기전용 노출
// 원본 dc.html도 등록/수정을 하나의 화면 상태(isCarEdit)로 다루므로, CarEditScreen.tsx는 이 컴포넌트를 그대로 재사용한다
import Button from "../../../components/ui/Button";
import CommonHeader from "../../common/CommonHeader";

interface CodeOption {
  detailCode: string;
  detailName: string;
  ref1?: string | null;
}

interface CarRegScreenProps {
  onBack: () => void;
  isEditMode: boolean;
  brandOptions: CodeOption[];
  modelOptions: CodeOption[];
  maker: string;
  model: string;
  trim: string;
  year: string;
  plate: string;
  onChangeMaker: (v: string) => void;
  onChangeModel: (v: string) => void;
  onChangeTrim: (v: string) => void;
  onChangeYear: (v: string) => void;
  onChangePlate: (v: string) => void;
  isDealerCar: boolean;
  dealerName?: string;
  vin?: string;
  onDelete: () => void;
  onSave: () => void;
  saving?: boolean;
}

const fieldClass =
  "w-full rounded-xl border border-gray-400 bg-white px-[15px] py-3.5 text-sm text-gray-900 outline-none";
const fieldClassDisabled = `${fieldClass} bg-gray-50 text-gray-500`;

export default function CarRegScreen({
  onBack,
  isEditMode,
  brandOptions,
  modelOptions,
  maker,
  model,
  trim,
  year,
  plate,
  onChangeMaker,
  onChangeModel,
  onChangeTrim,
  onChangeYear,
  onChangePlate,
  isDealerCar,
  dealerName,
  vin,
  onDelete,
  onSave,
  saving = false,
}: CarRegScreenProps) {
  const modelOptionsForBrand = modelOptions.filter((m) => m.ref1 === maker);

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title={isEditMode ? "차량 수정" : "차량 등록"} onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <div className="mx-0.5 mb-2 text-[13px] font-extrabold text-gray-900">제조사</div>
        <select
          value={maker}
          onChange={(e) => onChangeMaker(e.target.value)}
          disabled={isDealerCar}
          className={isDealerCar ? fieldClassDisabled : fieldClass}
        >
          {brandOptions.map((b) => (
            <option key={b.detailCode} value={b.detailCode}>
              {b.detailName}
            </option>
          ))}
        </select>

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">모델명</div>
        <select
          value={model}
          onChange={(e) => onChangeModel(e.target.value)}
          disabled={isDealerCar}
          className={isDealerCar ? fieldClassDisabled : fieldClass}
        >
          {modelOptionsForBrand.map((m) => (
            <option key={m.detailCode} value={m.detailCode}>
              {m.detailName}
            </option>
          ))}
        </select>

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">상세모델</div>
        <input
          value={trim}
          onChange={(e) => onChangeTrim(e.target.value)}
          placeholder="예) E 200"
          disabled={isDealerCar}
          className={isDealerCar ? fieldClassDisabled : fieldClass}
        />

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">연식</div>
        <input
          value={year}
          onChange={(e) => onChangeYear(e.target.value)}
          inputMode="numeric"
          placeholder="예) 2023"
          disabled={isDealerCar}
          className={`${isDealerCar ? fieldClassDisabled : fieldClass} tabular-nums`}
        />

        <div className="mx-0.5 mt-4 mb-2 text-[13px] font-extrabold text-gray-900">차량번호</div>
        <input value={plate} onChange={(e) => onChangePlate(e.target.value)} placeholder="예) 12가 3456" className={fieldClass} />
        {isDealerCar && (
          <div className="mt-1.5 text-xs text-gray-500">딜러사 매핑 차량은 차량번호만 수정할 수 있어요.</div>
        )}

        {isDealerCar && (
          <>
            <div className="mx-0.5 mt-5 mb-2 text-[13px] font-extrabold text-gray-900">딜러사 구매 정보</div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-[15px] py-3.5">
                <span className="text-xs text-gray-500">구매처(딜러사)</span>
                <span className="text-[13.5px] font-bold text-gray-600">{dealerName}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-[15px] py-3.5">
                <span className="text-xs text-gray-500">VIN</span>
                <span className="text-[13.5px] font-bold text-gray-600 tabular-nums">{vin}</span>
              </div>
            </div>
          </>
        )}

        {isEditMode && !isDealerCar && (
          <div onClick={onDelete} className="mt-5 cursor-pointer text-center text-[13px] font-bold text-status-danger">
            차량 삭제하기
          </div>
        )}
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" onClick={onSave} disabled={saving}>
          {saving ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
}
