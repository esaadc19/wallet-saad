import { useEffect, useState } from "react";
import type { Debt } from "./finance";

export type Movimiento = {
  id: string;
  tipo: "ingreso" | "gasto";
  categoria: string;
  descripcion: string;
  monto: number;
  mes: string; // "2026-09"
};

export const CATEGORIAS_GASTO = [
  "Vivienda",
  "Alimentación",
  "Transporte",
  "Deudas",
  "Salud",
  "Ocio",
  "Educación",
  "Otros",
];

export const CATEGORIAS_INGRESO = ["Salario", "Freelance", "Rentas", "Otros"];

export const MESES = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

export const etiquetaMes = (m: string) => {
  const [y, mm] = m.split("-");
  const nombres = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return `${nombres[Number(mm) - 1] ?? mm} ${(y ?? "").slice(2)}`;
};

const id = () => Math.random().toString(36).slice(2, 9);

function seedMovimientos(): Movimiento[] {
  const base: [Movimiento["tipo"], string, string, number][] = [
    ["ingreso", "Salario", "Nómina mensual", 5200000],
    ["ingreso", "Freelance", "Proyectos por fuera", 850000],
    ["gasto", "Vivienda", "Arriendo y servicios", 1750000],
    ["gasto", "Alimentación", "Mercado y domicilios", 980000],
    ["gasto", "Transporte", "Gasolina y transporte", 420000],
    ["gasto", "Deudas", "Cuotas tarjeta y crédito", 1150000],
    ["gasto", "Salud", "EPS y medicamentos", 260000],
    ["gasto", "Ocio", "Salidas y suscripciones", 390000],
    ["gasto", "Educación", "Curso de inglés", 210000],
  ];

  return MESES.flatMap((mes, idx) =>
    base.map(([tipo, categoria, descripcion, monto]) => ({
      id: id(),
      tipo,
      categoria,
      descripcion,
      monto: Math.round(monto * (1 + (idx - 2.5) * 0.02)),
      mes,
    })),
  );
}

const DEUDAS_SEED: Debt[] = [
  { id: id(), nombre: "Tarjeta de crédito", saldo: 6800000, tasaAnual: 0.32, pagoMinimo: 340000 },
  { id: id(), nombre: "Crédito de libre inversión", saldo: 12500000, tasaAnual: 0.21, pagoMinimo: 520000 },
  { id: id(), nombre: "Crédito de vehículo", saldo: 18000000, tasaAnual: 0.155, pagoMinimo: 690000 },
  { id: id(), nombre: "Préstamo familiar", saldo: 2200000, tasaAnual: 0.05, pagoMinimo: 150000 },
];

function usePersisted<T>(key: string, initial: () => T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignora almacenamiento no disponible */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignora almacenamiento no disponible */
    }
  }, [key, value, ready]);

  return [value, setValue] as const;
}

export function useMovimientos() {
  const [movimientos, setMovimientos] = usePersisted<Movimiento[]>(
    "fin.movimientos",
    seedMovimientos,
  );

  const agregar = (m: Omit<Movimiento, "id">) =>
    setMovimientos((prev) => [{ ...m, id: id() }, ...prev]);

  const eliminar = (mid: string) =>
    setMovimientos((prev) => prev.filter((m) => m.id !== mid));

  return { movimientos, agregar, eliminar };
}

export function useDeudas() {
  const [deudas, setDeudas] = usePersisted<Debt[]>("fin.deudas", () => DEUDAS_SEED);

  const agregar = (d: Omit<Debt, "id">) =>
    setDeudas((prev) => [...prev, { ...d, id: id() }]);
  const eliminar = (did: string) => setDeudas((prev) => prev.filter((d) => d.id !== did));
  const actualizar = (did: string, patch: Partial<Debt>) =>
    setDeudas((prev) => prev.map((d) => (d.id === did ? { ...d, ...patch } : d)));

  return { deudas, agregar, eliminar, actualizar };
}

/* ------------------------------ Inversiones ----------------------------- */

export type TipoInversion =
  | "CDT"
  | "Fondo de inversión"
  | "Acciones"
  | "Cripto"
  | "Fondo de pensiones"
  | "Bienes raíces"
  | "Otro";

export const TIPOS_INVERSION: TipoInversion[] = [
  "CDT",
  "Fondo de inversión",
  "Acciones",
  "Cripto",
  "Fondo de pensiones",
  "Bienes raíces",
  "Otro",
];

export type Inversion = {
  id: string;
  nombre: string;
  tipo: TipoInversion;
  invertido: number; // total de dinero puesto
  valorActual: number; // valor de mercado hoy
  tasaAnual: number; // rendimiento anual esperado (decimal, ej. 0.09)
};

const INVERSIONES_SEED: Inversion[] = [
  {
    id: id(),
    nombre: "CDT Banco digital",
    tipo: "CDT",
    invertido: 8000000,
    valorActual: 8480000,
    tasaAnual: 0.108,
  },
  {
    id: id(),
    nombre: "Fondo indexado S&P 500",
    tipo: "Fondo de inversión",
    invertido: 6000000,
    valorActual: 7350000,
    tasaAnual: 0.11,
  },
  {
    id: id(),
    nombre: "Acciones Ecopetrol",
    tipo: "Acciones",
    invertido: 2500000,
    valorActual: 2180000,
    tasaAnual: 0.06,
  },
  {
    id: id(),
    nombre: "Pensión voluntaria",
    tipo: "Fondo de pensiones",
    invertido: 4200000,
    valorActual: 4650000,
    tasaAnual: 0.075,
  },
  {
    id: id(),
    nombre: "Bitcoin",
    tipo: "Cripto",
    invertido: 1500000,
    valorActual: 2400000,
    tasaAnual: 0.15,
  },
];

export function useInversiones() {
  const [inversiones, setInversiones] = usePersisted<Inversion[]>(
    "fin.inversiones",
    () => INVERSIONES_SEED,
  );

  const agregar = (inv: Omit<Inversion, "id">) =>
    setInversiones((prev) => [...prev, { ...inv, id: id() }]);
  const eliminar = (iid: string) =>
    setInversiones((prev) => prev.filter((i) => i.id !== iid));
  const actualizar = (iid: string, patch: Partial<Inversion>) =>
    setInversiones((prev) => prev.map((i) => (i.id === iid ? { ...i, ...patch } : i)));

  return { inversiones, agregar, eliminar, actualizar };
}
