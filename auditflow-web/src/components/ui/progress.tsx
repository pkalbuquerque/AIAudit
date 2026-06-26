export function Progress({
  value,
  color = "#0D1F2D",
  track = "#E2E8F0",
  width = 120,
  height = 6,
}: {
  value: number;
  color?: string;
  track?: string;
  width?: number | string;
  height?: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="rounded-full overflow-hidden" style={{ width, height, background: track }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color, transition: "width .4s ease" }}
        />
      </div>
      <span className="text-[12px] tabular-nums text-text font-medium">{value}%</span>
    </div>
  );
}
