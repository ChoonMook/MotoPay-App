// PT-NCPK-03: 시공 착수 팝업 - 착수 전 대상·시공 항목 확인, 착수 시 고객에게 알림 발송 및 상태를 시공중으로 변경
import BottomSheet from "../../components/ui/BottomSheet";
import Button from "../../components/ui/Button";
import type { PackageJobDetail } from "../../api/reservations";
import type { CommonCodeDetailApi } from "../../api/commonCodes";
import { categoryLabel, formatScheduleLabel, formatTintDetail, itemTagClass, itemTagLabel } from "./ncpkData";

interface NcpkStartSheetProps {
  job: PackageJobDetail;
  prodCatOptions: CommonCodeDetailApi[];
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
}

export default function NcpkStartSheet({ job, prodCatOptions, onCancel, onConfirm, confirming }: NcpkStartSheetProps) {
  const rows = [
    { k: "고객", v: `${job.customerName} · ${job.phoneMasked}` },
    { k: "차량", v: `${job.car ?? "-"} · VIN ${job.vin ?? "-"}` },
    { k: "예약일시", v: formatScheduleLabel(job.date, job.time) },
    { k: "패키지", v: job.packageName ?? "-" },
  ];

  return (
    <BottomSheet onClose={onCancel} maxHeight="none">
      <div className="mb-1 text-xl font-extrabold text-gray-900">시공을 착수할까요?</div>
      <div className="mb-[18px] text-[13.5px] leading-[1.55] text-gray-600">
        착수하면 고객에게 <b>시공 시작 알림</b>이 발송되고, 상태가 <b>시공중</b>으로 변경돼요.
      </div>

      <div className="mb-4 rounded-lg bg-gray-100 px-4">
        {rows.map((r, i) => (
          <div
            key={r.k}
            className={`flex items-center justify-between py-[13px] ${i < rows.length - 1 ? "border-b border-gray-200" : ""}`}
          >
            <span className="text-[13px] text-gray-500">{r.k}</span>
            <span className="text-[13.5px] font-semibold text-gray-800">{r.v}</span>
          </div>
        ))}
      </div>

      <div className="mb-2.5 text-sm font-bold text-gray-800">시공 항목</div>
      <div className="mp-scroll mb-[22px] flex max-h-[212px] flex-col gap-2 overflow-y-auto">
        {job.items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-center text-[13px] text-gray-400">
            연결된 패키지 구성상품이 없어요
          </div>
        ) : (
          job.items.map((it, i) => {
            const category = categoryLabel(it.prodCat, prodCatOptions);
            const tintDetail = it.prodCat === "TINT" ? formatTintDetail(job.tintPositions) : undefined;
            return (
              <div
                key={`${it.name}-${i}`}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  {category && <div className="text-[11px] text-gray-500">{category}</div>}
                  <div className="text-[13.5px] font-bold text-gray-800">{it.name}</div>
                  {it.spec && <div className="mt-0.5 text-[11.5px] text-gray-500">{it.spec}</div>}
                  {tintDetail && <div className="mt-0.5 text-[11.5px] text-gray-500">{tintDetail}</div>}
                </div>
                <span className={`flex-none rounded-[5px] px-2 py-[3px] text-[10.5px] font-extrabold ${itemTagClass(it.tag)}`}>
                  {itemTagLabel(it.tag)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2.5">
        <div className="flex-1">
          <Button variant="outline" disabled={confirming} onClick={onCancel}>
            취소
          </Button>
        </div>
        <div className="flex-[2]">
          <Button variant="primary" disabled={confirming} onClick={onConfirm}>
            {confirming ? "처리 중..." : "시공 착수"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
