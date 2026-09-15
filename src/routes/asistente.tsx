import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlarmClockIcon,
  BellIcon,
  BotIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  FileTextIcon,
  GoalIcon,
  ReceiptIcon,
  ShieldIcon,
  SplitIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Qué más puede hacer tu asistente · Brújula.fin" },
      {
        name: "description",
        content:
          "Ideas de nuevas capacidades para tu asistente financiero: fondo de emergencia, metas de ahorro, alertas, jubilación e impuestos.",
      },
      { property: "og:title", content: "Qué más puede hacer tu asistente" },
      {
        property: "og:description",
        content: "Roadmap de capacidades para tu asistente financiero personal.",
      },
    ],
  }),
  component: Asistente,
});

const ideas = [
  {
    icon: ShieldIcon,
    titulo: "Fondo de emergencia",
    prioridad: "Alta",
    texto:
      "Calcula cuántos meses de gastos tienes cubiertos y cuánto ahorrar cada mes para llegar a 3–6 meses de colchón.",
  },
  {
    icon: GoalIcon,
    titulo: "Metas de ahorro con fecha",
    prioridad: "Alta",
    texto:
      "Viaje, cuota inicial, maestría: defines el monto y la fecha, y el asistente te dice el aporte mensual y te muestra el avance.",
  },
  {
    icon: BellIcon,
    titulo: "Alertas y semáforo de riesgo",
    prioridad: "Alta",
    texto:
      "Avisos cuando una categoría se pasa del presupuesto, cuando tus cuotas superan el 30% del ingreso o cuando el balance se vuelve negativo.",
  },
  {
    icon: CalendarClockIcon,
    titulo: "Calendario de pagos",
    prioridad: "Alta",
    texto:
      "Fechas de corte, vencimientos y recordatorios para no pagar un solo peso de mora ni intereses de financiación.",
  },
  {
    icon: BotIcon,
    titulo: "Chat con tus números",
    prioridad: "Media",
    texto:
      "Preguntar en lenguaje natural: “¿puedo pagar un carro de 60 millones?” y recibir un análisis con tus datos reales.",
  },
  {
    icon: TrendingUpIcon,
    titulo: "Proyección de flujo de caja",
    prioridad: "Media",
    texto:
      "Proyecta los próximos 12 meses con tus ingresos y gastos habituales para anticipar meses apretados.",
  },
  {
    icon: SplitIcon,
    titulo: "Comparador de créditos entre bancos",
    prioridad: "Media",
    texto:
      "Compara varias ofertas con seguros y cuotas de manejo incluidas y muestra la tasa efectiva real de cada una.",
  },
  {
    icon: ReceiptIcon,
    titulo: "Lectura de extractos y facturas",
    prioridad: "Media",
    texto:
      "Subes el extracto o la foto de un recibo y el asistente clasifica los movimientos automáticamente.",
  },
  {
    icon: AlarmClockIcon,
    titulo: "Plan de jubilación",
    prioridad: "Media",
    texto:
      "Estima tu pensión, la brecha frente al estilo de vida que quieres y el ahorro voluntario necesario para cerrarla.",
  },
  {
    icon: FileTextIcon,
    titulo: "Preparación de impuestos",
    prioridad: "Baja",
    texto:
      "Acumula gastos deducibles durante el año y te dice si superas el tope para declarar renta.",
  },
  {
    icon: BriefcaseIcon,
    titulo: "Seguimiento de portafolio real",
    prioridad: "Baja",
    texto:
      "Registra tus inversiones, calcula la rentabilidad real y avisa cuándo rebalancear.",
  },
  {
    icon: UsersIcon,
    titulo: "Finanzas compartidas",
    prioridad: "Baja",
    texto:
      "Presupuesto en pareja o familia, con gastos comunes, reparto proporcional al ingreso y metas conjuntas.",
  },
];

const tonoPrioridad: Record<string, string> = {
  Alta: "bg-primary text-primary-foreground",
  Media: "bg-accent text-accent-foreground",
  Baja: "bg-secondary text-secondary-foreground",
};

function Asistente() {
  return (
    <AppShell
      title="Qué más puede hacer tu asistente"
      subtitle="Ya tienes panel de presupuesto, simulador de créditos, plan de deudas con cinco métodos e inversión. Estas son las siguientes capacidades que más valor te darían."
    >
      <section className="panel bg-hero p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Lo que ya está funcionando</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/", t: "Panel", d: "Ingresos, gastos, categorías y regla 50/30/20." },
            { to: "/creditos", t: "Créditos", d: "Cuota, intereses y ahorro por abonos extra." },
            { to: "/deudas", t: "Deudas", d: "Bola de nieve, avalancha y métodos Harvard." },
            { to: "/inversion", t: "Inversión", d: "Interés compuesto, inflación y regla del 4%." },
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-xl border border-border/70 bg-card/70 p-4 transition-colors hover:border-primary/60"
            >
              <p className="font-display font-semibold">{c.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ideas.map(({ icon: Icon, titulo, texto, prioridad }) => (
          <article key={titulo} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <Badge className={tonoPrioridad[prioridad]}>{prioridad}</Badge>
            </div>
            <h3 className="mt-4 text-base font-semibold">{titulo}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
          </article>
        ))}
      </div>

      <section className="panel mt-8 p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">¿Cuál agregamos primero?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Dime el nombre de la capacidad que quieres y la construyo en la app. Si quieres
          guardar tus datos en la nube y entrar con tu usuario, también puedo activarlo.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Volver al panel</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/deudas">Ver mi plan de deudas</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
