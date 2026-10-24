import { useMemo, useState } from "react";
import type { ClientBilling } from "../scrum.types";
import { earningsChartCaptionStyle, earningsChartCardStyle, earningsChartTitleStyle, earningsChartTooltipStyle } from "../scrum.styles";
import { formatCurrency, getMonthlyAmount } from "../scrum.utils";

type Props = {
  clients: ClientBilling[];
};

// "Crecimiento por mes" (24/10/2026, pedido explicito): cuanto sumo por
// mes la ganancia mensual, separado en dos -- clientes nuevos (azul) y
// aumentos de plan de clientes que ya estaban (verde) -- con la lista de
// movimientos del mes debajo ("aumento de plan en La Claudia: ingreso a
// stock"). Todo sale de datos reales: fecha de alta de cada cliente y el
// historial de cambios de monto (con su descripcion). Las bajas de plan
// no restan en la barra; se listan en rojo en los movimientos.
const NEW_COLOR = "#1f4ed8";
const RAISE_COLOR = "#16a34a";
const DROP_COLOR = "#dc2626";
const MUTED_TEXT = "#8c98ad";
const GRIDLINE = "#e7ebf3";

const CHART_WIDTH = 640;
const CHART_HEIGHT = 240;
const PADDING_LEFT = 16;
const PADDING_RIGHT = 16;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 28;
const BAR_MAX_WIDTH = 34;

type Movement = {
  kind: "nuevo" | "aumento" | "baja";
  clientName: string;
  at: string;
  monthlyDelta: number;
  detail: string;
};

const KIND_LABELS: Record<Movement["kind"], string> = { nuevo: "Cliente nuevo", aumento: "Aumento de plan", baja: "Baja de plan" };
const KIND_COLORS: Record<Movement["kind"], string> = { nuevo: NEW_COLOR, aumento: RAISE_COLOR, baja: DROP_COLOR };

// Las fechas de alta y de cambio vienen con hora (ISO completo);
// formatDate de scrum.utils espera solo YYYY-MM-DD, por eso una propia.
function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-UY", { timeZone: "America/Montevideo", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function signedMoney(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(Math.round(value)))}`;
}

// Movimientos de todos los clientes: el alta (con el monto con el que
// entro, que es el "anterior" del primer cambio si lo hubo) y cada cambio
// de monto. Todo pasado a "por mes" para sumar planes mensuales y
// semestrales igual que el total de ganancia.
function buildMovements(clients: ClientBilling[]): Movement[] {
  const movements: Movement[] = [];
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

export function GrowthByMonthChart({ clients }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const months = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string; longLabel: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString("es-UY", { month: "short" }).replace(".", "");
      const longLabel = date.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
      list.push({ key: getMonthKey(date), label: label.charAt(0).toUpperCase() + label.slice(1), longLabel });
    }
    return list;
  }, []);

  // Mes elegido para la lista de movimientos: arranca en el actual y se
  // cambia tocando una barra.
  const [selectedKey, setSelectedKey] = useState(() => months[months.length - 1].key);

  const movements = useMemo(() => buildMovements(clients), [clients]);

  const buckets = useMemo(
    () =>
      months.map((month) => {
        const inMonth = movements.filter((movement) => getMonthKey(new Date(movement.at)) === month.key);
        const sum = (kind: Movement["kind"]) => inMonth.filter((movement) => movement.kind === kind).reduce((total, movement) => total + movement.monthlyDelta, 0);
        return { ...month, movements: inMonth, newAmount: sum("nuevo"), raiseAmount: sum("aumento"), dropAmount: sum("baja") };
      }),
    [months, movements]
  );

  const maxTotal = Math.max(1, ...buckets.map((bucket) => bucket.newAmount + bucket.raiseAmount));
  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slotWidth = plotWidth / buckets.length;
  const baselineY = PADDING_TOP + plotHeight;
  const scale = (value: number) => (plotHeight * 0.9 * value) / maxTotal;

  const columns = buckets.map((bucket, index) => {
    const centerX = PADDING_LEFT + slotWidth * index + slotWidth / 2;
    const barWidth = Math.min(BAR_MAX_WIDTH, slotWidth * 0.5);
    const newHeight = scale(bucket.newAmount);
    const raiseHeight = scale(bucket.raiseAmount);
    return { ...bucket, centerX, barWidth, newHeight, raiseHeight, top: baselineY - newHeight - raiseHeight };
  });

  const gridLines = Array.from({ length: 4 }, (_, index) => PADDING_TOP + (plotHeight * index) / 3);
  const hovered = hoverIndex !== null ? columns[hoverIndex] : null;
  const selected = buckets.find((bucket) => bucket.key === selectedKey) ?? buckets[buckets.length - 1];

  return (
    <section style={earningsChartCardStyle}>
      <h2 style={earningsChartTitleStyle}>Crecimiento por mes</h2>
      <p style={earningsChartCaptionStyle}>
        Cuánto sumó la ganancia mensual cada mes · tocá una barra para ver sus movimientos
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#4b5568", marginTop: 4 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: NEW_COLOR }} /> Clientes nuevos
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: RAISE_COLOR }} /> Aumentos de plan
        </span>
      </div>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ width: "100%", height: "auto", marginTop: 8 }}>
        {gridLines.map((y) => (
          <line key={y} x1={PADDING_LEFT} y1={y} x2={CHART_WIDTH - PADDING_RIGHT} y2={y} stroke={GRIDLINE} strokeWidth={1} />
        ))}
        <line x1={PADDING_LEFT} y1={baselineY} x2={CHART_WIDTH - PADDING_RIGHT} y2={baselineY} stroke="#c3c2b7" strokeWidth={1} />

        {columns.map((column, index) => {
          const isSelected = column.key === selected.key;
          const total = column.newAmount + column.raiseAmount;
          return (
            <g
              key={column.key}
              onPointerEnter={() => setHoverIndex(index)}
              onPointerLeave={() => setHoverIndex(null)}
              onClick={() => setSelectedKey(column.key)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={PADDING_LEFT + slotWidth * index}
                y={0}
                width={slotWidth}
                height={CHART_HEIGHT}
                fill={isSelected ? "#f1f5ff" : "transparent"}
                rx={8}
              />
              {column.newHeight > 0 ? (
                <rect
                  x={column.centerX - column.barWidth / 2}
                  y={baselineY - column.newHeight}
                  width={column.barWidth}
                  height={column.newHeight}
                  fill={NEW_COLOR}
                  rx={column.raiseHeight > 0 ? 0 : 4}
                />
              ) : null}
              {column.raiseHeight > 0 ? (
                <rect
                  x={column.centerX - column.barWidth / 2}
                  y={column.top}
                  width={column.barWidth}
                  height={column.raiseHeight}
                  fill={RAISE_COLOR}
                  rx={column.newHeight > 0 ? 0 : 4}
                />
              ) : null}
              <text x={column.centerX} y={Math.max(14, column.top - 6)} textAnchor="middle" fontSize={12} fontWeight={800} fill="#162033">
                {total > 0 ? `+${formatCurrency(Math.round(total))}` : "—"}
              </text>
              <text
                x={column.centerX}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isSelected ? 800 : 400}
                fill={isSelected ? "#162033" : MUTED_TEXT}
              >
                {column.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered ? (
        <div
          style={{
            ...earningsChartTooltipStyle,
            left: `${(hovered.centerX / CHART_WIDTH) * 100}%`,
            top: `${(Math.max(PADDING_TOP, hovered.top) / CHART_HEIGHT) * 100}%`
          }}
        >
          {hovered.label}: nuevos {signedMoney(hovered.newAmount)} · aumentos {signedMoney(hovered.raiseAmount)}
          {hovered.dropAmount < 0 ? ` · bajas ${signedMoney(hovered.dropAmount)}` : ""}
        </div>
      ) : null}

      <div style={{ marginTop: 12, borderTop: `1px solid ${GRIDLINE}`, paddingTop: 12 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#162033" }}>
          Movimientos de {selected.longLabel} ({selected.movements.length})
        </h3>
        {selected.movements.length === 0 ? (
          <p style={earningsChartCaptionStyle}>Sin movimientos este mes.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {selected.movements.map((movement, index) => (
              <li
                key={`${movement.clientName}-${movement.at}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${GRIDLINE}`,
                  borderLeft: `4px solid ${KIND_COLORS[movement.kind]}`
                }}
              >
                <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: "#162033" }}>
                    <strong style={{ color: KIND_COLORS[movement.kind] }}>{KIND_LABELS[movement.kind]}</strong> · {movement.clientName}
                  </span>
                  <span style={{ fontSize: 12, color: MUTED_TEXT }}>
                    {formatDay(movement.at)} · {movement.detail}
                  </span>
                </div>
                <strong style={{ whiteSpace: "nowrap", fontSize: 13, color: KIND_COLORS[movement.kind] }}>
                  {signedMoney(movement.monthlyDelta)}/mes
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
