// PT-RSVC-03/PT-NCPK-02: 해피콜 이력 저장 팝업 - 이전 통화 이력을 보여주고, 통화 결과·메모를 새로 저장
// 신차패키지·예약시공 양쪽에서 공용으로 쓰는 컴포넌트
import BottomSheet from "./BottomSheet";
import Button from "./Button";
import Textarea from "./Textarea";
import type { CallLog } from "../../api/reservations";

const CALL_RESULT_META = [
  { key: "CONNECTED", label: "연결됨" },
  { key: "NOANSWER", label: "부재중" },
  { key: "RETRY", label: "재통화예정" },
] as const;

export type CallResult = (typeof CALL_RESULT_META)[number]["key"];

const CALL_RESULT_LABELS: Record<string, string> = Object.fromEntries(CALL_RESULT_META.map((c) => [c.key, c.label]));

function formatLogDateTime(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

interface CallLogSheetProps {
  logs: CallLog[];
  loadingLogs: boolean;
  result: CallResult;
  onChangeResult: (result: CallResult) => void;
  memo: string;
  onChangeMemo: (memo: string) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function CallLogSheet({
  logs,
  loadingLogs,
  result,
  onChangeResult,
  memo,
  onChangeMemo,
  saving,
  onClose,
  onSave,
}: CallLogSheetProps) {
  return (
    <BottomSheet onClose={onClose} maxHeight="none">
      <div className="mb-4 text-lg font-extrabold text-gray-900">해피콜 이력 저장</div>

      <div className="mb-2 text-[13px] font-bold text-gray-800">이전 통화 이력</div>
      <div className="mp-scroll mb-5 flex max-h-40 flex-col gap-2 overflow-y-auto">
        {loadingLogs ? (
          <div className="py-3 text-center text-[12.5px] text-gray-400">불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-center text-[12.5px] text-gray-400">
            이전 통화 이력이 없어요
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-gray-200 bg-white px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-bold text-gray-800">{CALL_RESULT_LABELS[log.result] ?? log.result}</span>
                <span className="text-[11px] text-gray-400 tabular-nums">{formatLogDateTime(log.createdAt)}</span>
              </div>
              {log.memo && <div className="mt-1 text-[12px] text-gray-600">{log.memo}</div>}
            </div>
          ))
        )}
      </div>

      <div className="mb-2 text-[13px] font-bold text-gray-800">통화 결과</div>
      <div className="mb-[18px] flex gap-2">
        {CALL_RESULT_META.map((c) => (
          <span
            key={c.key}
            onClick={() => onChangeResult(c.key)}
            className={`cursor-pointer rounded-full px-3.5 py-[7px] text-[13px] font-bold ${
              result === c.key ? "bg-brand text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {c.label}
          </span>
        ))}
      </div>
      <div className="mb-5">
        <Textarea value={memo} onChange={(e) => onChangeMemo(e.target.value)} placeholder="통화 내용을 간단히 적어주세요" rows={3} />
      </div>
      <Button disabled={saving} onClick={onSave}>
        {saving ? "저장 중..." : "저장"}
      </Button>
    </BottomSheet>
  );
}
