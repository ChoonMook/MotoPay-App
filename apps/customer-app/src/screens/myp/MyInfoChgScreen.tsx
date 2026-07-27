// CU-MYPG-08: 내 정보 변경 - 프로필 사진·이름·이메일 수정, 휴대폰 번호(인증됨, 읽기전용), 비밀번호 변경 진입
import { useRef } from "react";
import Button from "../../components/ui/Button";
import CommonHeader from "../common/CommonHeader";
import { EditIcon, ChevronRightIcon } from "./mypIcons";
import { isNativeBridgeAvailable, pickFromLibrary } from "../../native/bridge";

interface MyInfoChgScreenProps {
  onBack: () => void;
  profName: string;
  profPhone: string;
  profEmail: string;
  profileImageUrl: string | null;
  onChangeName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onSelectPhoto: (dataUri: string) => void;
  onOpenPwEdit: () => void;
  onSave: () => void;
  photoUploading?: boolean;
  saving?: boolean;
  onError?: (message: string) => void;
}

export default function MyInfoChgScreen({
  onBack,
  profName,
  profPhone,
  profEmail,
  profileImageUrl,
  onChangeName,
  onChangeEmail,
  onSelectPhoto,
  onOpenPwEdit,
  onSave,
  photoUploading = false,
  saving = false,
  onError,
}: MyInfoChgScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onSelectPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onTapChangePhoto = async () => {
    if (isNativeBridgeAvailable()) {
      try {
        const { base64, mimeType } = await pickFromLibrary();
        onSelectPhoto(`data:${mimeType};base64,${base64}`);
      } catch (err) {
        if (err instanceof Error) onError?.(err.message);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ animation: "mp-screen .32s ease" }}>
      <CommonHeader title="내 정보 변경" onBack={onBack} />

      <div className="mp-scroll flex-1 overflow-y-auto px-5 pt-[22px] pb-6">
        <div className="mb-[22px] flex flex-col items-center gap-2.5">
          <span className="relative flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-full bg-brand-subtle text-[26px] font-extrabold text-brand">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="프로필 사진" className="h-full w-full object-cover" />
            ) : (
              profName.slice(0, 1)
            )}
            <span className="absolute right-0 bottom-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-brand text-white">
              <EditIcon size={13} />
            </span>
          </span>
          <span onClick={onTapChangePhoto} className="cursor-pointer text-xs font-bold text-brand">
            {photoUploading ? "업로드 중..." : "프로필 사진 변경"}
          </span>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />
        </div>

        <div className="mx-0.5 mb-2 text-[13px] font-extrabold text-gray-900">이름</div>
        <input
          value={profName}
          onChange={(e) => onChangeName(e.target.value)}
          className="w-full rounded-xl border border-gray-400 bg-white px-[15px] py-3.5 text-sm text-gray-900 outline-none"
        />

        <div className="mx-0.5 mt-[18px] mb-2 text-[13px] font-extrabold text-gray-900">휴대폰 번호</div>
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-[15px] py-3.5">
          <span className="text-sm font-semibold text-gray-500">{profPhone}</span>
          <span className="rounded-md bg-status-success-bg px-2 py-[3px] text-[11px] font-bold text-green-600">인증됨</span>
        </div>

        <div className="mx-0.5 mt-[18px] mb-2 text-[13px] font-extrabold text-gray-900">이메일</div>
        <input
          value={profEmail}
          onChange={(e) => onChangeEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-400 bg-white px-[15px] py-3.5 text-sm text-gray-900 outline-none"
        />

        <div onClick={onOpenPwEdit} className="mt-[18px] flex cursor-pointer items-center justify-between border-t border-gray-100 py-[15px]">
          <span className="text-sm font-bold text-gray-800">비밀번호 변경</span>
          <span className="text-gray-500">
            <ChevronRightIcon />
          </span>
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 bg-white px-5 pt-3.5 pb-6">
        <Button size="xl" disabled={saving} onClick={onSave}>
          {saving ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
}
