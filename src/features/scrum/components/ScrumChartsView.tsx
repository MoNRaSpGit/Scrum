import { useMemo } from "react";
import type { ClientBilling } from "../scrum.types";
import { getMonthlyAmount } from "../scrum.utils";
import { buildClientMovements, getCumulativeRaisesByMonth } from "../scrumMovements";
import { MonthlyEarningsChart } from "./MonthlyEarningsChart";
import { NewClientsByMonthChart } from "./NewClientsByMonthChart";
import { ScrumMovementsList } from "./ScrumMovementsList";

type Props = {
  clients: ClientBilling[];
};

// Orden pedido (24/10/2026): primero las graficas, los movimientos al final.
export function ScrumChartsView({ clients }: Props) {
  const monthlyEarnings = clients.reduce((sum, client) => sum + getMonthlyAmount(client.amount, client.frequency), 0);
  const movements = useMemo(() => buildClientMovements(clients), [clients]);
  const raisesByMonth = useMemo(() => getCumulativeRaisesByMonth(movements, 6), [movements]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <MonthlyEarningsChart currentMonthlyEarnings={monthlyEarnings} raisesByMonth={raisesByMonth} />
      <NewClientsByMonthChart clients={clients} />
      <ScrumMovementsList movements={movements} />
    </div>
  );
}
