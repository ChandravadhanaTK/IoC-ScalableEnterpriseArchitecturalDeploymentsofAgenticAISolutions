interface ProgressBarProps {
  value: number;
  label?: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      {label ? <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-600"><span>{label}</span><span>{Math.round(percentage)}%</span></div> : null}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
