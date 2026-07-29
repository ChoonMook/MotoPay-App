// Cardoc 토큰 기반 공용 스위치(토글) 컴포넌트
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function Switch({ checked, onChange, label }: SwitchProps) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-11 flex-none appearance-none rounded-full border-0 p-0 transition-colors ${
        checked ? "bg-brand" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );

  if (!label) return button;

  return (
    <div className="flex items-center justify-between">
      <span className="text-[15px] text-gray-800">{label}</span>
      {button}
    </div>
  );
}
