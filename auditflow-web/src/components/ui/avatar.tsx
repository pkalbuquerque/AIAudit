export function Avatar({
  name,
  size = 28,
  tone,
}: {
  name: string;
  size?: number;
  tone?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palette = ["#1A3A4A", "#2C7BE5", "#0A8F6A", "#B47600", "#7E3AF2", "#E5533C"];
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = tone || palette[hash % palette.length];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
