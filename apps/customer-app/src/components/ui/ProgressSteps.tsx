// Cardoc 디자인시스템 ProgressSteps 컴포넌트(components/data/ProgressSteps.jsx) 스펙 그대로 이식
// 원형 배지에 단계 번호(완료 시 체크마크) 표시 + 사이 연결선
interface ProgressStepsProps {
  steps: string[];
  current: number;
}

export default function ProgressSteps({ steps, current }: ProgressStepsProps) {
  return (
    <div className="flex items-start">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const on = done || active;
        return (
          <div key={label} className="contents">
            <div className="flex w-16 flex-none flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  on ? "bg-brand text-white" : "bg-gray-100 text-gray-500"
                } ${active ? "ring-[3px] ring-brand-subtle" : ""}`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-center text-[11px] leading-[1.3] ${
                  active ? "font-semibold" : "font-normal"
                } ${on ? "text-gray-900" : "text-gray-500"}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={`mt-[13px] h-0.5 flex-1 rounded-sm ${
                  i < current ? "bg-brand" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
