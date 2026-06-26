"use client";

/* Wrapper de cartão da tela de Relatórios. Os gráficos agora são renderizados
   com dados reais diretamente em reports/page.tsx. */

export function ChartCard({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-line rounded-lg p-6 ${className}`}>
      <div className="mb-5">
        <h3 className="font-display text-[18px] text-text">{title}</h3>
        {hint && <div className="text-[12px] text-sub mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
