// Cardoc 토큰 기반 공용 체크박스 컴포넌트
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border-[1.5px] transition-colors ${
          checked ? "border-brand bg-brand" : "border-gray-400 bg-white"
        }`}
      >
        {checked && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="text-[15px] text-gray-800">{label}</span>
    </label>
  );
}
