import type { ClientBilling } from "../scrum.types";
import { getMonthlyAmount } from "../scrum.utils";
import { GrowthByMonthChart } from "./GrowthByMonthChart";
import { MonthlyEarningsChart } from "./MonthlyEarningsChart";
import { NewClientsByMonthChart } from "./NewClientsByMonthChart";

type Props = {
  clients: ClientBilling[];
};

export function ScrumChartsView({ clients }: Props) {
  const monthlyEarnings = clients.reduce((sum, client) => sum + getMonthlyAmount(client.amount, client.frequency), 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <MonthlyEarningsChart currentMonthlyEarnings={monthlyEarnings} />
      <GrowthByMonthChart clients={clients} />
      <NewClientsByMonthChart clients={clients} />
    </div>
  );
}
