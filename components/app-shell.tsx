"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/brand";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppShell({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          background: "color-mix(in oklab, var(--bg) 80%, transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="BI Express">
            <BrandWordmark size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            {actions}
            <Link href="/settings" aria-label="Configurações">
              <Button variant="ghost" size="icon">
                <Settings className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer
        className="border-t py-6 text-center text-xs"
        style={{
          color: "var(--text-muted)",
          borderColor: "var(--border)",
        }}
      >
        BI Express · 100% gratuito · processamento local no seu navegador
      </footer>
    </div>
  );
}
