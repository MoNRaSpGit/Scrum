import { useMemo, useState } from "react";
import type { ClientBilling } from "../scrum.types";
import { earningsChartCaptionStyle, earningsChartCardStyle, earningsChartTitleStyle, earningsChartTooltipStyle } from "../scrum.styles";

type Props = {
  clients: ClientBilling[];
};

// Naranja (segundo tono secuencial, el primero -- azul -- ya lo usa el
// grafico de ganancia mensual al lado): mismo criterio de un hue por
// serie que recomienda la guia de dataviz.
const BAR_COLOR = "#eb6834";
const MUTED_TEXT = "#8c98ad";
const GRIDLINE = "#e7ebf3";

const CHART_WIDTH = 640;
const CHART_HEIGHT = 260;
const PADDING_LEFT = 16;
const PADDING_RIGHT = 16;
const PADDING_TOP = 90; // deja lugar fijo arriba para el numero + los nombritos, sea cual sea la altura de la barra
const PADDING_BOTTOM = 28;
const BAR_MAX_WIDTH = 24;
const NAME_LINE_HEIGHT = 11;
const MAX_NAME_LENGTH = 16;

function truncateName(name: string) {
  return name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH - 1)}…` : name;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function NewClientsByMonthChart({ clients }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const months = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString("es-UY", { month: "short" }).replace(".", "");
      list.push({ key: getMonthKey(date), label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return list;
  }, []);

  const buckets = useMemo(() => {
    const byKey = new Map<string, string[]>(months.map((month) => [month.key, []]));
    for (const client of clients) {
      const key = getMonthKey(new Date(client.createdAt));
      if (byKey.has(key)) {
        byKey.get(key)!.push(client.name);
      }
    }
    return months.map((month) => ({ ...month, names: byKey.get(month.key) ?? [] }));
  }, [months, clients]);

  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.names.length));

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slotWidth = plotWidth / buckets.length;
  const baselineY = PADDING_TOP + plotHeight;

  const columns = buckets.map((bucket, index) => {
    const centerX = PADDING_LEFT + slotWidth * index + slotWidth / 2;
    const barWidth = Math.min(BAR_MAX_WIDTH, slotWidth * 0.5);
    const count = bucket.names.length;
    const barHeight = (plotHeight * 0.85 * count) / maxCount;
    const barTop = baselineY - barHeight;
    return { ...bucket, centerX, barWidth, count, barTop };
  });

  const gridSteps = 3;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, index) => {
    const y = PADDING_TOP + (plotHeight * index) / gridSteps;
    return y;
  });

  const hovered = hoverIndex !== null ? columns[hoverIndex] : null;

  return (
    <section style={earningsChartCardStyle}>
      <h2 style={earningsChartTitleStyle}>Clientes nuevos por mes</h2>
      <p style={earningsChartCaptionStyle}>Últimos 6 meses · cada alta real de cliente cuenta en el mes en que se cargó</p>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ width: "100%", height: "auto", marginTop: 8 }}>
        {gridLines.map((y) => (
          <line key={y} x1={PADDING_LEFT} y1={y} x2={CHART_WIDTH - PADDING_RIGHT} y2={y} stroke={GRIDLINE} strokeWidth={1} />
        ))}
        <line x1={PADDING_LEFT} y1={baselineY} x2={CHART_WIDTH - PADDING_RIGHT} y2={baselineY} stroke="#c3c2b7" strokeWidth={1} />

        {columns.map((column, index) => (
          <g
            key={column.key}
            onPointerEnter={() => setHoverIndex(index)}
            onPointerLeave={() => setHoverIndex(null)}
            style={{ cursor: "default" }}
          >
            {/* Area completa de la columna = zona de hover, mas grande que la barra sola. */}
            <rect x={PADDING_LEFT + slotWidth * index} y={0} width={slotWidth} height={CHART_HEIGHT} fill="transparent" />

            {column.count > 0 ? (
              <rect
                x={column.centerX - column.barWidth / 2}
                y={column.barTop}
                width={column.barWidth}
                height={baselineY - column.barTop}
                rx={4}
                fill={BAR_COLOR}
                opacity={hoverIndex === index ? 1 : 0.88}
              />
            ) : null}

            {/* Numero arriba (valor directo) + nombritos chicos, pedido explicito 22/10/2026. */}
            <text x={column.centerX} y={16} textAnchor="middle" fontSize={13} fontWeight={800} fill="#162033">
              {column.count}
            </text>
            {column.names.map((name, nameIndex) => (
              <text
                key={name + nameIndex}
                x={column.centerX}
                y={32 + nameIndex * NAME_LINE_HEIGHT}
                textAnchor="middle"
                fontSize={9}
                fill={MUTED_TEXT}
              >
                {truncateName(name)}
              </text>
            ))}

            <text x={column.centerX} y={CHART_HEIGHT - 6} textAnchor="middle" fontSize={11} fill={MUTED_TEXT}>
              {column.label}
            </text>
          </g>
        ))}
      </svg>

      {hovered ? (
        <div
          style={{
            ...earningsChartTooltipStyle,
            left: `${(hovered.centerX / CHART_WIDTH) * 100}%`,
            top: `${(hovered.barTop / CHART_HEIGHT) * 100}%`
          }}
        >
          <strong>{hovered.count}</strong> {hovered.count === 1 ? "cliente nuevo" : "clientes nuevos"} en {hovered.label}
          {hovered.names.length > 0 ? `: ${hovered.names.join(", ")}` : ""}
        </div>
      ) : null}
    </section>
  );
}
