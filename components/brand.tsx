import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-2xl shadow-sm",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, var(--accent), var(--chart-3))",
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="size-[60%]"
      >
        <path d="M16 44V28" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M26 44V22" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M36 44V34" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M44 22L38 34H46L40 46"
          stroke="#FFD34D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BrandWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { mark: "size-7", text: "text-lg" },
    md: { mark: "size-9", text: "text-xl" },
    lg: { mark: "size-12", text: "text-2xl" },
  } as const;
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={s.mark} />
      <span
        className={cn("font-medium tracking-tight", s.text)}
        style={{ fontFamily: "var(--font-display)" }}
      >
        BI Express
      </span>
    </div>
  );
}
