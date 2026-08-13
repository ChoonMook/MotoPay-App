// PT-NCPK-02: 시공 상세 - 고객·차량·패키지 정보와 시공 항목 확인, 상태에 따라 시공 착수/완료 등록 CTA
import Button from "../../components/ui/Button";
import carImg from "../../assets/images/car.png";
import { API_BASE_URL } from "../../api/config";
import type { PackageJobDetail } from "../../api/reservations";
import type { CommonCodeDetailApi } from "../../api/commonCodes";
import { categoryLabel, formatScheduleLabel, formatTintDetail, itemTagClass, itemTagLabel, statusChipClass, statusLabel } from "./ncpkData";
import { PhoneCallIcon } from "./ncpkIcons";

interface NcpkDetailScreenProps {
  job: PackageJobDetail | null;
  prodCatOptions: CommonCodeDetailApi[];
  loading: boolean;
  updating: boolean;
  onBack: () => void;
  onStart: () => void;
  onGoDone: () => void;
  onGoHandover: () => void;
  onCall: (job: PackageJobDetail) => void;
}

export default function NcpkDetailScreen({
  job,
  prodCatOptions,
  loading,
  updating,
  onBack,
  onStart,
  onGoDone,
  onGoHandover,
  onCall,
}: NcpkDetailScreenProps) {
  const header = (
    <div className="flex-none border-b border-gray-100 bg-white pt-[50px] px-3">
      <div className="flex h-[50px] items-center gap-1.5">
        <span onClick={onBack} className="flex h-9 w-9 cursor-pointer items-center justify-center text-[22px] text-gray-800">
          ‹
        </span>
        <span className="text-[17px] font-bold text-gray-900">시공 상세</span>
      </div>
    </div>
  );

  if (loading || !job) {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
        {header}
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  const rows = [
    { k: "고객", v: job.customerName },
    { k: "연락처", v: job.phoneMasked },
    { k: "예약일시", v: formatScheduleLabel(job.date, job.time) },
    { k: "패키지", v: job.packageName ?? "-" },
  ];

  const cta =
    job.progressStatus === "APPLIED"
      ? { label: "시공 착수", onClick: onStart }
      : job.progressStatus === "IN_PROGRESS"
        ? { label: "시공 완료 등록", onClick: onGoDone }
        : { label: "인수확인 현황 보기", onClick: onGoHandover };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      {header}

      <div className="mp-scroll flex-1 overflow-y-auto px-5 py-[18px]">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-[13px] bg-gray-100">
            {job.carPhoto ? (
              <img src={`${API_BASE_URL}/uploads/${job.carPhoto}`} alt="차량" className="h-full w-full object-cover" />
            ) : (
              <img src={carImg} alt="차량" className="h-auto w-11 object-contain" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-extrabold tracking-tight text-gray-900">{job.car ?? "-"}</div>
            <div className="mt-0.5 font-mono text-[12.5px] tabular-nums text-gray-500">VIN {job.vin ?? "-"}</div>
          </div>
          <span className={`flex-none rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${statusChipClass(job.progressStatus)}`}>
            {statusLabel(job.progressStatus)}
          </span>
        </div>

        <div className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          {rows.map((r, i) => (
            <div
              key={r.k}
              className={`flex items-center justify-between py-[13px] ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <span className="text-[13px] text-gray-500">{r.k}</span>
              <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
            </div>
          ))}
        </div>

        {job.progressStatus === "APPLIED" && job.phone && (
          <div
            onClick={() => onCall(job)}
            className="mb-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-subtle p-[13px]"
          >
            <PhoneCallIcon />
            <span className="text-[13.5px] font-bold text-brand">고객에게 해피콜 걸기</span>
          </div>
        )}

        <div className="mx-0.5 mb-2.5 text-[15px] font-extrabold tracking-tight text-gray-900">시공 항목</div>
        {job.items.length === 0 ? (
          <div className="rounded-[14px] border border-gray-200 bg-white px-[15px] py-4 text-center text-[13px] text-gray-400">
            연결된 패키지 구성상품이 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {job.items.map((it, i) => {
              const category = categoryLabel(it.prodCat, prodCatOptions);
              const tintDetail = it.prodCat === "TINT" ? formatTintDetail(job.tintPositions) : undefined;
              return (
                <div
                  key={`${it.name}-${i}`}
                  className="flex items-center gap-2.5 rounded-[14px] border border-gray-200 bg-white px-[15px] py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    {category && <div className="text-[11px] text-gray-500">{category}</div>}
                    <div className="text-sm font-bold text-gray-800">{it.name}</div>
                    {it.spec && <div className="mt-0.5 text-[11.5px] text-gray-500">{it.spec}</div>}
                    {tintDetail && <div className="mt-0.5 text-[11.5px] text-gray-500">{tintDetail}</div>}
                  </div>
                  <span className={`flex-none rounded-[5px] px-2 py-[3px] text-[10.5px] font-extrabold ${itemTagClass(it.tag)}`}>
                    {itemTagLabel(it.tag)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-[22px]">
        <Button disabled={updating} onClick={cta.onClick}>
          {cta.label}
        </Button>
      </div>
    </div>
  );
}
