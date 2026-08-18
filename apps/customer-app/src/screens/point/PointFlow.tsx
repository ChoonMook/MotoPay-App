// 고객앱 "포인트" 4개 화면(CU-PNT-01,02,06,07)을 엮는 상태 컨테이너 (RsvFlow.tsx와 동일한 패턴)
// 잔액·등급·내역·충전 모두 apps/api(/me/points/*)와 연동된 실 데이터(2026-08-18) — 실제 은행/카드 게이트웨이
// 연동은 없고, 예약 결제 확정과 동일하게 확정 즉시 적립 처리(1P=1원, 추가 적립 없음).
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import { getMyPointsSummary, getMyPointHistory, getMyGradeInfo, chargeMyPoints, type MyGradeInfoApi } from "../../api/points";
import PtScreen from "./PtScreen";
import PtChargeAmtSelScreen from "./PtChargeAmtSelScreen";
import PtHistScreen from "./PtHistScreen";
import GradeBenefitScreen from "./GradeBenefitScreen";
import { parseDigits, toUiKind } from "./pointFormat";
import type { PtScreenId, PtHistFilter, PtMethodKey, PtHistItem } from "./pntTypes";

interface PointFlowProps {
  onExit: () => void;
  onOpenShop: () => void;
}

export default function PointFlow({ onExit, onOpenShop }: PointFlowProps) {
  const [screen, setScreen] = useState<PtScreenId>("main");
  const [chargeAmt, setChargeAmt] = useState(300000);
  const [chargeEtc, setChargeEtc] = useState("");
  const [chargeMethod, setChargeMethod] = useState<PtMethodKey>("bank");
  const [histFilter, setHistFilter] = useState<PtHistFilter>("all");
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalCharged, setTotalCharged] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [history, setHistory] = useState<PtHistItem[]>([]);
  const [gradeInfo, setGradeInfo] = useState<MyGradeInfoApi | null>(null);
  const [charging, setCharging] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([getMyPointsSummary(), getMyPointHistory(), getMyGradeInfo()])
      .then(([summary, hist, grade]) => {
        setBalance(summary.balance);
        setTotalCharged(summary.totalCharged);
        setTotalUsed(summary.totalUsed);
        setHistory(
          hist.map((h) => ({
            title: h.title,
            date: h.createdAt,
            kind: toUiKind(h.kind),
            amt: h.amount,
            bal: h.balanceAfter,
          })),
        );
        setGradeInfo(grade);
      })
      .catch(() => showToast("포인트 정보를 불러오지 못했어요", "danger"))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const goMain = () => setScreen("main");
  const chargeVal = chargeEtc ? parseDigits(chargeEtc) : chargeAmt;

  // 하드웨어 백버튼: 각 화면 상단 '‹' 버튼의 onBack과 동일하게 main으로 복귀
  useEffect(() => {
    if (screen === "main") return;
    return pushBackAction(goMain);
  }, [screen]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {screen === "main" && (
        <PtScreen
          onExit={onExit}
          onOpenCharge={() => setScreen("chargeamt")}
          onOpenHist={() => setScreen("hist")}
          onOpenGrade={() => setScreen("grade")}
          onOpenShop={onOpenShop}
          onToast={(label) => showToast(`${label} 탭으로 이동해요`)}
          loading={loading}
          balance={balance}
          grade={gradeInfo?.grade ?? null}
          totalCharged={totalCharged}
          totalUsed={totalUsed}
          recentHistory={history.slice(0, 3)}
        />
      )}

      {screen === "chargeamt" && (
        <PtChargeAmtSelScreen
          onBack={goMain}
          chargeAmt={chargeAmt}
          chargeEtc={chargeEtc}
          chargeMethod={chargeMethod}
          onSelectAmt={(v) => {
            setChargeAmt(v);
            setChargeEtc("");
          }}
          onChangeEtc={setChargeEtc}
          onSelectMethod={setChargeMethod}
          submitting={charging}
          onPay={() => {
            if (chargeVal < 10000 || charging) return;
            setCharging(true);
            chargeMyPoints({ amount: chargeVal, method: chargeMethod === "bank" ? "BANK" : "CARD" })
              .then(() => {
                showToast(`${chargeVal.toLocaleString("en-US")}P가 적립됐어요`, "success");
                setChargeEtc("");
                loadAll();
                setTimeout(() => setScreen("hist"), 800);
              })
              .catch((err) => showToast(err instanceof Error ? err.message : "충전에 실패했어요", "danger"))
              .finally(() => setCharging(false));
          }}
        />
      )}

      {screen === "hist" && (
        <PtHistScreen
          onBack={goMain}
          filter={histFilter}
          onSelectFilter={setHistFilter}
          loading={loading}
          balance={balance}
          allHistory={history}
        />
      )}

      {screen === "grade" && <GradeBenefitScreen onBack={goMain} loading={loading} gradeInfo={gradeInfo} />}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
