import { Card } from "@/components/ui/card";

export function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <p
        className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl"
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
