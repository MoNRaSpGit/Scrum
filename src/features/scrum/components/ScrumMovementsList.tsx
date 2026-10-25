import { useMemo, useState } from "react";
import { earningsChartCaptionStyle, earningsChartCardStyle, earningsChartTitleStyle } from "../scrum.styles";
import { formatMovementDay, MOVEMENT_COLORS, MOVEMENT_LABELS, signedMoney, type ClientMovement } from "../scrumMovements";

type Props = {
  movements: ClientMovement[];
};

const GRIDLINE = "#e7ebf3";
const MUTED_TEXT = "#8c98ad";

// "YYYY-MM" (formato del <input type="month">) del mes de una fecha.
function monthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Movimientos de clientes (24/10/2026, pedido explicito): van al final de
// las graficas y se ve UN mes por vez -- arranca en el mes actual y con el
// selector se elige otro. Altas, aumentos y bajas de plan, del mas nuevo
// al mas viejo, con la descripcion de cada cambio de monto.
export function ScrumMovementsList({ movements }: Props) {
  const currentMonth = useMemo(() => monthValue(new Date()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const visible = useMemo(
    () => movements.filter((movement) => monthValue(new Date(movement.at)) === selectedMonth),
    [movements, selectedMonth]
  );

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("es-UY", { month: "long", year: "numeric" });

  return (
    <section style={earningsChartCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <h2 style={earningsChartTitleStyle}>Movimientos</h2>
          <p style={earningsChartCaptionStyle}>Clientes nuevos y cambios de plan de {monthLabel}</p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          max={currentMonth}
          onChange={(event) => setSelectedMonth(event.target.value || currentMonth)}
          aria-label="Elegir mes"
          style={{
            padding: "8px 10px",
            border: `1px solid ${GRIDLINE}`,
            borderRadius: 10,
            fontSize: 14,
            fontFamily: "inherit",
            color: "#162033",
            background: "#ffffff"
          }}
        />
      </div>

      {visible.length === 0 ? (
        <p style={{ ...earningsChartCaptionStyle, marginTop: 12 }}>Sin movimientos en {monthLabel}.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 8 }}>
          {visible.map((movement, index) => (
            <li
              key={`${movement.clientName}-${movement.at}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${GRIDLINE}`,
                borderLeft: `4px solid ${MOVEMENT_COLORS[movement.kind]}`
              }}
            >
              <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: "#162033" }}>
                  <strong style={{ color: MOVEMENT_COLORS[movement.kind] }}>{MOVEMENT_LABELS[movement.kind]}</strong> · {movement.clientName}
                </span>
                <span style={{ fontSize: 12, color: MUTED_TEXT }}>
                  {formatMovementDay(movement.at)} · {movement.detail}
                </span>
              </div>
              <strong style={{ whiteSpace: "nowrap", fontSize: 13, color: MOVEMENT_COLORS[movement.kind] }}>
                {signedMoney(movement.monthlyDelta)}/mes
              </strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
