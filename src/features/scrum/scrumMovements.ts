import type { ClientBilling } from "./scrum.types";
import { formatCurrency, getMonthlyAmount } from "./scrum.utils";

// Movimientos de clientes (24/10/2026, pedido explicito): altas y cambios
// de monto ("aumento de plan en La Claudia: ingreso a stock"). Los usan la
// linea roja de la grafica de ganancia y la lista de movimientos del
// final. Todo pasado a "por mes", igual que el total de ganancia.
export type ClientMovement = {
  kind: "nuevo" | "aumento" | "baja";
  clientName: string;
  at: string;
  monthlyDelta: number;
  detail: string;
};

export const MOVEMENT_LABELS: Record<ClientMovement["kind"], string> = {
  nuevo: "Cliente nuevo",
  aumento: "Aumento de plan",
  baja: "Baja de plan"
};

export const MOVEMENT_COLORS: Record<ClientMovement["kind"], string> = {
  nuevo: "#1f4ed8",
  aumento: "#dc2626",
  baja: "#6b7280"
};

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

// Las fechas de alta y de cambio vienen con hora (ISO completo);
// formatDate de scrum.utils espera solo YYYY-MM-DD, por eso una propia.
export function formatMovementDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-UY", { timeZone: "America/Montevideo", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function signedMoney(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(Math.round(value)))}`;
}

// El alta (con el monto con el que entro: el "anterior" del primer cambio
// si lo hubo) y cada cambio de monto, del mas nuevo al mas viejo.
export function buildClientMovements(clients: ClientBilling[]): ClientMovement[] {
  const movements: ClientMovement[] = [];
  for (const client of clients) {
    const history = [...client.amountHistory].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
    const startAmount = history.length ? history[0].previousAmount : client.amount;
    movements.push({
      kind: "nuevo",
      clientName: client.name,
      at: client.createdAt,
      monthlyDelta: getMonthlyAmount(startAmount, client.frequency),
      detail: `Entró con ${formatCurrency(startAmount)}${client.frequency === "monthly" ? " por mes" : " cada 6 meses"}`
    });
    for (const change of history) {
      if (change.newAmount === change.previousAmount) continue;
      movements.push({
        kind: change.newAmount > change.previousAmount ? "aumento" : "baja",
        clientName: client.name,
        at: change.changedAt,
        monthlyDelta: getMonthlyAmount(change.newAmount - change.previousAmount, client.frequency),
        detail: `${formatCurrency(change.previousAmount)} → ${formatCurrency(change.newAmount)}${change.description ? ` · ${change.description}` : ""}`
      });
    }
  }
  return movements.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

// Linea roja: aumentos de plan acumulados (por mes) al cierre de cada uno
// de los ultimos `count` meses -- arranca en lo acumulado hasta entonces y
// sube cada vez que un cliente aumenta su monto.
export function getCumulativeRaisesByMonth(movements: ClientMovement[], count: number, referenceDate: Date = new Date()) {
  const raises = movements.filter((movement) => movement.kind === "aumento");
  const values: number[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i + 1, 1).getTime();
    values.push(raises.filter((movement) => new Date(movement.at).getTime() < monthEnd).reduce((total, movement) => total + movement.monthlyDelta, 0));
  }
  return values;
}
