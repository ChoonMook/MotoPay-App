// 사진을 전체화면으로 확대해서 보여주는 공용 라이트박스(크게 보기) - photoUrl이 없으면 아무것도 렌더링하지 않음
interface PhotoLightboxProps {
  photoUrl: string | null;
  onClose: () => void;
}

export default function PhotoLightbox({ photoUrl, onClose }: PhotoLightboxProps) {
  if (!photoUrl) return null;

  return (
    <div className="absolute inset-0 z-[90] bg-black">
      <div className="absolute inset-x-0 top-[46px] z-10 flex h-[52px] items-center justify-end px-4">
        <button type="button" onClick={onClose} className="p-2 text-sm font-semibold text-white">
          닫기
        </button>
      </div>
      <div className="absolute inset-0 flex items-center justify-center" onClick={onClose}>
        <img src={photoUrl} alt="사진 크게 보기" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
