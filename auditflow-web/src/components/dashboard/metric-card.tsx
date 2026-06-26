import { I, type IconComponent } from "@/components/ui/icons";

const TONES = {
  ink: { value: "#0D1F2D", chip: "#0D1F2D", chipBg: "rgba(13,31,45,0.06)" },
  amber: { value: "#1C1C1E", chip: "#B47600", chipBg: "rgba(240,165,0,0.16)" },
  sky: { value: "#1C1C1E", chip: "#1F5FB4", chipBg: "rgba(44,123,229,0.12)" },
  mint: { value: "#1C1C1E", chip: "#0A8F6A", chipBg: "rgba(0,200,150,0.16)" },
};

export function MetricCard({
  label,
  value,
  hint,
  tone = "ink",
  Ic,
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: keyof typeof TONES;
  Ic: IconComponent;
  trend?: string;
}) {
  const toneStyle = TONES[tone];
  return (
    <div className="bg-white border border-line rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] tracking-[0.16em] uppercase text-sub">{label}</span>
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ color: toneStyle.chip, background: toneStyle.chipBg }}
        >
          <Ic size={15} />
        </span>
      </div>
      <div className="flex items-end gap-3">
        <div className="font-display text-[42px] leading-[1] tabular-nums" style={{ color: toneStyle.value }}>
          {value}
        </div>
        {trend && (
          <div className="text-[11.5px] text-sub mb-1.5 flex items-center gap-1">
            <I.trending size={12} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="text-[12.5px] text-sub">{hint}</div>
    </div>
  );
}
