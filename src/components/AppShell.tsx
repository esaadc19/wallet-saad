import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ChartPieIcon,
  LandmarkIcon,
  PiggyBankIcon,
  ScaleIcon,
  SparklesIcon,
} from "lucide-react";

const nav = [
  { to: "/", label: "Panel", icon: ChartPieIcon },
  { to: "/creditos", label: "Créditos", icon: LandmarkIcon },
  { to: "/deudas", label: "Deudas", icon: ScaleIcon },
  { to: "/inversion", label: "Inversión", icon: PiggyBankIcon },
  { to: "/asistente", label: "Asistente", icon: SparklesIcon },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <SparklesIcon className="size-5" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              Brújula
              <span className="text-primary">.fin</span>
            </span>
          </Link>

          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        </div>
        {children}
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-xs text-muted-foreground">
        Brújula.fin · Simulaciones educativas, no constituyen asesoría financiera.
      </footer>
    </div>
  );
}
