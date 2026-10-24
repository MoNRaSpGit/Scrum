import { useMemo } from "react";
import { earningsChartCaptionStyle, earningsChartCardStyle, earningsChartTitleStyle } from "../scrum.styles";
import { formatMovementDay, getMonthKey, MOVEMENT_COLORS, MOVEMENT_LABELS, signedMoney, type ClientMovement } from "../scrumMovements";

type Props = {
  movements: ClientMovement[];
};

const GRIDLINE = "#e7ebf3";
const MUTED_TEXT = "#8c98ad";

// Movimientos de clientes (24/10/2026, pedido explicito: "los
// movimientos, ponerlo por ultimo, dejar las graficas primero"): altas,
// aumentos y bajas de plan de los ultimos 6 meses, agrupados por mes y
// del mas nuevo al mas viejo, con la descripcion de cada cambio de monto.
export function ScrumMovementsList({ movements }: Props) {
  const groups = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string; items: ClientMovement[] }[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
      const key = getMonthKey(date);
      list.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), items: movements.filter((movement) => getMonthKey(new Date(movement.at)) === key) });
    }
    return list.filter((group) => group.items.length > 0);
  }, [movements]);

  return (
    <section style={earningsChartCardStyle}>
      <h2 style={earningsChartTitleStyle}>Movimientos</h2>
      <p style={earningsChartCaptionStyle}>Clientes nuevos y cambios de plan de los últimos 6 meses</p>

      {groups.length === 0 ? (
        <p style={{ ...earningsChartCaptionStyle, marginTop: 8 }}>Sin movimientos en los últimos 6 meses.</p>
      ) : (
        groups.map((group) => (
          <div key={group.key} style={{ marginTop: 12 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#162033" }}>
              {group.label} ({group.items.length})
            </h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {group.items.map((movement, index) => (
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
          </div>
        ))
      )}
    </section>
  );
}
