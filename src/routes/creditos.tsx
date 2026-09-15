import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
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
import { currency, monthlyRate, simulateLoan } from "@/lib/finance";

export const Route = createFileRoute("/creditos")({
  head: () => ({
    meta: [
      { title: "Simulador de créditos · Brújula.fin" },
      {
        name: "description",
        content:
          "Calcula tu cuota mensual, los intereses totales y cuánto ahorras con abonos extra a capital.",
      },
      { property: "og:title", content: "Simulador de créditos · Brújula.fin" },
      {
        property: "og:description",
        content: "Cuota, intereses y ahorro por abonos extra a capital.",
      },
    ],
  }),
  component: Creditos,
});

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

function Creditos() {
  const [monto, setMonto] = useState(40_000_000);
  const [tasa, setTasa] = useState(18);
  const [meses, setMeses] = useState(60);
  const [extra, setExtra] = useState(0);
  const [ingreso, setIngreso] = useState(6_000_000);

  const base = useMemo(() => simulateLoan(monto, tasa / 100, meses, 0), [monto, tasa, meses]);
  const conExtra = useMemo(
    () => simulateLoan(monto, tasa / 100, meses, extra),
    [monto, tasa, meses, extra],
  );

  const ahorroIntereses = base.totalIntereses - conExtra.totalIntereses;
  const mesesAhorrados = base.tabla.length - conExtra.tabla.length;
  const cuotaTotal = base.cuota + extra;
  const carga = ingreso > 0 ? cuotaTotal / ingreso : 0;

  const serie = base.tabla.map((r, idx) => ({
    mes: r.n,
    "Saldo sin abono": r.saldo,
    "Saldo con abono": conExtra.tabla[idx]?.saldo ?? 0,
    Interés: r.interes,
    Capital: r.abono,
  }));

  const composicion = [
    { name: "Capital", value: monto },
    { name: "Intereses", value: conExtra.totalIntereses },
  ];

  return (
    <AppShell
      title="Simulador de créditos"
      subtitle="Descubre cuánto pagarías de cuota, cuántos intereses cuesta el crédito y cómo cambia todo si abonas un poco más cada mes."
    >
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="panel h-fit p-5">
          <h2 className="text-lg font-semibold">Datos del crédito</h2>
          <div className="mt-5 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto solicitado</Label>
              <Input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Tasa de interés anual</Label>
                <span className="numeric text-primary">{tasa.toFixed(1)}%</span>
              </div>
              <Slider
                value={[tasa]}
                min={1}
                max={45}
                step={0.5}
                onValueChange={(v) => setTasa(v[0]!)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Plazo</Label>
                <span className="numeric text-primary">{meses} meses</span>
              </div>
              <Slider
                value={[meses]}
                min={6}
                max={240}
                step={6}
                onValueChange={(v) => setMeses(v[0]!)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Abono extra mensual</Label>
                <span className="numeric text-accent">{currency(extra)}</span>
              </div>
              <Slider
                value={[extra]}
                min={0}
                max={2_000_000}
                step={50_000}
                onValueChange={(v) => setExtra(v[0]!)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingreso">Tu ingreso mensual</Label>
              <Input
                id="ingreso"
                type="number"
                value={ingreso}
                onChange={(e) => setIngreso(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Sirve para medir qué porcentaje de tu sueldo se iría a la cuota.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Cuota mensual" value={currency(base.cuota)} hint="Sin abono extra" />
            <Stat
              label="Intereses totales"
              value={currency(conExtra.totalIntereses)}
              tone="negative"
            />
            <Stat
              label="Ahorro con abono extra"
              value={currency(ahorroIntereses)}
              tone="positive"
              hint={`${mesesAhorrados} meses menos de deuda`}
            />
            <Stat
              label="Carga sobre tu ingreso"
              value={`${(carga * 100).toFixed(1)}%`}
              tone={carga > 0.3 ? "negative" : "positive"}
              hint="Se recomienda no pasar del 30%"
            />
          </div>

          <div className="panel p-5">
            <h2 className="text-lg font-semibold">Cómo baja tu saldo</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Tasa mensual equivalente: {(monthlyRate(tasa / 100) * 100).toFixed(3)}%
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie}>
                  <defs>
                    <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="Saldo sin abono"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    fill="url(#saldoFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Saldo con abono"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel p-5">
              <h2 className="text-lg font-semibold">Interés vs. capital en cada cuota</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="Interés"
                      stroke="var(--chart-6)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Capital"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-semibold">Cuánto es deuda y cuánto es interés</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={composicion}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      stroke="var(--color-card)"
                    >
                      <Cell fill="var(--chart-1)" />
                      <Cell fill="var(--chart-6)" />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="text-lg font-semibold">Tabla de amortización</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Primeros 24 pagos incluyendo tu abono extra
            </p>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Interés</TableHead>
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conExtra.tabla.slice(0, 24).map((r) => (
                    <TableRow key={r.n}>
                      <TableCell>{r.n}</TableCell>
                      <TableCell className="numeric text-right">{currency(r.cuota)}</TableCell>
                      <TableCell className="numeric text-right text-destructive">
                        {currency(r.interes)}
                      </TableCell>
                      <TableCell className="numeric text-right text-success">
                        {currency(r.abono)}
                      </TableCell>
                      <TableCell className="numeric text-right">{currency(r.saldo)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
