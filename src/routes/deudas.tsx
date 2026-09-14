import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PlusIcon, Trash2Icon, TrophyIcon } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency, simulateDebtPlan, STRATEGIES, type StrategyId } from "@/lib/finance";
import { useDeudas } from "@/lib/store";

export const Route = createFileRoute("/deudas")({
  head: () => ({
    meta: [
      { title: "Plan de salida de deudas · Brújula.fin" },
      {
        name: "description",
        content:
          "Compara bola de nieve, avalancha y los métodos de priorización de Harvard para salir de deudas más rápido.",
      },
      { property: "og:title", content: "Plan de salida de deudas · Brújula.fin" },
      {
        property: "og:description",
        content: "Bola de nieve, avalancha y métodos de Harvard comparados lado a lado.",
      },
    ],
  }),
  component: Deudas,
});

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

const LINE_COLORS: Record<StrategyId, string> = {
  avalancha: "var(--chart-1)",
  bola_nieve: "var(--chart-2)",
  harvard_ratio: "var(--chart-3)",
  harvard_flujo: "var(--chart-4)",
  proporcional: "var(--chart-5)",
};

function Deudas() {
  const { deudas, agregar, eliminar } = useDeudas();
  const [extra, setExtra] = useState(600_000);
  const [seleccion, setSeleccion] = useState<StrategyId>("avalancha");

  const [nombre, setNombre] = useState("");
  const [saldo, setSaldo] = useState("");
  const [tasa, setTasa] = useState("");
  const [minimo, setMinimo] = useState("");

  const totalSaldo = deudas.reduce((s, d) => s + d.saldo, 0);
  const totalMinimos = deudas.reduce((s, d) => s + d.pagoMinimo, 0);
  const pagoMensual = totalMinimos + extra;
  const tasaPromedio =
    totalSaldo > 0
      ? deudas.reduce((s, d) => s + d.tasaAnual * d.saldo, 0) / totalSaldo
      : 0;

  const planes = useMemo(
    () =>
      STRATEGIES.map((s) => ({
        ...s,
        plan: simulateDebtPlan(deudas, pagoMensual, s.id),
      })),
    [deudas, pagoMensual],
  );

  const mejor = useMemo(
    () =>
      planes.reduce((best, p) =>
        p.plan.totalIntereses < best.plan.totalIntereses ? p : best,
      ),
    [planes],
  );

  const activo = planes.find((p) => p.id === seleccion)!;
  const maxMeses = Math.max(...planes.map((p) => p.plan.meses));

  const serieComparada = Array.from({ length: maxMeses + 1 }, (_, mes) => {
    const punto: Record<string, number> = { mes };
    for (const p of planes) {
      punto[p.nombre] = p.plan.serie[mes]?.saldo ?? 0;
    }
    return punto;
  });

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const s = Number(saldo);
    const t = Number(tasa);
    const m = Number(minimo);
    if (!nombre.trim() || !s || !m) {
      toast.error("Completa nombre, saldo y pago mínimo");
      return;
    }
    agregar({ nombre: nombre.trim(), saldo: s, tasaAnual: t / 100, pagoMinimo: m });
    setNombre("");
    setSaldo("");
    setTasa("");
    setMinimo("");
    toast.success("Deuda agregada al plan");
  };

  return (
    <AppShell
      title="Simulador de salida de deudas"
      subtitle="Pon todas tus deudas sobre la mesa, decide cuánto extra puedes pagar cada mes y compara cinco estrategias para liberarte antes."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Deuda total" value={currency(totalSaldo)} tone="negative" />
        <Stat
          label="Pagos mínimos"
          value={currency(totalMinimos)}
          hint="Lo que debes cubrir sí o sí"
        />
        <Stat
          label="Tasa promedio ponderada"
          value={`${(tasaPromedio * 100).toFixed(1)}%`}
          tone="accent"
        />
        <Stat
          label="Estrategia más económica"
          value={mejor.nombre}
          tone="positive"
          hint={`${mejor.plan.meses} meses · ${currency(mejor.plan.totalIntereses)} en intereses`}
          icon={<TrophyIcon className="size-4" />}
        />
      </div>

      <section className="panel mt-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Tu pago mensual total</h2>
            <p className="text-sm text-muted-foreground">
              Mínimos ({currency(totalMinimos)}) + abono extra
            </p>
          </div>
          <p className="numeric text-2xl font-semibold text-primary">
            {currency(pagoMensual)}
          </p>
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Abono extra mensual</Label>
            <span className="numeric text-accent">{currency(extra)}</span>
          </div>
          <Slider
            value={[extra]}
            min={0}
            max={3_000_000}
            step={50_000}
            onValueChange={([v]) => setExtra(v)}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {planes.map((p) => {
          const activoCard = p.id === seleccion;
          return (
            <button
              key={p.id}
              onClick={() => setSeleccion(p.id)}
              className={`panel text-left transition-all ${
                activoCard ? "ring-2 ring-primary" : "hover:border-primary/50"
              } p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base font-semibold">{p.nombre}</h3>
                {p.id === mejor.id ? <Badge>Más barata</Badge> : null}
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {p.origen}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{p.descripcion}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tiempo</p>
                  <p className="numeric font-semibold">{p.plan.meses} meses</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Intereses</p>
                  <p className="numeric font-semibold text-destructive">
                    {currency(p.plan.totalIntereses)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="panel p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Comparación de estrategias</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Saldo total pendiente mes a mes con un abono extra de {currency(extra)}
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serieComparada}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="mes"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  label={{ value: "Meses", position: "insideBottom", offset: -4, fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {planes.map((p) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.nombre}
                    stroke={LINE_COLORS[p.id]}
                    strokeWidth={p.id === seleccion ? 3 : 1.5}
                    strokeOpacity={p.id === seleccion ? 1 : 0.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Orden de ataque</h2>
          <p className="mb-4 text-sm text-muted-foreground">Método: {activo.nombre}</p>
          {activo.id === "proporcional" ? (
            <p className="text-sm text-muted-foreground">
              Este método reparte el excedente entre todas las deudas al mismo tiempo, en
              proporción a su saldo.
            </p>
          ) : (
            <ol className="space-y-3">
              {activo.plan.orden.map((nombreDeuda, idx) => {
                const liq = activo.plan.liquidaciones.find((l) => l.nombre === nombreDeuda);
                return (
                  <li
                    key={nombreDeuda}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface px-3 py-2.5"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {nombreDeuda}
                    </span>
                    {liq ? (
                      <span className="numeric text-xs text-muted-foreground">
                        mes {liq.mes}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-5 rounded-lg bg-secondary p-4 text-sm">
            <p className="text-muted-foreground">Pagarías en total</p>
            <p className="numeric mt-1 text-xl font-semibold">
              {currency(activo.plan.totalPagado)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {currency(activo.plan.totalIntereses)} de eso son solo intereses.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="panel p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Tus deudas</h2>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deuda</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Tasa anual</TableHead>
                  <TableHead className="text-right">Pago mínimo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deudas.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nombre}</TableCell>
                    <TableCell className="numeric text-right">{currency(d.saldo)}</TableCell>
                    <TableCell className="numeric text-right text-accent">
                      {(d.tasaAnual * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="numeric text-right">
                      {currency(d.pagoMinimo)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Eliminar ${d.nombre}`}
                        onClick={() => eliminar(d.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Agregar deuda</h2>
          <form onSubmit={onAdd} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tarjeta tienda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saldo">Saldo actual</Label>
              <Input
                id="saldo"
                type="number"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
                placeholder="2500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasa">Tasa de interés anual (%)</Label>
              <Input
                id="tasa"
                type="number"
                value={tasa}
                onChange={(e) => setTasa(e.target.value)}
                placeholder="28"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimo">Pago mínimo mensual</Label>
              <Input
                id="minimo"
                type="number"
                value={minimo}
                onChange={(e) => setMinimo(e.target.value)}
                placeholder="180000"
              />
            </div>
            <Button type="submit" className="w-full">
              <PlusIcon className="size-4" /> Agregar deuda
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
