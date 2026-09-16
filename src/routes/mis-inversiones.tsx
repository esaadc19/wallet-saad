import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
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
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currency, pct } from "@/lib/finance";
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
          "Registra tu portafolio real: cuánto has invertido, cuánto vale hoy, cómo está distribuido y qué rentabilidad llevas.",
      },
      { property: "og:title", content: "Mis inversiones · Brújula.fin" },
      {
        property: "og:description",
        content: "Tu portafolio real: valor, distribución y rendimiento.",
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

function MisInversiones() {
  const { inversiones, agregar, eliminar } = useInversiones();

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoInversion>("CDT");
  const [invertido, setInvertido] = useState(1_000_000);
  const [valorActual, setValorActual] = useState(1_000_000);
  const [tasa, setTasa] = useState(8);

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
      subtitle="Tu portafolio real: registra cada inversión, actualiza su valor y mira cómo se distribuye y cuánto te ha rendido."
    >
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
    </AppShell>
  );
}
