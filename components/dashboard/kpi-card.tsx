import { Card } from "@/components/ui/card";

export function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 50%, transparent))",
        }}
      />
      <p
        className="text-[11px] font-medium uppercase tracking-[0.08em]"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </p>
      <p
        className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2rem]"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
          {sub}
        </p>
      ) : null}
    </Card>
  );
}
