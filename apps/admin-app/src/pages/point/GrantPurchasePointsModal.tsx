// 신차구매 포인트 지급 팝업 — 딜러사별 신차구매 고객(회원 매핑된 건만) 선택 지급, 또는 VIN·지급포인트 엑셀
// 일괄업로드 지급. 신차 구매내역(DL-NCPK-01~04)의 엑셀 업로드와 동일한 행 단위 개별 성공/실패 처리 정책을 따른다.
import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Upload, X } from "lucide-react";
import { listCompanies, type CompanyListItem } from "../../api/companies";
import { listNewCarPurchases } from "../../api/newCarPurchases";
import { grantPurchasePoints, type GrantPurchasePointsResultRow } from "../../api/points";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function nfmt(n: number): string {
  return n.toLocaleString("en-US");
}

interface SelectRow {
  vin: string;
  customerName: string;
  car: string;
  isMapped: boolean;
  checked: boolean;
  amount: string;
}

interface ExcelRow {
  vin: string;
  amount: string;
}

interface GrantPurchasePointsModalProps {
  onClose: () => void;
  onDone: (successCount: number) => void;
}

export default function GrantPurchasePointsModal({ onClose, onDone }: GrantPurchasePointsModalProps) {
  const [tab, setTab] = useState<"select" | "excel">("select");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<GrantPurchasePointsResultRow[]>([]);
  const [error, setError] = useState("");

  // 탭 A: 딜러사 고객 선택
  const [dealers, setDealers] = useState<CompanyListItem[]>([]);
  const [dealerId, setDealerId] = useState("");
  const [purchaseDateFrom, setPurchaseDateFrom] = useState("");
  const [purchaseDateTo, setPurchaseDateTo] = useState("");
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [rows, setRows] = useState<SelectRow[]>([]);
  const [bulkAmount, setBulkAmount] = useState("");

  // 탭 B: 엑셀 업로드
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [parseError, setParseError] = useState("");

  useEffect(() => {
    listCompanies()
      .then((list) => setDealers(list.filter((c) => c.coType === "DEALER" && c.useYn)))
      .catch((err) => setError(err instanceof Error ? err.message : "딜러사 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!dealerId) {
      setRows([]);
      return;
    }
    setLoadingPurchases(true);
    listNewCarPurchases()
      .then((list) => {
        const filtered = list.filter((p) => {
          if (p.dealerCompanyId !== Number(dealerId)) return false;
          if (purchaseDateFrom && (!p.purchaseDate || p.purchaseDate < purchaseDateFrom)) return false;
          if (purchaseDateTo && (!p.purchaseDate || p.purchaseDate > purchaseDateTo)) return false;
          return true;
        });
        setRows(
          filtered.map((p) => ({
            vin: p.vin,
            customerName: p.customerName,
            car: `${p.carModelCode} ${p.trimName}`.trim(),
            isMapped: p.isMapped,
            checked: false,
            amount: "",
          })),
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : "신차구매 고객을 불러오지 못했습니다."))
      .finally(() => setLoadingPurchases(false));
  }, [dealerId, purchaseDateFrom, purchaseDateTo]);

  const toggleRow = (vin: string, checked: boolean) => {
    setRows((prev) => prev.map((r) => (r.vin === vin ? { ...r, checked } : r)));
  };
  const setRowAmount = (vin: string, amount: string) => {
    setRows((prev) => prev.map((r) => (r.vin === vin ? { ...r, amount } : r)));
  };
  const applyBulkAmount = () => {
    if (!bulkAmount) return;
    setRows((prev) => prev.map((r) => (r.checked ? { ...r, amount: bulkAmount } : r)));
  };

  const eligibleRows = rows.filter((r) => r.isMapped);
  const allEligibleChecked = eligibleRows.length > 0 && eligibleRows.every((r) => r.checked);
  const toggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => (r.isMapped ? { ...r, checked } : r)));
  };

  const checkedCount = rows.filter((r) => r.checked).length;

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setParseError("");
    setResults([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];
      const parsed: ExcelRow[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 헤더 행 skip
        const cell = (i: number) => String(row.getCell(i).value ?? "").trim();
        const vin = cell(1);
        if (!vin) return;
        parsed.push({ vin: vin.toUpperCase(), amount: cell(2) });
      });
      if (parsed.length === 0) {
        setParseError("지급할 행을 찾지 못했습니다. 첫 행은 헤더로 비우고 2행부터 데이터를 입력해주세요.");
      }
      setExcelRows(parsed);
    } catch {
      setParseError("엑셀 파일을 읽지 못했습니다.");
    }
  };

  const selectItems = useMemo(
    () =>
      rows
        .filter((r) => r.checked && r.isMapped)
        .map((r) => ({ vin: r.vin, amount: Number(r.amount) })),
    [rows],
  );
  const selectHasInvalidAmount = rows.some(
    (r) => r.checked && (!r.amount || !Number.isInteger(Number(r.amount)) || Number(r.amount) < 1),
  );

  const excelItems = useMemo(
    () => excelRows.map((r) => ({ vin: r.vin, amount: Number(r.amount) })),
    [excelRows],
  );
  const excelHasInvalidAmount = excelRows.some(
    (r) => !r.amount || !Number.isInteger(Number(r.amount)) || Number(r.amount) < 1,
  );

  const items = tab === "select" ? selectItems : excelItems;
  const hasInvalidAmount = tab === "select" ? selectHasInvalidAmount : excelHasInvalidAmount;
  const canSubmit = items.length > 0 && !hasInvalidAmount && reason.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await grantPurchasePoints(items, reason.trim());
      setResults(result);
      const successCount = result.filter((r) => r.success).length;
      if (result.every((r) => r.success)) {
        onDone(successCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "지급에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-[720px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h3 className="text-base font-bold text-secondary">신차구매 포인트 지급</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-outline-variant/60 px-6 pt-3">
          {[
            { key: "select" as const, label: "딜러사 고객 선택" },
            { key: "excel" as const, label: "엑셀 업로드" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-t-lg px-4 py-2.5 text-xs font-bold transition-all ${
                tab === t.key ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "select" ? (
            <>
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>딜러사</label>
                  <select value={dealerId} onChange={(e) => setDealerId(e.target.value)} className={`${inputClass} h-9 w-48`}>
                    <option value="">선택하세요</option>
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>구매일(시작)</label>
                  <input
                    type="date"
                    value={purchaseDateFrom}
                    onChange={(e) => setPurchaseDateFrom(e.target.value)}
                    className={`${inputClass} h-9 w-40`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>구매일(종료)</label>
                  <input
                    type="date"
                    value={purchaseDateTo}
                    onChange={(e) => setPurchaseDateTo(e.target.value)}
                    className={`${inputClass} h-9 w-40`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>선택건 일괄금액</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      placeholder="0"
                      className={`${inputClass} h-9 w-28`}
                    />
                    <button
                      type="button"
                      onClick={applyBulkAmount}
                      disabled={checkedCount === 0 || !bulkAmount}
                      className="h-9 shrink-0 rounded-lg border border-outline-variant px-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      선택건 적용
                    </button>
                  </div>
                </div>
              </div>

              {!dealerId ? (
                <div className="rounded-xl border border-outline-variant/30 bg-white py-12 text-center text-xs text-on-surface-variant">
                  딜러사를 선택해 주세요.
                </div>
              ) : loadingPurchases ? (
                <div className="rounded-xl border border-outline-variant/30 bg-white py-12 text-center text-xs text-on-surface-variant">
                  불러오는 중...
                </div>
              ) : rows.length === 0 ? (
                <div className="rounded-xl border border-outline-variant/30 bg-white py-12 text-center text-xs text-on-surface-variant">
                  등록된 신차구매 고객이 없습니다.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-outline-variant/30">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant">
                      <tr>
                        <th className="w-8 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={allEligibleChecked}
                            disabled={eligibleRows.length === 0}
                            onChange={(e) => toggleAll(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-outline-variant text-primary"
                          />
                        </th>
                        <th className="px-2 py-2 text-left">고객명</th>
                        <th className="px-2 py-2 text-left">차종</th>
                        <th className="px-2 py-2 text-left">VIN</th>
                        <th className="px-2 py-2 text-left">지급 포인트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.vin} className={`border-t border-outline-variant/30 ${!r.isMapped ? "opacity-40" : ""}`}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              disabled={!r.isMapped}
                              checked={r.checked}
                              onChange={(e) => toggleRow(r.vin, e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-outline-variant text-primary"
                            />
                          </td>
                          <td className="px-2 py-2 font-semibold text-secondary">{r.customerName}</td>
                          <td className="px-2 py-2">{r.car}</td>
                          <td className="px-2 py-2 font-mono text-[10.5px] text-on-surface-variant">{r.vin}</td>
                          <td className="px-2 py-2">
                            {r.isMapped ? (
                              <input
                                type="number"
                                min={1}
                                value={r.amount}
                                onChange={(e) => setRowAmount(r.vin, e.target.value)}
                                disabled={!r.checked}
                                placeholder="0"
                                className={`${inputClass} w-24`}
                              />
                            ) : (
                              <span className="text-[10.5px] text-on-surface-variant">미매핑(지급불가)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="mb-1 text-xs font-bold text-on-surface">엑셀 파일 첫 행은 헤더로 비우고, 2행부터 아래 순서로 입력하세요.</p>
              <p className="mb-4 text-[11px] text-on-surface-variant">VIN · 지급포인트</p>

              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-xs font-bold text-on-surface transition-all hover:bg-surface-dim">
                <Upload className="h-3.5 w-3.5" />
                엑셀 파일 선택(.xlsx)
                <input type="file" accept=".xlsx" className="hidden" onChange={onFileSelected} />
              </label>

              {parseError && <p className="mt-3 text-[12px] font-semibold text-red-600">{parseError}</p>}

              {excelRows.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-on-surface">{excelRows.length}건 파싱됨</p>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-outline-variant/60">
                    <table className="w-full text-[11px]">
                      <thead className="bg-surface-container-low">
                        <tr>
                          <th className="px-2 py-1.5 text-left">VIN</th>
                          <th className="px-2 py-1.5 text-left">지급포인트</th>
                          <th className="px-2 py-1.5 text-left">결과</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelRows.map((row) => {
                          const result = results.find((r) => r.vin === row.vin);
                          return (
                            <tr key={row.vin} className="border-t border-outline-variant/60">
                              <td className="px-2 py-1.5 font-mono">{row.vin}</td>
                              <td className="px-2 py-1.5">{row.amount ? `${nfmt(Number(row.amount))}원` : "-"}</td>
                              <td className="px-2 py-1.5">
                                {result ? (
                                  <span className={result.success ? "font-semibold text-primary" : "font-semibold text-red-600"}>
                                    {result.success ? "성공" : result.error}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "select" && results.length > 0 && (
            <div className="mt-4 space-y-1 text-[11px]">
              {results.map((r) => (
                <div key={r.vin} className={r.success ? "text-primary" : "text-red-600"}>
                  {r.vin} — {r.success ? "성공" : r.error}
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-1.5">
            <label className={labelClass}>지급 사유</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="사유를 입력해 주세요 (예: 2026년 8월 신차구매 프로모션)"
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-outline-variant/60 px-6 py-4">
          <span className="text-[11px] text-on-surface-variant">
            {tab === "select" ? `선택 ${selectItems.length}건` : `대상 ${excelItems.length}건`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "지급 중..." : "지급"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
