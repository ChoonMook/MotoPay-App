// CU-MYPG-14: 회원 탈퇴 - 탈퇴 사유 선택·유의사항 동의 후 탈퇴, 탈퇴하기 탭 시 최종 확인 팝업(프로그램목록표엔 별도 화면ID 없어 이 화면에 인라인 구현)
import Button from "../../components/ui/Button";
import BottomSheet from "../../components/ui/BottomSheet";
import CommonHeader from "../common/CommonHeader";
import { WITHDRAW_REASONS } from "./mypData";

interface AcctWithdrawScreenProps {
  onBack: () => void;
  reason: string | null;
  onSelectReason: (r: string) => void;
  agree: boolean;
  onToggleAgree: () => void;
  onWithdraw: () => void;
  confirmOpen: boolean;
  onCancelConfirm: () => void;
  onConfirmFinal: () => void;
}

export default function AcctWithdrawScreen({
  onBack,
  reason,
  onSelectReason,
  agree,
  onToggleAgree,
  onWithdraw,
  confirmOpen,
  onCancelConfirm,
  onConfirmFinal,
}: AcctWithdrawScreenProps) {
  const ok = !!reason && agree;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="회원 탈퇴" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <div className="rounded-xl bg-accent-subtle px-[15px] py-3.5 text-[12.5px] leading-[1.55] text-gray-600">
          탈퇴 시 보유 포인트·쿠폰이 모두 소멸되며, 진행중인 예약·주문이 있으면 탈퇴가 제한될 수 있어요. 탈퇴 후에는 계정 복구가 불가능해요.
        </div>

        <div className="mx-0.5 mt-5 mb-2.5 text-[13px] font-extrabold text-gray-900">탈퇴 사유를 알려주세요</div>
        <div className="flex flex-col gap-2.5">
          {WITHDRAW_REASONS.map((r) => {
            const on = reason === r;
            return (
              <div
                key={r}
                onClick={() => onSelectReason(r)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-[15px] py-3.5 ${on ? "border-brand bg-brand-subtle" : "border-gray-200 bg-white"}`}
              >
                <span className={`flex h-[19px] w-[19px] flex-none items-center justify-center rounded-full text-[10.5px] text-white ${on ? "bg-brand" : "border-2 border-gray-300"}`}>
                  {on ? "✓" : ""}
                </span>
                <span className="text-[13.5px] font-semibold text-gray-800">{r}</span>
              </div>
            );
          })}
        </div>

        <div onClick={onToggleAgree} className="mt-5 flex cursor-pointer items-center gap-2.5">
          <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-md text-[11px] text-white ${agree ? "bg-brand" : "border-[1.5px] border-gray-300"}`}>
            {agree ? "✓" : ""}
          </span>
          <span className="text-[12.5px] text-gray-600">위 내용을 확인했으며 탈퇴에 동의합니다.</span>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={!ok} onClick={onWithdraw}>
          탈퇴하기
        </Button>
      </div>

      {confirmOpen && (
        <BottomSheet onClose={onCancelConfirm} maxHeight="50%">
          <div className="text-center text-[17px] font-extrabold text-gray-900">정말 탈퇴하시겠어요?</div>
          <div className="mt-2 text-center text-[12.5px] leading-relaxed text-gray-600">이 작업은 되돌릴 수 없어요.</div>
          <div className="mt-5 flex gap-2.5">
            <div className="flex-1">
              <Button variant="outline" onClick={onCancelConfirm}>
                취소
              </Button>
            </div>
            <div className="flex-1">
              <Button onClick={onConfirmFinal}>탈퇴하기</Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
