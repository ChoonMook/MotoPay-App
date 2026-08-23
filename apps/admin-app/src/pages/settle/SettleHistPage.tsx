// 정산 내역 조회(AD-STL-04) — 대상월을 지정해 "정산 실행"을 누르면 그 달 인수확인 완료된 신차패키지(PKG)
// 예약을 시공업체별로 집계해 배치를 생성/누적한다(2026-08-23 확정: 스케줄러 없이 관리자 수동 실행, PKG만
// 우선 구현·BID는 다음 단계). 좌: 배치 목록(DataGrid) / 우: 선택한 배치의 구성상품·예약 건별 상세 + 지급 처리
import { useEffect, useMemo, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Check, PlayCircle } from "lucide-react";
import {
  generateShopSettlementBatches,
  getShopSettlementBatchItems,
  listShopSettlementBatches,
  updateShopSettlementPayout,
  type ShopSettlementBatchApi,
  type ShopSettlementItemApi,
} from "../../api/shopSettlements";
import DataGrid from "../../components/DataGrid";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-2.5 py-1.5 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";
const PAYOUT_STATUS_LABEL: Record<string, string> = { PENDING: "지급대기", PAID: "지급완료" };
const COMMISSION_TYPE_LABEL: Record<string, string> = { FIXED: "정액", RATE: "정률" };

function formatWon(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function SettleHistPage() {
  const [month, setMonth] = useState(currentMonth());
  const [batches, setBatches] = useState<ShopSettlementBatchApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<ShopSettlementBatchApi | null>(null);
  const [items, setItems] = useState<ShopSettlementItemApi[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [payoutStatus, setPayoutStatus] = useState("PENDING");
  const [payoutDate, setPayoutDate] = useState("");
  const [payoutSaving, setPayoutSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadBatches = (m: string) => {
    setLoading(true);
    listShopSettlementBatches({ settlementMonth: m })
      .then(setBatches)
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "정산 배치 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => loadBatches(month), [month]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(""), 3200);
    return () => clearTimeout(t);
  }, [errorMsg]);

  useEffect(() => {
    if (!selectedBatch) {
      setItems([]);
      return;
    }
    setPayoutStatus(selectedBatch.payoutStatus);
    setPayoutDate(selectedBatch.payoutDate ?? "");
    setItemsLoading(true);
    getShopSettlementBatchItems(selectedBatch.id)
      .then(setItems)
      .catch((err) => setErrorMsg(err instanceof Error ? err.message : "정산 상세를 불러오지 못했습니다."))
      .finally(() => setItemsLoading(false));
  }, [selectedBatch]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateShopSettlementBatches(month);
      setToast(`${result.processedReservationCount}건의 예약을 반영해 정산 배치를 갱신했습니다.`);
      loadBatches(month);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "정산 실행에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePayout = async () => {
    if (!selectedBatch) return;
    if (payoutStatus === "PAID" && !payoutDate) {
      setErrorMsg("지급완료로 바꾸려면 지급일을 입력해 주세요.");
      return;
    }
    setPayoutSaving(true);
    try {
      const updated = await updateShopSettlementPayout(selectedBatch.id, {
        payoutStatus,
        payoutDate: payoutDate || undefined,
      });
      setSelectedBatch(updated);
      setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setToast("지급 상태를 저장했습니다.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setPayoutSaving(false);
    }
  };

  const columnDefs = useMemo<ColDef<ShopSettlementBatchApi>[]>(
    () => [
      { headerName: "시공업체", field: "shopName", flex: 1.2, minWidth: 140 },
      {
        headerName: "정산 기준액",
        field: "grossAmount",
        flex: 1,
        minWidth: 110,
        valueFormatter: (p) => formatWon(p.value ?? 0),
      },
      {
        headerName: "지급액",
        field: "netPayoutAmount",
        flex: 1,
        minWidth: 110,
        valueFormatter: (p) => formatWon(p.value ?? 0),
      },
      {
        headerName: "상태",
        field: "payoutStatus",
        flex: 0.7,
        minWidth: 90,
        valueFormatter: (p) => PAYOUT_STATUS_LABEL[p.value] ?? p.value,
      },
      { headerName: "건수", field: "itemCount", flex: 0.5, minWidth: 70 },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/settle/settle-hist" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass}>정산 대상월</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputClass} w-40`} />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          {generating ? "정산 실행 중..." : "정산 실행"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-h-0 w-[560px] shrink-0 flex-col">
          <DataGrid<ShopSettlementBatchApi>
            columnDefs={columnDefs}
            rowData={batches}
            getRowId={(p) => String(p.data.id)}
            onCellClicked={(e) => e.data && setSelectedBatch(e.data)}
            rowClass="cursor-pointer"
            getRowClass={(p) => (p.data && selectedBatch && p.data.id === selectedBatch.id ? "bg-primary/5" : undefined)}
            rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
            loading={loading}
            emptyMessage="해당 월의 정산 배치가 없습니다. 정산 실행을 눌러 생성하세요."
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          {!selectedBatch ? (
            <p className="flex flex-1 items-center justify-center text-[12px] text-on-surface-variant">
              좌측에서 배치를 선택하세요.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">{selectedBatch.shopName}</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    {selectedBatch.settlementMonth} · 정산 기준액 {formatWon(selectedBatch.grossAmount)} · 수수료{" "}
                    {formatWon(selectedBatch.commissionAmount)} · 지급액 {formatWon(selectedBatch.netPayoutAmount)}
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-28 shrink-0 space-y-1">
                    <label className={labelClass}>지급 상태</label>
                    <select value={payoutStatus} onChange={(e) => setPayoutStatus(e.target.value)} className={inputClass}>
                      <option value="PENDING">지급대기</option>
                      <option value="PAID">지급완료</option>
                    </select>
                  </div>
                  <div className="w-36 shrink-0 space-y-1">
                    <label className={labelClass}>지급일</label>
                    <input type="date" value={payoutDate} onChange={(e) => setPayoutDate(e.target.value)} className={inputClass} />
                  </div>
                  <button
                    type="button"
                    onClick={handleSavePayout}
                    disabled={payoutSaving}
                    className="shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {payoutSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>

              {itemsLoading ? (
                <p className="py-8 text-center text-[12px] text-on-surface-variant">불러오는 중...</p>
              ) : items.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-on-surface-variant">상세 내역이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/40 text-left text-[11px] font-bold tracking-widest text-secondary uppercase">
                        <th className="py-2 pr-3">예약번호</th>
                        <th className="py-2 pr-3">구성상품</th>
                        <th className="py-2 pr-3">기준액</th>
                        <th className="py-2 pr-3">수수료</th>
                        <th className="py-2 pr-3">지급액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-outline-variant/20">
                          <td className="py-2 pr-3 text-on-surface-variant">{item.reservationNo}</td>
                          <td className="py-2 pr-3 font-semibold text-on-surface">{item.productName ?? item.productCode ?? "-"}</td>
                          <td className="py-2 pr-3">{formatWon(item.grossAmount)}</td>
                          <td className="py-2 pr-3 text-on-surface-variant">
                            {COMMISSION_TYPE_LABEL[item.commissionType] ?? item.commissionType} · {formatWon(item.commissionAmount)}
                          </td>
                          <td className="py-2 pr-3 font-semibold text-on-surface">{formatWon(item.netAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          {errorMsg}
        </div>
      )}
      {toast && !errorMsg && (
        <div className="fixed right-6 bottom-6 z-[999] flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-3 text-xs font-bold text-white shadow-xl">
          <Check className="h-3.5 w-3.5" />
          {toast}
        </div>
      )}
    </div>
  );
}
