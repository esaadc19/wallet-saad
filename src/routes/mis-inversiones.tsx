import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalculatorIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { capitalParaRenta, currency, pct, simulateInvestment } from "@/lib/finance";
import {
  TIPOS_INVERSION,
  useInversiones,
  type TipoInversion,
} from "@/lib/store";

export const Route = createFileRoute("/mis-inversiones")({
  head: () => ({
    meta: [
      { title: "Mis inversiones · Brújula.fin" },
      {
        name: "description",
        content:
          "Registra tu portafolio real, mira su distribución y rendimiento, y simula cómo crecen tus aportes con interés compuesto.",
      },
      { property: "og:title", content: "Mis inversiones · Brújula.fin" },
      {
        property: "og:description",
        content: "Tu portafolio real y un simulador de inversión con interés compuesto.",
      },
    ],
  }),
  component: MisInversiones,
});

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

const COLORES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const PERFILES = [
  { nombre: "Conservador", retorno: 7, detalle: "CDT y deuda pública" },
  { nombre: "Moderado", retorno: 11, detalle: "Mezcla de renta fija y acciones" },
  { nombre: "Arriesgado", retorno: 15, detalle: "Acciones globales e índices" },
];

function MisInversiones() {
  const { inversiones, agregar, eliminar } = useInversiones();

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoInversion>("CDT");
  const [invertido, setInvertido] = useState(1_000_000);
  const [valorActual, setValorActual] = useState(1_000_000);
  const [tasa, setTasa] = useState(8);
  const [simOpen, setSimOpen] = useState(false);

  const resumen = useMemo(() => {
    const totalInvertido = inversiones.reduce((s, i) => s + i.invertido, 0);
    const totalActual = inversiones.reduce((s, i) => s + i.valorActual, 0);
    const ganancia = totalActual - totalInvertido;
    const rentabilidad = totalInvertido > 0 ? ganancia / totalInvertido : 0;
    const tasaPonderada =
      totalActual > 0
        ? inversiones.reduce(
            (s, i) => s + i.tasaAnual * (i.valorActual / totalActual),
            0,
          )
        : 0;
    return { totalInvertido, totalActual, ganancia, rentabilidad, tasaPonderada };
  }, [inversiones]);

  const porTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const i of inversiones) {
      mapa.set(i.tipo, (mapa.get(i.tipo) ?? 0) + i.valorActual);
    }
    return [...mapa.entries()].map(([name, value]) => ({ name, value }));
  }, [inversiones]);

  const comparativa = useMemo(
    () =>
      inversiones.map((i) => ({
        nombre: i.nombre.length > 14 ? `${i.nombre.slice(0, 14)}…` : i.nombre,
        Invertido: i.invertido,
        "Valor actual": i.valorActual,
      })),
    [inversiones],
  );

  const onAgregar = () => {
    if (!nombre.trim() || invertido <= 0 || valorActual <= 0) {
      toast.error("Completa el nombre y montos mayores a cero.");
      return;
    }
    agregar({
      nombre: nombre.trim(),
      tipo,
      invertido,
      valorActual,
      tasaAnual: tasa / 100,
    });
    setNombre("");
    setInvertido(1_000_000);
    setValorActual(1_000_000);
    setTasa(8);
    toast.success("Inversión agregada a tu portafolio.");
  };

  return (
    <AppShell
      title="Mis inversiones"
      subtitle="Tu portafolio real: registra cada inversión, actualiza su valor y mira cómo se distribuye y cuánto te ha rendido. ¿Quieres proyectar aportes nuevos? Abre el simulador."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Gestiona tu portafolio y simula cómo crecerían tus aportes con interés compuesto.
        </p>
        <Button onClick={() => setSimOpen(true)} className="gap-2">
          <CalculatorIcon className="size-4" />
          Simulador de inversión
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="panel h-fit p-5">
          <h2 className="text-lg font-semibold">Registrar inversión</h2>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Ej: CDT Banco X"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoInversion)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INVERSION.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invertido">Total invertido</Label>
              <Input
                id="invertido"
                type="number"
                value={invertido}
                onChange={(e) => setInvertido(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor actual</Label>
              <Input
                id="valor"
                type="number"
                value={valorActual}
                onChange={(e) => setValorActual(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tasa">Rendimiento anual esperado (%)</Label>
              <Input
                id="tasa"
                type="number"
                step="0.1"
                value={tasa}
                onChange={(e) => setTasa(Number(e.target.value) || 0)}
              />
            </div>
            <Button onClick={onAgregar} className="w-full">
              <PlusIcon className="size-4" />
              Agregar al portafolio
            </Button>
            <p className="text-xs text-muted-foreground">
              Se guarda en tu navegador; actualiza el valor actual cuando quieras
              para ver tu ganancia real.
            </p>
          </div>
        </section>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Valor del portafolio" value={currency(resumen.totalActual)} tone="positive" />
            <Stat label="Total invertido" value={currency(resumen.totalInvertido)} />
            <Stat
              label={resumen.ganancia >= 0 ? "Ganancia acumulada" : "Pérdida acumulada"}
              value={currency(resumen.ganancia)}
              tone={resumen.ganancia >= 0 ? "positive" : "negative"}
              hint={pct(resumen.rentabilidad)}
            />
            <Stat
              label="Rentabilidad esperada"
              value={pct(resumen.tasaPonderada)}
              tone="accent"
              hint="Promedio anual ponderado"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="panel p-5">
              <h2 className="text-lg font-semibold">Distribución por tipo</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                En qué está tu dinero hoy
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porTipo}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {porTipo.map((_, idx) => (
                        <Cell key={idx} fill={COLORES[idx % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-semibold">Invertido vs. valor actual</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Cuánto pusiste y cuánto vale cada una
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativa} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={110}
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => currency(v)}
                      cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Invertido" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="Valor actual" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="text-lg font-semibold">Detalle del portafolio</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Rendimiento por inversión y proyección a un año
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Inversión</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 text-right font-medium">Invertido</th>
                    <th className="py-2 pr-4 text-right font-medium">Valor actual</th>
                    <th className="py-2 pr-4 text-right font-medium">Ganancia</th>
                    <th className="py-2 pr-4 text-right font-medium">Rend.</th>
                    <th className="py-2 pr-4 text-right font-medium">En 1 año</th>
                    <th className="py-2 text-right font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {inversiones.map((i) => {
                    const gan = i.valorActual - i.invertido;
                    const rend = i.invertido > 0 ? gan / i.invertido : 0;
                    const proyeccion = i.valorActual * (1 + i.tasaAnual);
                    return (
                      <tr key={i.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 pr-4 font-medium">{i.nombre}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{i.tipo}</td>
                        <td className="numeric py-3 pr-4 text-right">{currency(i.invertido)}</td>
                        <td className="numeric py-3 pr-4 text-right">{currency(i.valorActual)}</td>
                        <td
                          className={`numeric py-3 pr-4 text-right font-medium ${
                            gan >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {currency(gan)}
                        </td>
                        <td
                          className={`numeric py-3 pr-4 text-right ${
                            rend >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {pct(rend)}
                        </td>
                        <td className="numeric py-3 pr-4 text-right text-muted-foreground">
                          {currency(proyeccion)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              eliminar(i.id);
                              toast.success("Inversión eliminada.");
                            }}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                            aria-label={`Eliminar ${i.nombre}`}
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {inversiones.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aún no tienes inversiones registradas. Agrega la primera con el
                  formulario.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Panel lateral del simulador */}
      {simOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSimOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl flex-col border-l border-border bg-background shadow-2xl"
            role="dialog"
            aria-label="Simulador de inversión"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Simulador de inversión</h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  Mira cómo el interés compuesto multiplica tus aportes, cuánto se come la
                  inflación y qué capital necesitas para vivir de tus rentas.
                </p>
              </div>
              <button
                onClick={() => setSimOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Cerrar simulador"
              >
                <XIcon className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <SimuladorInversion />
            </div>
          </aside>
        </>
      ) : null}
    </AppShell>
  );
}

function SimuladorInversion() {
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

  const final = puntos[puntos.length - 1]!;
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
      Valor: serie[serie.length - 1]!.valor,
      "Valor real": serie[serie.length - 1]!.valorReal,
    };
  });

  const serieGrafica = puntos.map((p) => ({
    anio: `Año ${p.anio}`,
    Aportado: p.aportado,
    "Valor nominal": p.valor,
    "Valor ajustado por inflación": p.valorReal,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="panel h-fit p-5">
        <h3 className="text-lg font-semibold">Tu plan de aportes</h3>
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
            <Slider value={[anios]} min={1} max={40} step={1} onValueChange={(v) => setAnios(v[0]!)} />
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
              onValueChange={(v) => setRetorno(v[0]!)}
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
              onValueChange={(v) => setInflacion(v[0]!)}
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
              onValueChange={(v) => setIncremento(v[0]!)}
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
        <div className="grid gap-4 sm:grid-cols-2">
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
          <h3 className="text-lg font-semibold">Crecimiento de tu portafolio</h3>
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

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="panel p-5">
            <h3 className="text-lg font-semibold">Según tu perfil de riesgo</h3>
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

          <div className="panel p-5 sm:col-span-2">
            <h3 className="text-lg font-semibold">Tu meta de independencia</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Para recibir {currency(rentaDeseada)} al mes sin trabajar
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Capital necesario
            </p>
            <p className="numeric mt-1 text-2xl font-semibold text-gradient-primary sm:text-3xl">
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
  );
}
