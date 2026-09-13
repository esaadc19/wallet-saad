// Motor de cálculos financieros (puro, sin dependencias)

export const currency = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

/* ------------------------------ Créditos ------------------------------ */

export type AmortRow = {
  n: number;
  cuota: number;
  interes: number;
  abono: number;
  saldo: number;
};

export type LoanResult = {
  cuota: number;
  totalPagado: number;
  totalIntereses: number;
  tabla: AmortRow[];
};

/** Tasa mensual efectiva a partir de una tasa anual efectiva (E.A.) */
export const monthlyRate = (annualRate: number) =>
  Math.pow(1 + annualRate, 1 / 12) - 1;

export function simulateLoan(
  monto: number,
  tasaAnual: number,
  meses: number,
  abonoExtra = 0,
): LoanResult {
  const i = monthlyRate(tasaAnual);
  const cuota =
    i === 0 ? monto / meses : (monto * i) / (1 - Math.pow(1 + i, -meses));

  const tabla: AmortRow[] = [];
  let saldo = monto;
  let n = 0;
  let totalPagado = 0;
  let totalIntereses = 0;

  while (saldo > 0.5 && n < 1200) {
    n += 1;
    const interes = saldo * i;
    let pago = cuota + abonoExtra;
    if (pago > saldo + interes) pago = saldo + interes;
    const abono = pago - interes;
    saldo = Math.max(0, saldo - abono);
    totalPagado += pago;
    totalIntereses += interes;
    tabla.push({ n, cuota: pago, interes, abono, saldo });
  }

  return { cuota, totalPagado, totalIntereses, tabla };
}

/* -------------------------------- Deudas ------------------------------- */

export type Debt = {
  id: string;
  nombre: string;
  saldo: number;
  tasaAnual: number;
  pagoMinimo: number;
};

export type StrategyId =
  | "avalancha"
  | "bola_nieve"
  | "harvard_ratio"
  | "harvard_flujo"
  | "proporcional";

export const STRATEGIES: {
  id: StrategyId;
  nombre: string;
  origen: string;
  descripcion: string;
}[] = [
  {
    id: "avalancha",
    nombre: "Avalancha",
    origen: "Óptimo financiero",
    descripcion:
      "Ataca primero la deuda con la tasa de interés más alta. Es el método que matemáticamente paga menos intereses.",
  },
  {
    id: "bola_nieve",
    nombre: "Bola de nieve",
    origen: "Motivacional",
    descripcion:
      "Ataca primero el saldo más pequeño. Ganas victorias rápidas y eso sostiene el hábito de pago.",
  },
  {
    id: "harvard_ratio",
    nombre: "Ratio de eficiencia (Harvard)",
    origen: "Harvard Business Review",
    descripcion:
      "Prioriza la deuda con mayor interés generado por cada peso de pago mínimo: (saldo x tasa) / pago mínimo. Combina costo real y liberación de flujo.",
  },
  {
    id: "harvard_flujo",
    nombre: "Liberación de flujo (Harvard)",
    origen: "Harvard Kennedy School / conductual",
    descripcion:
      "Prioriza la deuda que libera más flujo mensual por peso pendiente: pago mínimo / saldo. Recupera capacidad de pago lo antes posible.",
  },
  {
    id: "proporcional",
    nombre: "Consolidación proporcional",
    origen: "Enfoque de cartera",
    descripcion:
      "Reparte el excedente entre todas las deudas en proporción a su saldo. Reduce el riesgo de mora en todos los frentes.",
  },
];

export type DebtPlan = {
  meses: number;
  totalIntereses: number;
  totalPagado: number;
  serie: { mes: number; saldo: number }[];
  orden: string[];
  liquidaciones: { nombre: string; mes: number }[];
};

function priorityScore(d: Debt, id: StrategyId) {
  switch (id) {
    case "avalancha":
      return d.tasaAnual;
    case "bola_nieve":
      return -d.saldo;
    case "harvard_ratio":
      return (d.saldo * d.tasaAnual) / Math.max(d.pagoMinimo, 1);
    case "harvard_flujo":
      return d.pagoMinimo / Math.max(d.saldo, 1);
    default:
      return 0;
  }
}

export function simulateDebtPlan(
  debts: Debt[],
  pagoMensual: number,
  strategy: StrategyId,
): DebtPlan {
  const activos = debts
    .filter((d) => d.saldo > 0)
    .map((d) => ({ ...d, saldoActual: d.saldo }));

  const orden = [...activos]
    .sort((a, b) => priorityScore(b, strategy) - priorityScore(a, strategy))
    .map((d) => d.nombre);

  const serie: { mes: number; saldo: number }[] = [
    { mes: 0, saldo: activos.reduce((s, d) => s + d.saldoActual, 0) },
  ];
  const liquidaciones: { nombre: string; mes: number }[] = [];
  let totalIntereses = 0;
  let totalPagado = 0;
  let mes = 0;

  while (activos.some((d) => d.saldoActual > 0.5) && mes < 600) {
    mes += 1;
    const vivos = activos.filter((d) => d.saldoActual > 0.5);

    // 1) intereses del mes
    for (const d of vivos) {
      const interes = d.saldoActual * monthlyRate(d.tasaAnual);
      d.saldoActual += interes;
      totalIntereses += interes;
    }

    let disponible = pagoMensual;

    if (strategy === "proporcional") {
      const total = vivos.reduce((s, d) => s + d.saldoActual, 0);
      for (const d of vivos) {
        const pago = Math.min(d.saldoActual, disponible * (d.saldoActual / total));
        d.saldoActual -= pago;
        totalPagado += pago;
      }
      disponible = 0;
    } else {
      // 2) pagos mínimos
      for (const d of vivos) {
        const pago = Math.min(d.saldoActual, d.pagoMinimo, disponible);
        d.saldoActual -= pago;
        disponible -= pago;
        totalPagado += pago;
      }
      // 3) excedente a la deuda prioritaria
      const cola = [...vivos].sort(
        (a, b) => priorityScore(b, strategy) - priorityScore(a, strategy),
      );
      for (const d of cola) {
        if (disponible <= 0) break;
        const pago = Math.min(d.saldoActual, disponible);
        d.saldoActual -= pago;
        disponible -= pago;
        totalPagado += pago;
      }
    }

    for (const d of vivos) {
      if (d.saldoActual <= 0.5 && !liquidaciones.some((l) => l.nombre === d.nombre)) {
        liquidaciones.push({ nombre: d.nombre, mes });
      }
    }

    serie.push({
      mes,
      saldo: Math.max(
        0,
        activos.reduce((s, d) => s + d.saldoActual, 0),
      ),
    });
  }

  return { meses: mes, totalIntereses, totalPagado, serie, orden, liquidaciones };
}

/* ------------------------------ Inversión ------------------------------ */

export type InvestPoint = {
  anio: number;
  aportado: number;
  valor: number;
  valorReal: number;
};

export function simulateInvestment(opts: {
  inicial: number;
  aporteMensual: number;
  anios: number;
  retornoAnual: number;
  inflacionAnual: number;
  incrementoAporteAnual: number;
}): InvestPoint[] {
  const i = monthlyRate(opts.retornoAnual);
  let valor = opts.inicial;
  let aportado = opts.inicial;
  let aporte = opts.aporteMensual;
  const puntos: InvestPoint[] = [
    { anio: 0, aportado, valor, valorReal: valor },
  ];

  for (let a = 1; a <= opts.anios; a++) {
    for (let m = 0; m < 12; m++) {
      valor = valor * (1 + i) + aporte;
      aportado += aporte;
    }
    aporte *= 1 + opts.incrementoAporteAnual;
    puntos.push({
      anio: a,
      aportado,
      valor,
      valorReal: valor / Math.pow(1 + opts.inflacionAnual, a),
    });
  }
  return puntos;
}

/** Regla del 4%: capital necesario para una renta mensual perpetua */
export const capitalParaRenta = (rentaMensual: number, tasaRetiro = 0.04) =>
  (rentaMensual * 12) / tasaRetiro;
