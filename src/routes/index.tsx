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
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  PlusIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Stat } from "@/components/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currency } from "@/lib/finance";
import {
  CATEGORIAS_GASTO,
  CATEGORIAS_INGRESO,
  MESES,
  etiquetaMes,
  useMovimientos,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel financiero · Brújula.fin" },
      {
        name: "description",
        content:
          "Visualiza tu presupuesto, ingresos y gastos con gráficas claras y registra movimientos en segundos.",
      },
      { property: "og:title", content: "Panel financiero · Brújula.fin" },
      {
        property: "og:description",
        content: "Presupuesto, ingresos y gastos en gráficas claras.",
      },
    ],
  }),
  component: Panel,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-1)",
  "var(--chart-3)",
];

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "12px",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

function Panel() {
  const { movimientos, agregar, eliminar } = useMovimientos();
  const [mesActivo, setMesActivo] = useState(MESES[MESES.length - 1]);

  const [tipo, setTipo] = useState<"ingreso" | "gasto">("gasto");
  const [categoria, setCategoria] = useState("Vivienda");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");

  const delMes = useMemo(
    () => movimientos.filter((m) => m.mes === mesActivo),
    [movimientos, mesActivo],
  );

  const ingresos = delMes
    .filter((m) => m.tipo === "ingreso")
    .reduce((s, m) => s + m.monto, 0);
  const gastos = delMes.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
  const balance = ingresos - gastos;
  const tasaAhorro = ingresos > 0 ? balance / ingresos : 0;

  const serieMensual = MESES.map((mes) => {
    const items = movimientos.filter((m) => m.mes === mes);
    const i = items.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
    const g = items.filter((m) => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
    return { mes: etiquetaMes(mes), Ingresos: i, Gastos: g, Balance: i - g };
  });

  const porCategoria = CATEGORIAS_GASTO.map((cat) => ({
    name: cat,
    value: delMes
      .filter((m) => m.tipo === "gasto" && m.categoria === cat)
      .reduce((s, m) => s + m.monto, 0),
  })).filter((c) => c.value > 0);

  // Regla 50/30/20 como marco de presupuesto
  const grupos = {
    Necesidades: ["Vivienda", "Alimentación", "Transporte", "Salud"],
    Deseos: ["Ocio", "Educación", "Otros"],
    "Deuda y ahorro": ["Deudas"],
  } as const;
  const objetivos = { Necesidades: 0.5, Deseos: 0.3, "Deuda y ahorro": 0.2 };

  const presupuesto = (Object.keys(grupos) as (keyof typeof grupos)[]).map((g) => {
    const real = delMes
      .filter((m) => m.tipo === "gasto" && grupos[g].includes(m.categoria as never))
      .reduce((s, m) => s + m.monto, 0);
    const objetivo = ingresos * objetivos[g];
    return { grupo: g, real, objetivo, uso: objetivo > 0 ? real / objetivo : 0 };
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(monto);
    if (!valor || valor <= 0) {
      toast.error("Escribe un monto mayor a cero");
      return;
    }
    agregar({
      tipo,
      categoria,
      descripcion: descripcion.trim() || categoria,
      monto: valor,
      mes: mesActivo,
    });
    setDescripcion("");
    setMonto("");
    toast.success("Movimiento registrado");
  };

  return (
    <AppShell
      title="Tu panorama del mes"
      subtitle="Registra tus ingresos y gastos y observa al instante cómo cambia tu presupuesto, tu ahorro y tus tendencias."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tabs value={mesActivo} onValueChange={setMesActivo}>
          <TabsList className="bg-secondary">
            {MESES.map((m) => (
              <TabsTrigger key={m} value={m}>
                {etiquetaMes(m)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Ingresos del mes"
          value={currency(ingresos)}
          tone="positive"
          icon={<ArrowUpRightIcon className="size-4" />}
        />
        <Stat
          label="Gastos del mes"
          value={currency(gastos)}
          tone="negative"
          icon={<ArrowDownRightIcon className="size-4" />}
        />
        <Stat
          label="Balance"
          value={currency(balance)}
          tone={balance >= 0 ? "positive" : "negative"}
          hint={balance >= 0 ? "Te queda margen para ahorrar" : "Estás gastando más de lo que entra"}
          icon={<WalletIcon className="size-4" />}
        />
        <Stat
          label="Tasa de ahorro"
          value={`${(tasaAhorro * 100).toFixed(1)}%`}
          tone={tasaAhorro >= 0.2 ? "positive" : "accent"}
          hint="Meta recomendada: 20%"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="panel p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Ingresos vs. gastos</h2>
          <p className="mb-4 text-sm text-muted-foreground">Últimos seis meses</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serieMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => currency(v)}
                  cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Ingresos" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Gastos" fill="var(--chart-6)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Gastos por categoría</h2>
          <p className="mb-2 text-sm text-muted-foreground">{etiquetaMes(mesActivo)}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porCategoria}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="var(--color-card)"
                >
                  {porCategoria.map((entry, idx) => (
                    <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Tendencia de tu balance</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Cuánto te queda libre cada mes después de gastar
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serieMensual}>
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M`}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
                <Area
                  type="monotone"
                  dataKey="Balance"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#balanceFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Presupuesto 50 / 30 / 20</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Comparación con tus ingresos de {etiquetaMes(mesActivo)}
          </p>
          <div className="space-y-5">
            {presupuesto.map((p) => (
              <div key={p.grupo}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{p.grupo}</span>
                  <span className="numeric text-xs text-muted-foreground">
                    {currency(p.real)} / {currency(p.objetivo)}
                  </span>
                </div>
                <Progress value={Math.min(100, p.uso * 100)} />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {p.uso > 1
                    ? `Te pasaste ${((p.uso - 1) * 100).toFixed(0)}% del objetivo`
                    : `Usaste ${(p.uso * 100).toFixed(0)}% del objetivo`}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Registrar movimiento</h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tipo === "gasto" ? "default" : "secondary"}
                onClick={() => {
                  setTipo("gasto");
                  setCategoria(CATEGORIAS_GASTO[0]);
                }}
              >
                Gasto
              </Button>
              <Button
                type="button"
                variant={tipo === "ingreso" ? "default" : "secondary"}
                onClick={() => {
                  setTipo("ingreso");
                  setCategoria(CATEGORIAS_INGRESO[0]);
                }}
              >
                Ingreso
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Descripción</Label>
              <Input
                id="desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Mercado de la semana"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="250000"
              />
            </div>

            <Button type="submit" className="w-full">
              <PlusIcon className="size-4" /> Agregar a {etiquetaMes(mesActivo)}
            </Button>
          </form>
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Movimientos de {etiquetaMes(mesActivo)}</h2>
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
            {delMes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay movimientos este mes.</p>
            ) : (
              delMes.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface px-3 py-2.5"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      m.tipo === "ingreso" ? "bg-success" : "bg-destructive"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{m.categoria}</p>
                  </div>
                  <span
                    className={`numeric text-sm font-semibold ${
                      m.tipo === "ingreso" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {m.tipo === "ingreso" ? "+" : "−"}
                    {currency(m.monto)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar movimiento"
                    onClick={() => eliminar(m.id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
