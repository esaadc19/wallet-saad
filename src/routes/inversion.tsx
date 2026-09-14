import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { capitalParaRenta, currency, simulateInvestment } from "@/lib/finance";

export const Route = createFileRoute("/inversion")({
  head: () => ({
    meta: [
      { title: "Simulador de inversión · Brújula.fin" },
      {
        name: "description",
        content:
          "Proyecta tus aportes mensuales con interés compuesto, ajusta por inflación y calcula tu meta de independencia financiera.",
      },
      { property: "og:title", content: "Simulador de inversión · Brújula.fin" },
      {
        property: "og:description",
        content: "Interés compuesto, inflación y meta de renta pasiva.",
      },
    ],
  }),
  component: Inversion,
});

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

const PERFILES = [
  { nombre: "Conservador", retorno: 7, detalle: "CDT y deuda pública" },
  { nombre: "Moderado", retorno: 11, detalle: "Mezcla de renta fija y acciones" },
  { nombre: "Arriesgado", retorno: 15, detalle: "Acciones globales e índices" },
];

function Inversion() {
  const [inicial, setInicial] = useState(5_000_000);
  const [aporte, setAporte] = useState(800_000);
  const [anios, setAnios] = useState(20);
  const [retorno, setRetorno] = useState(11);
  const [inflacion, setInflacion] = useState(5);
  const [incremento, setIncremento] = useState(3);
  const [rentaDeseada, setRentaDeseada] = useState(4_000_000);

  const puntos = useMemo(
    () =>
      simulateInvestment({
        inicial,
        aporteMensual: aporte,
        anios,
        retornoAnual: retorno / 100,
        inflacionAnual: inflacion / 100,
        incrementoAporteAnual: incremento / 100,
      }),
    [inicial, aporte, anios, retorno, inflacion, incremento],
  );

  const final = puntos[puntos.length - 1];
  const rendimientos = final.valor - final.aportado;
  const metaCapital = capitalParaRenta(rentaDeseada);
  const avance = Math.min(1, final.valor / metaCapital);

  const comparativa = PERFILES.map((p) => {
    const serie = simulateInvestment({
      inicial,
      aporteMensual: aporte,
      anios,
      retornoAnual: p.retorno / 100,
      inflacionAnual: inflacion / 100,
      incrementoAporteAnual: incremento / 100,
    });
    return {
      perfil: p.nombre,
      Valor: serie[serie.length - 1].valor,
      "Valor real": serie[serie.length - 1].valorReal,
    };
  });

  const serieGrafica = puntos.map((p) => ({
    anio: `Año ${p.anio}`,
    Aportado: p.aportado,
    "Valor nominal": p.valor,
    "Valor ajustado por inflación": p.valorReal,
  }));

  return (
    <AppShell
      title="Simulador de inversión"
      subtitle="Mira cómo el interés compuesto multiplica tus aportes, cuánto se come la inflación y qué capital necesitas para vivir de tus rentas."
    >
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="panel h-fit p-5">
          <h2 className="text-lg font-semibold">Tu plan de aportes</h2>
          <div className="mt-5 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inicial">Capital inicial</Label>
              <Input
                id="inicial"
                type="number"
                value={inicial}
                onChange={(e) => setInicial(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aporte">Aporte mensual</Label>
              <Input
                id="aporte"
                type="number"
                value={aporte}
                onChange={(e) => setAporte(Number(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Años invirtiendo</Label>
                <span className="numeric text-primary">{anios}</span>
              </div>
              <Slider value={[anios]} min={1} max={40} step={1} onValueChange={([v]) => setAnios(v)} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Retorno anual esperado</Label>
                <span className="numeric text-primary">{retorno.toFixed(1)}%</span>
              </div>
              <Slider
                value={[retorno]}
                min={1}
                max={25}
                step={0.5}
                onValueChange={([v]) => setRetorno(v)}
              />
              <div className="flex flex-wrap gap-2">
                {PERFILES.map((p) => (
                  <button
                    key={p.nombre}
                    onClick={() => setRetorno(p.retorno)}
                    className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
                  >
                    {p.nombre} {p.retorno}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Inflación anual</Label>
                <span className="numeric text-accent">{inflacion.toFixed(1)}%</span>
              </div>
              <Slider
                value={[inflacion]}
                min={0}
                max={15}
                step={0.5}
                onValueChange={([v]) => setInflacion(v)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Aumento anual de tu aporte</Label>
                <span className="numeric text-accent">{incremento.toFixed(1)}%</span>
              </div>
              <Slider
                value={[incremento]}
                min={0}
                max={15}
                step={0.5}
                onValueChange={([v]) => setIncremento(v)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="renta">Renta mensual que quieres al final</Label>
              <Input
                id="renta"
                type="number"
                value={rentaDeseada}
                onChange={(e) => setRentaDeseada(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Calculado con la regla del 4% de retiro anual.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Valor final" value={currency(final.valor)} tone="positive" />
            <Stat label="Total aportado" value={currency(final.aportado)} />
            <Stat
              label="Ganancia por interés compuesto"
              value={currency(rendimientos)}
              tone="positive"
              hint={`${((rendimientos / Math.max(final.aportado, 1)) * 100).toFixed(0)}% sobre lo aportado`}
            />
            <Stat
              label="Poder de compra real"
              value={currency(final.valorReal)}
              tone="accent"
              hint="Descontando la inflación"
            />
          </div>

          <div className="panel p-5">
            <h2 className="text-lg font-semibold">Crecimiento de tu portafolio</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Lo aportado frente a lo que rinde tu dinero
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieGrafica}>
                  <defs>
                    <linearGradient id="valorFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="aporteFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="anio" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="Valor nominal"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    fill="url(#valorFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Aportado"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    fill="url(#aporteFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Valor ajustado por inflación"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel p-5">
              <h2 className="text-lg font-semibold">Según tu perfil de riesgo</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Mismo aporte, distintos retornos esperados
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativa}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="perfil" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => currency(v)}
                      cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Valor" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Valor real" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {PERFILES.map((p) => (
                  <p key={p.nombre}>
                    <span className="font-semibold text-foreground">{p.nombre}:</span> {p.detalle}
                  </p>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-semibold">Tu meta de independencia</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                Para recibir {currency(rentaDeseada)} al mes sin trabajar
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Capital necesario
              </p>
              <p className="numeric mt-1 text-3xl font-semibold text-gradient-primary">
                {currency(metaCapital)}
              </p>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-all"
                  style={{ width: `${avance * 100}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Con tu plan actual llegarías al{" "}
                <span className="font-semibold text-foreground">
                  {(avance * 100).toFixed(0)}%
                </span>{" "}
                de esa meta en {anios} años.
              </p>
              <div className="mt-6 rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                {avance >= 1
                  ? "Vas por encima de la meta: podrías adelantar tu retiro o subir tu renta objetivo."
                  : `Te faltarían ${currency(metaCapital - final.valor)}. Subir tu aporte mensual o el aumento anual acerca mucho la meta.`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
