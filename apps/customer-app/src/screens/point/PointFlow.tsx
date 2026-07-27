// 고객앱 "포인트" 4개 화면(CU-PNT-01,02,06,07)을 엮는 상태 컨테이너 (RsvFlow.tsx와 동일한 패턴)
import { useEffect, useState } from "react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../components/ui/useToast";
import { pushBackAction } from "../../native/backHandler";
import PtScreen from "./PtScreen";
import PtChargeAmtSelScreen from "./PtChargeAmtSelScreen";
import PtHistScreen from "./PtHistScreen";
import GradeBenefitScreen from "./GradeBenefitScreen";
import { parseDigits } from "./pointFormat";
import type { PtScreenId, PtHistFilter, PtMethodKey } from "./pntTypes";

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
          onPay={() => {
            if (chargeVal < 10000) return;
            showToast(`${chargeVal.toLocaleString("en-US")}P가 적립됐어요`, "success");
            setTimeout(() => setScreen("hist"), 800);
          }}
        />
      )}

      {screen === "hist" && <PtHistScreen onBack={goMain} filter={histFilter} onSelectFilter={setHistFilter} />}

      {screen === "grade" && <GradeBenefitScreen onBack={goMain} />}

      {toast && (
        <div className="absolute inset-x-0 bottom-10 z-[90] flex justify-center px-6">
          <Toast tone={toast.tone}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
