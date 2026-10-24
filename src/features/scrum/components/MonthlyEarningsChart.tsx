import { useMemo, useState } from "react";
import {
  earningsChartCaptionStyle,
  earningsChartCardStyle,
  earningsChartTitleStyle,
  earningsChartTooltipStyle
} from "../scrum.styles";
import { formatCurrency, getLastMonthLabels } from "../scrum.utils";

type Props = {
  currentMonthlyEarnings: number;
  // Linea roja (24/10/2026): aumentos de plan acumulados al cierre de cada
  // uno de los mismos 6 meses (ver getCumulativeRaisesByMonth).
  raisesByMonth: number[];
};

const SERIES_COLOR = "#1f4ed8";
const RAISES_COLOR = "#dc2626";
const MUTED_TEXT = "#8c98ad";
const GRIDLINE = "#e7ebf3";

// Historial inventado (pedido explicito, 22/10/2026: "pone cada mes...
// inventa, no hay problema -- al principio bajo, de a poquito, los
// ultimos dos meses aumento mas"). El ultimo punto NO es inventado: es
// currentMonthlyEarnings, el total real de hoy (ver ScrumClientsView).
// Los montos no son redondos a proposito, como los montos reales de los
// clientes (350, 500, etc).
const FICTITIOUS_PRIOR_MONTHS = [350, 700, 1150, 1700, 2950];

function roundToNiceStep(value: number) {
  if (value <= 1000) return 250;
  if (value <= 2500) return 500;
  if (value <= 6000) return 1000;
  return 2000;
}

function compactNumber(value: number) {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}K`;
  }
  return String(value);
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 44;
// 50px (no 16) para que el valor directo del ultimo punto -- centrado en
// su x -- no se corte contra el borde derecho del SVG.
const PADDING_RIGHT = 50;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;

export function MonthlyEarningsChart({ currentMonthlyEarnings, raisesByMonth }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const months = useMemo(() => getLastMonthLabels(6), []);
  const values = useMemo(() => [...FICTITIOUS_PRIOR_MONTHS, currentMonthlyEarnings], [currentMonthlyEarnings]);

  const maxValue = Math.max(...values, ...raisesByMonth);
  const step = roundToNiceStep(maxValue);
  const niceMax = Math.ceil((maxValue * 1.15) / step) * step;

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = values.map((value, index) => {
    const x = PADDING_LEFT + (plotWidth * index) / (values.length - 1);
    const y = PADDING_TOP + plotHeight - (plotHeight * value) / niceMax;
    return { x, y, value, month: months[index] };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  // Segunda linea (roja), misma escala y mismos meses que la azul.
  const raisePoints = points.map((point, index) => {
    const value = raisesByMonth[index] ?? 0;
    return { x: point.x, y: PADDING_TOP + plotHeight - (plotHeight * value) / niceMax, value };
  });
  const raisePath = raisePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PADDING_TOP + plotHeight} L ${points[0].x} ${PADDING_TOP + plotHeight} Z`;

  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, index) => {
    const value = (niceMax / gridSteps) * index;
    const y = PADDING_TOP + plotHeight - (plotHeight * value) / niceMax;
    return { value, y };
  });

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const step = plotWidth / (points.length - 1);
    const index = Math.round((relativeX - PADDING_LEFT) / step);
    setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <section style={earningsChartCardStyle}>
      <h2 style={earningsChartTitleStyle}>Evolución de la ganancia mensual</h2>
      <p style={earningsChartCaptionStyle}>Últimos 6 meses · el mes actual es el total real de hoy</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#4b5568", marginTop: 4 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: SERIES_COLOR }} /> Ganancia mensual
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: RAISES_COLOR }} /> Aumentos de plan (acumulado)
        </span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        style={{ width: "100%", height: "auto", marginTop: 8 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((line) => (
          <g key={line.value}>
            <line x1={PADDING_LEFT} y1={line.y} x2={CHART_WIDTH - PADDING_RIGHT} y2={line.y} stroke={GRIDLINE} strokeWidth={1} />
            <text x={PADDING_LEFT - 8} y={line.y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={MUTED_TEXT}>
              {compactNumber(line.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={SERIES_COLOR} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={SERIES_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={raisePath} fill="none" stroke={RAISES_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {raisePoints.map((point, index) => (
          <g key={`raise-${index}`}>
            <circle cx={point.x} cy={point.y} r={3.5} fill={RAISES_COLOR} stroke="#ffffff" strokeWidth={2} />
            {/* Valor abajo del punto (el de la azul va arriba) para que no se pisen. */}
            {point.value > 0 ? (
              <text x={index === 0 ? point.x + 4 : point.x} y={point.y + 16} textAnchor={index === 0 ? "start" : "middle"} fontSize={11} fontWeight={700} fill={RAISES_COLOR}>
                {formatCurrency(point.value)}
              </text>
            ) : null}
          </g>
        ))}

        {points.map((point, index) => {
          // El primero va alineado a la derecha (en vez de centrado) para
          // que no choque contra los numeros del eje Y, pedido explicito
          // de mostrar el valor en todos los puntos (22/10/2026).
          const isFirst = index === 0;
          return (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r={4} fill={SERIES_COLOR} stroke="#ffffff" strokeWidth={2} />
              <text x={point.x} y={CHART_HEIGHT - 6} textAnchor="middle" fontSize={11} fill={MUTED_TEXT}>
                {point.month}
              </text>
              <text
                x={isFirst ? point.x + 4 : point.x}
                y={point.y - 12}
                textAnchor={isFirst ? "start" : "middle"}
                fontSize={12}
                fontWeight={800}
                fill="#162033"
              >
                {formatCurrency(point.value)}
              </text>
            </g>
          );
        })}

        {hovered ? (
          <line
            x1={hovered.x}
            y1={PADDING_TOP}
            x2={hovered.x}
            y2={PADDING_TOP + plotHeight}
            stroke={MUTED_TEXT}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>

      {hovered ? (
        <div
          style={{
            ...earningsChartTooltipStyle,
            left: `${(hovered.x / CHART_WIDTH) * 100}%`,
            top: `${(hovered.y / CHART_HEIGHT) * 100}%`
          }}
        >
          <strong>{formatCurrency(hovered.value)}</strong> · {hovered.month}
          {hoverIndex !== null && (raisesByMonth[hoverIndex] ?? 0) > 0 ? ` · aumentos ${formatCurrency(raisesByMonth[hoverIndex])}` : ""}
        </div>
      ) : null}
    </section>
  );
}
