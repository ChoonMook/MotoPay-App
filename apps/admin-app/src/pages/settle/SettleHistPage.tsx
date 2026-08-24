// 패키지·시공 정산 내역 조회(AD-STL-04) — 대상월을 지정해 "정산 실행"을 누르면 그 달 인수확인 완료된 신차패키지(PKG)
// 예약을 시공업체별로 집계해 배치를 생성/누적한다(2026-08-23 확정: 스케줄러 없이 관리자 수동 실행, PKG만
// 우선 구현·BID는 다음 단계). 좌: 배치 목록(DataGrid) / 우: 선택한 배치의 구성상품·예약 건별 상세 + 지급 처리
import { useEffect, useMemo, useRef, useState } from "react";
import type { ColDef } from "ag-grid-community";
import { Check, Download, GripVertical, PlayCircle, X } from "lucide-react";
import {
  generateShopSettlementBatches,
  getShopSettlementBatchItems,
  listShopSettlementBatches,
  updateShopSettlementPayout,
  type ShopSettlementBatchApi,
  type ShopSettlementItemApi,
} from "../../api/shopSettlements";
import DataGrid from "../../components/DataGrid";
import ExcelActionButton from "../../components/ExcelActionButton";
import MonthPicker from "../../components/MonthPicker";
import PageBreadcrumb from "../../components/PageBreadcrumb";
import { exportRowsAsXlsx } from "../../lib/exportXlsx";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-2.5 py-1.5 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";
const PAYOUT_STATUS_LABEL: Record<string, string> = { PENDING: "지급대기", PAID: "지급완료" };
const COMMISSION_TYPE_LABEL: Record<string, string> = { FIXED: "정액", RATE: "정률" };
const RESERVATION_TYPE_LABEL: Record<string, string> = { PKG: "신차패키지", BID: "예약시공" };

function formatWon(v: number): string {
  return `${v.toLocaleString("ko-KR")}원`;
}

// 우측 그리드에 표시하는 예약번호 단위 집계 행(구성상품별 상세는 클릭 시 팝업에서 보여줌)
interface ReservationSummaryRow {
  reservationNo: string;
  reservationType: string;
  customerName: string;
  carLabel: string | null;
  serviceDate: string;
  packageName: string | null;
  itemCount: number;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
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
  const [detailReservationNo, setDetailReservationNo] = useState<string | null>(null);

  const [payoutStatus, setPayoutStatus] = useState("PENDING");
  const [payoutDate, setPayoutDate] = useState("");
  const [payoutSaving, setPayoutSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 좌우 패널 사이 드래그 리사이즈 - 공통 코드 관리(CommonCodeMgmtPage)와 동일한 방식
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(560);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const next = Math.min(Math.max(e.clientX - rect.left, 280), rect.width - 320);
      setLeftWidth(next);
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startSplitDrag = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

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
        type: "rightAligned",
        valueFormatter: (p) => formatWon(p.value ?? 0),
      },
      {
        headerName: "지급액",
        field: "netPayoutAmount",
        flex: 1,
        minWidth: 110,
        type: "rightAligned",
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

  // 예약번호 단위 집계 행 - 우측 그리드는 구성상품별 개별 행 대신 예약 1건당 1행으로 보여주고,
  // 구성상품별 상세는 행 클릭 시 여는 팝업(ReservationDetailModal)에서 확인한다
  const reservationSummaries = useMemo<ReservationSummaryRow[]>(() => {
    const byReservation = new Map<string, ReservationSummaryRow>();
    for (const it of items) {
      const existing = byReservation.get(it.reservationNo);
      if (existing) {
        existing.itemCount += 1;
        existing.grossAmount += it.grossAmount;
        existing.commissionAmount += it.commissionAmount;
        existing.netAmount += it.netAmount;
        continue;
      }
      byReservation.set(it.reservationNo, {
        reservationNo: it.reservationNo,
        reservationType: it.reservationType,
        customerName: it.customerName,
        carLabel: it.carLabel,
        serviceDate: it.serviceDate,
        packageName: it.packageName,
        itemCount: 1,
        grossAmount: it.grossAmount,
        commissionAmount: it.commissionAmount,
        netAmount: it.netAmount,
      });
    }
    return [...byReservation.values()];
  }, [items]);

  const reservationColumnDefs = useMemo<ColDef<ReservationSummaryRow>[]>(
    () => [
      { headerName: "예약번호", field: "reservationNo", width: 120 },
      {
        headerName: "유형",
        field: "reservationType",
        width: 90,
        valueFormatter: (p) => RESERVATION_TYPE_LABEL[p.value ?? ""] ?? p.value,
      },
      { headerName: "고객명", field: "customerName", width: 90 },
      { headerName: "차종", field: "carLabel", width: 160, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "시공일자", field: "serviceDate", width: 100 },
      { headerName: "패키지명", field: "packageName", width: 140, valueFormatter: (p) => p.value ?? "-" },
      { headerName: "구성상품 수", field: "itemCount", width: 100, type: "rightAligned" },
      {
        headerName: "기준액",
        field: "grossAmount",
        width: 110,
        type: "rightAligned",
        valueFormatter: (p) => formatWon(p.value ?? 0),
      },
      {
        headerName: "수수료",
        field: "commissionAmount",
        width: 110,
        type: "rightAligned",
        valueFormatter: (p) => formatWon(p.value ?? 0),
      },
      {
        headerName: "지급액",
        field: "netAmount",
        width: 110,
        type: "rightAligned",
        valueFormatter: (p) => formatWon(p.value ?? 0),
      },
    ],
    [],
  );

  const pinnedBatchTotals = useMemo<ShopSettlementBatchApi[]>(() => {
    if (batches.length === 0) return [];
    const total = batches.reduce(
      (acc, b) => ({
        grossAmount: acc.grossAmount + b.grossAmount,
        commissionAmount: acc.commissionAmount + b.commissionAmount,
        netPayoutAmount: acc.netPayoutAmount + b.netPayoutAmount,
        itemCount: acc.itemCount + b.itemCount,
      }),
      { grossAmount: 0, commissionAmount: 0, netPayoutAmount: 0, itemCount: 0 },
    );
    return [{ id: -1, shopCode: "", shopName: "합계", settlementMonth: "", payoutStatus: "", payoutDate: null, ...total }];
  }, [batches]);

  const pinnedReservationTotals = useMemo<ReservationSummaryRow[]>(() => {
    if (items.length === 0) return [];
    const total = items.reduce(
      (acc, it) => ({
        grossAmount: acc.grossAmount + it.grossAmount,
        commissionAmount: acc.commissionAmount + it.commissionAmount,
        netAmount: acc.netAmount + it.netAmount,
      }),
      { grossAmount: 0, commissionAmount: 0, netAmount: 0 },
    );
    return [
      {
        reservationNo: "합계",
        reservationType: "",
        customerName: "",
        carLabel: null,
        serviceDate: "",
        packageName: null,
        itemCount: items.length,
        ...total,
      },
    ];
  }, [items]);

  const handleExcelDownloadBatches = () => {
    exportRowsAsXlsx({
      fileName: `정산배치_목록_${month}.xlsx`,
      sheetName: "정산 배치 목록",
      columns: [
        { header: "시공업체", key: "shopName", width: 20 },
        { header: "정산월", key: "settlementMonth", width: 12 },
        { header: "정산 기준액", key: "grossAmount", width: 14 },
        { header: "수수료", key: "commissionAmount", width: 14 },
        { header: "지급액", key: "netPayoutAmount", width: 14 },
        { header: "상태", key: "payoutStatus", width: 10 },
        { header: "지급일", key: "payoutDate", width: 12 },
        { header: "건수", key: "itemCount", width: 8 },
      ],
      rows: batches.map((b) => ({
        shopName: b.shopName,
        settlementMonth: b.settlementMonth,
        grossAmount: b.grossAmount,
        commissionAmount: b.commissionAmount,
        netPayoutAmount: b.netPayoutAmount,
        payoutStatus: PAYOUT_STATUS_LABEL[b.payoutStatus] ?? b.payoutStatus,
        payoutDate: b.payoutDate ?? "-",
        itemCount: b.itemCount,
      })),
    });
  };

  const handleExcelDownloadItems = () => {
    if (!selectedBatch) return;
    exportRowsAsXlsx({
      fileName: `정산상세_${selectedBatch.shopName}_${selectedBatch.settlementMonth}.xlsx`,
      sheetName: "정산 상세 내역",
      columns: [
        { header: "예약번호", key: "reservationNo", width: 14 },
        { header: "유형", key: "reservationType", width: 10 },
        { header: "고객명", key: "customerName", width: 10 },
        { header: "차종", key: "carLabel", width: 20 },
        { header: "시공일자", key: "serviceDate", width: 12 },
        { header: "패키지명", key: "packageName", width: 16 },
        { header: "구성상품", key: "productName", width: 18 },
        { header: "기준액", key: "grossAmount", width: 12 },
        { header: "수수료", key: "commissionAmount", width: 16 },
        { header: "지급액", key: "netAmount", width: 12 },
      ],
      rows: items.map((it) => ({
        reservationNo: it.reservationNo,
        reservationType: RESERVATION_TYPE_LABEL[it.reservationType] ?? it.reservationType,
        customerName: it.customerName,
        carLabel: it.carLabel ?? "-",
        serviceDate: it.serviceDate,
        packageName: it.packageName ?? "-",
        productName: it.productName ?? it.productCode ?? "-",
        grossAmount: it.grossAmount,
        commissionAmount: `${COMMISSION_TYPE_LABEL[it.commissionType] ?? it.commissionType} · ${formatWon(it.commissionAmount)}`,
        netAmount: it.netAmount,
      })),
    });
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/settle/settle-hist" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass}>정산 대상월</label>
          <MonthPicker value={month} onChange={setMonth} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <ExcelActionButton icon={Download} label="엑셀 다운로드" onClick={handleExcelDownloadBatches} />
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
      </div>

      <div ref={splitContainerRef} className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-col" style={{ width: leftWidth, flex: "0 0 auto" }}>
          <DataGrid<ShopSettlementBatchApi>
            columnDefs={columnDefs}
            rowData={batches}
            getRowId={(p) => String(p.data.id)}
            onCellClicked={(e) => e.data && !e.node.rowPinned && setSelectedBatch(e.data)}
            rowClass="cursor-pointer"
            getRowClass={(p) => (p.data && selectedBatch && p.data.id === selectedBatch.id ? "bg-primary/5" : undefined)}
            rowSelection={{ mode: "singleRow", checkboxes: false, enableClickSelection: true }}
            loading={loading}
            emptyMessage="해당 월의 정산 배치가 없습니다. 정산 실행을 눌러 생성하세요."
            pinnedBottomRowData={pinnedBatchTotals}
          />
        </div>

        <div
          onMouseDown={startSplitDrag}
          className="relative mx-3 h-1/3 w-0.5 shrink-0 cursor-col-resize self-center bg-primary/25 transition-colors hover:bg-primary/60"
        >
          <div className="absolute top-1/2 left-1/2 flex h-8 w-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-white shadow-sm">
            <GripVertical className="h-3 w-3 text-outline" />
          </div>
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
                  <ExcelActionButton icon={Download} label="엑셀 다운로드" onClick={handleExcelDownloadItems} />
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

              <div className="flex min-h-0 flex-1 flex-col">
                <DataGrid<ReservationSummaryRow>
                  columnDefs={reservationColumnDefs}
                  rowData={reservationSummaries}
                  getRowId={(p) => p.data.reservationNo}
                  onCellClicked={(e) => e.data && !e.node.rowPinned && setDetailReservationNo(e.data.reservationNo)}
                  rowClass="cursor-pointer"
                  loading={itemsLoading}
                  emptyMessage="상세 내역이 없습니다."
                  pinnedBottomRowData={pinnedReservationTotals}
                />
              </div>
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

      {detailReservationNo && (
        <ReservationDetailModal
          items={items.filter((it) => it.reservationNo === detailReservationNo)}
          onClose={() => setDetailReservationNo(null)}
        />
      )}
    </div>
  );
}

// 우측 그리드에서 예약 1건을 클릭했을 때 그 예약의 구성상품별 금액을 보여주는 팝업
function ReservationDetailModal({ items, onClose }: { items: ShopSettlementItemApi[]; onClose: () => void }) {
  const first = items[0];
  if (!first) return null;

  const total = items.reduce(
    (acc, it) => ({
      grossAmount: acc.grossAmount + it.grossAmount,
      commissionAmount: acc.commissionAmount + it.commissionAmount,
      netAmount: acc.netAmount + it.netAmount,
    }),
    { grossAmount: 0, commissionAmount: 0, netAmount: 0 },
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-[560px] flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <div>
            <h3 className="text-sm font-extrabold text-secondary">예약번호 {first.reservationNo}</h3>
            <p className="mt-0.5 text-[11px] text-on-surface-variant">
              {RESERVATION_TYPE_LABEL[first.reservationType] ?? first.reservationType} · {first.customerName} ·{" "}
              {first.carLabel ?? "-"} · {first.serviceDate}
              {first.packageName ? ` · ${first.packageName}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/40 text-left text-[11px] font-bold tracking-widest text-secondary uppercase">
                <th className="py-2 pr-3">구성상품</th>
                <th className="py-2 pr-3 text-right">기준액</th>
                <th className="py-2 pr-3 text-right">수수료</th>
                <th className="py-2 pr-3 text-right">지급액</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-outline-variant/20">
                  <td className="py-2 pr-3 font-semibold text-on-surface">{it.productName ?? it.productCode ?? "-"}</td>
                  <td className="py-2 pr-3 text-right">{formatWon(it.grossAmount)}</td>
                  <td className="py-2 pr-3 text-right text-on-surface-variant">
                    {COMMISSION_TYPE_LABEL[it.commissionType] ?? it.commissionType} · {formatWon(it.commissionAmount)}
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold text-on-surface">{formatWon(it.netAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-4 border-t border-outline-variant/60 px-6 py-4 text-xs">
          <span className="text-on-surface-variant">
            기준액 <span className="font-bold text-on-surface">{formatWon(total.grossAmount)}</span>
          </span>
          <span className="text-on-surface-variant">
            수수료 <span className="font-bold text-on-surface">{formatWon(total.commissionAmount)}</span>
          </span>
          <span className="text-on-surface-variant">
            지급액 <span className="font-bold text-primary">{formatWon(total.netAmount)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
