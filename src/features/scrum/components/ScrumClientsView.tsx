import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { BILLING_FREQUENCY_LABELS, CLIENT_ALERT_STYLES, type BillingFrequency, type ClientBilling } from "../scrum.types";
import {
  clientDetailsStyle,
  clientFormGridStyle,
  clientGridStyle,
  clientRowButtonStyle,
  columnCaptionStyle,
  debtAmountInputStyle,
  debtHistoryListStyle,
  debtHistoryRowStyle,
  debtHistoryTotalRowStyle,
  debtPanelStyle,
  debtPaymentFormStyle,
  emptyStateStyle,
  fieldGroupStyle,
  formActionsStyle,
  historyPanelStyle,
  inputStyle,
  labelStyle,
  metaChipStyle,
  primaryButtonStyle,
  remainingListItemStyle,
  remainingListStyle,
  remainingListTotalStyle,
  remainingWrapperStyle,
  secondaryButtonStyle,
  clientAmountStyle,
  clientCardAccentStyle,
  clientChipStyle,
  clientChipsRowStyle,
  clientDeleteLinkStyle,
  clientHeaderAmountStyle,
  clientHeaderTextStyle,
  clientNameStyle,
  clientNewButtonStyle,
  clientNewFormPanelStyle,
  clientSummaryGridStyle,
  fichaBarFillStyle,
  fichaBarTrackStyle,
  fichaBigStyle,
  fichaGridStyle,
  fichaHeaderStyle,
  fichaLabelStyle,
  fichaLinkButtonStyle,
  fichaLinksStyle,
  fichaRowStyle,
  fichaSubStyle,
  fichaTableStyle,
  summaryTileAccentStyle,
  summaryTileAltStyle,
  summaryTileColors,
  summaryTileCommissionStyle,
  summaryTileDangerStyle,
  summaryTileNetStyle,
  summaryTileLabelStyle,
  summaryTileValueStyle,
  summaryTileWarningStyle
} from "../scrum.styles";
import { formatCurrency, formatDate, formatDateTime, getClientAlertState, getClientRelativeLabel, getMonthlyCommission, getMonthlyNet, getMontevideoDateKey } from "../scrum.utils";
import { ExpenseModal, ExpensesList, useScrumExpenses, type ScrumExpense } from "./ScrumExpenses";
import { ClientCommissionPanel } from "./ClientCommissionPanel";
import { ClientEquipmentPanel } from "./ClientEquipmentPanel";
import { ScrumConfirmModal } from "./ScrumConfirmModal";

type ScrumClientsViewProps = {
  clientAmount: string;
  clientDebtAmount: string;
  clientFrequency: BillingFrequency;
  clientName: string;
  clientNextPaymentAt: string;
  clients: ClientBilling[];
  expandedClientId: number | null;
  now: number;
  onClientChanged: (client: ClientBilling) => void;
  onCreateClient: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteClient: (clientId: number) => void;
  onOpenEditClient: (client: ClientBilling) => void;
  onRegisterClientDebtPayment: (clientId: number, amount: string) => void;
  onRegisterClientPayment: (clientId: number) => void;
  setClientAmount: Dispatch<SetStateAction<string>>;
  setClientDebtAmount: Dispatch<SetStateAction<string>>;
  setClientFrequency: Dispatch<SetStateAction<BillingFrequency>>;
  setClientName: Dispatch<SetStateAction<string>>;
  setClientNextPaymentAt: Dispatch<SetStateAction<string>>;
  setExpandedClientId: Dispatch<SetStateAction<number | null>>;
};

function ClientDebtPanel({
  client,
  onRegisterClientDebtPayment
}: {
  client: ClientBilling;
  onRegisterClientDebtPayment: (clientId: number, amount: string) => void;
}) {
  const [debtPaymentInput, setDebtPaymentInput] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  if (client.debtAmount === null) {
    return null;
  }

  const isSettled = (client.debtRemaining ?? 0) <= 0;
  const paidPercent = client.debtAmount > 0 ? (client.debtPaidAmount / client.debtAmount) * 100 : 0;

  return (
    <div style={debtPanelStyle}>
      <div style={fichaHeaderStyle}>
        <span style={fichaLabelStyle}>Deuda</span>
        <span style={{ ...fichaLabelStyle, color: "#fcd34d" }}>{Math.round(paidPercent)}% paga</span>
      </div>
      <div style={fichaBigStyle}>{isSettled ? "Saldada" : formatCurrency(client.debtRemaining ?? 0)}</div>
      <span style={fichaSubStyle}>{isSettled ? `Se pagó el total de ${formatCurrency(client.debtAmount)}` : `falta de ${formatCurrency(client.debtAmount)}`}</span>
      <div style={fichaBarTrackStyle}>
        <div style={fichaBarFillStyle(paidPercent, "#fbbf24")} />
      </div>

      {!isSettled ? (
        <div style={debtPaymentFormStyle}>
          <input
            type="number"
            min="1"
            step="1"
            value={debtPaymentInput}
            onChange={(event) => setDebtPaymentInput(event.target.value)}
            placeholder="Monto pagado"
            style={debtAmountInputStyle}
          />
          <button
            type="button"
            onClick={() => {
              onRegisterClientDebtPayment(client.id, debtPaymentInput);
              setDebtPaymentInput("");
            }}
            style={secondaryButtonStyle}
          >
            Registrar pago
          </button>
        </div>
      ) : null}

      {client.debtPayments.length > 0 ? (
        <div style={fichaLinksStyle}>
          <button type="button" onClick={() => setShowDetails((current) => !current)} style={fichaLinkButtonStyle}>
            {showDetails ? "Ocultar pagos" : "Ver pagos"}
          </button>
        </div>
      ) : null}

      {showDetails ? (
        <div style={debtHistoryListStyle}>
          {client.debtPayments.map((payment) => (
            <div key={payment.id} style={debtHistoryRowStyle}>
              <span>{formatDateTime(payment.paidAt)}</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
          ))}
          <div style={debtHistoryTotalRowStyle}>
            <span>Total pagado</span>
            <span>{formatCurrency(client.debtPaidAmount)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ScrumClientsView({
  clientAmount,
  clientDebtAmount,
  clientFrequency,
  clientName,
  clientNextPaymentAt,
  clients,
  expandedClientId,
  now,
  onClientChanged,
  onCreateClient,
  onDeleteClient,
  onOpenEditClient,
  onRegisterClientDebtPayment,
  onRegisterClientPayment,
  setClientAmount,
  setClientDebtAmount,
  setClientFrequency,
  setClientName,
  setClientNextPaymentAt,
  setExpandedClientId
}: ScrumClientsViewProps) {
  // Cliente que se pidio eliminar y espera la confirmacion.
  const [clientToDelete, setClientToDelete] = useState<ClientBilling | null>(null);
  // Formulario colapsable (rediseño 22/10/2026), mismo criterio que el tablero.
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Ganancia mensual (pedido explicito, 22/10/2026): suma de todos los
  // clientes normalizados a "por mes", para que un cliente que paga cada
  // 6 meses cuente como un doceavo... un sexto de su monto cada mes.
  const monthlyEarnings = clients.reduce((sum, client) => sum + getMonthlyNet(client), 0);
  // Comision (14/11/2026): lo que se le da a quien vendio, por mes. La
  // ganancia mensual de arriba ya cuenta solo lo que queda para nosotros.
  // Gastos (14/11/2026): se descuentan de la ganancia mensual (bruta) para dar
  // la ganancia neta, lo que queda de verdad.
  const { expenses, total: expensesTotal, save: saveExpense, remove: removeExpense } = useScrumExpenses();
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [expenseModal, setExpenseModal] = useState<{ expense: ScrumExpense | null } | null>(null);
  const netEarnings = monthlyEarnings - expensesTotal;
  const monthlyCommission = clients.reduce((sum, client) => sum + getMonthlyCommission(client), 0);

  // Resta cobrar este mes (pedido explicito, 05/11/2026): vencidos que
  // todavia no pagaron + los que vencen antes de fin de mes ("Faltan 5
  // dias"...). Monto completo del ciclo. Al tocar la tarjeta se abre la
  // lista de quien tiene que pagar y cuanto.
  const todayKey = getMontevideoDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  const pendingClients = clients
    .filter((client) => client.nextPaymentAt < todayKey || client.nextPaymentAt.slice(0, 7) === monthKey)
    .sort((a, b) => a.nextPaymentAt.localeCompare(b.nextPaymentAt));
  // Equipos (14/11/2026): lo que falta cobrar de materiales. Va aparte y NO
  // entra en la ganancia mensual.
  const equipmentPending = clients.reduce((sum, client) => sum + (client.equipment?.remaining ?? 0), 0);
  const remainingThisMonth = pendingClients.reduce((sum, client) => sum + client.amount, 0);
  const [isRemainingOpen, setIsRemainingOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    onCreateClient(event);
    setIsFormOpen(false);
  }

  return (
    <section style={historyPanelStyle}>
      <header style={{ display: "grid", gap: 12 }}>
        <strong style={{ fontSize: 18 }}>Clientes</strong>
        <div style={clientSummaryGridStyle}>
          <div style={summaryTileAccentStyle}>
            <span style={{ ...summaryTileLabelStyle, color: summaryTileColors.accent[0] }}>Ganancia bruta</span>
            <strong style={{ ...summaryTileValueStyle, color: summaryTileColors.accent[1] }}>{formatCurrency(monthlyEarnings)}</strong>
          </div>
          <div style={{ ...summaryTileDangerStyle, position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsExpensesOpen((current) => !current)}
              aria-expanded={isExpensesOpen}
              style={{ all: "unset", cursor: "pointer", display: "grid", gap: 2 }}
            >
              <span style={{ ...summaryTileLabelStyle, color: "#ff8aa3" }}>Gastos {isExpensesOpen ? "▴" : "▾"}</span>
              <strong style={{ ...summaryTileValueStyle, color: "#fb4570" }}>{formatCurrency(expensesTotal)}</strong>
            </button>
            <button
              type="button"
              onClick={() => setExpenseModal({ expense: null })}
              aria-label="Agregar gasto"
              style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 999, border: "1px solid rgba(251, 69, 112, 0.5)", background: "rgba(251, 69, 112, 0.18)", color: "#ff8aa3", fontSize: 18, lineHeight: 1, cursor: "pointer" }}
            >
              +
            </button>
          </div>
          <div style={{ ...summaryTileNetStyle, gridColumn: "1 / -1" }}>
            <span style={{ ...summaryTileLabelStyle, color: "#7dd3fc" }}>Ganancia neta (después de gastos)</span>
            <strong style={{ ...summaryTileValueStyle, fontSize: 28, color: netEarnings < 0 ? "#fb4570" : "#eef1fb" }}>{formatCurrency(netEarnings)}</strong>
          </div>
          {isExpensesOpen ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <ExpensesList expenses={expenses} total={expensesTotal} onAdd={() => setExpenseModal({ expense: null })} onEdit={(expense) => setExpenseModal({ expense })} />
            </div>
          ) : null}
          <div style={summaryTileAltStyle}>
            <span style={{ ...summaryTileLabelStyle, color: summaryTileColors.alt[0] }}>Equipos por cobrar</span>
            <strong style={{ ...summaryTileValueStyle, color: summaryTileColors.alt[1] }}>{formatCurrency(equipmentPending)}</strong>
          </div>
          <div style={summaryTileCommissionStyle}>
            <span style={{ ...summaryTileLabelStyle, color: "#6ee7b7" }}>Comisión</span>
            <strong style={{ ...summaryTileValueStyle, color: "#34d399" }}>{formatCurrency(monthlyCommission)}</strong>
          </div>
          <div style={{ ...remainingWrapperStyle, gridColumn: "1 / -1" }}>
            <button
              type="button"
              onClick={() => setIsRemainingOpen((current) => !current)}
              style={{ ...summaryTileWarningStyle, width: "100%", boxSizing: "border-box", cursor: "pointer" }}
              aria-expanded={isRemainingOpen}
            >
              <span style={{ ...summaryTileLabelStyle, color: summaryTileColors.warning[0] }}>Resta este mes {isRemainingOpen ? "▴" : "▾"}</span>
              <strong style={{ ...summaryTileValueStyle, color: summaryTileColors.warning[1] }}>{formatCurrency(remainingThisMonth)}</strong>
            </button>
            {isRemainingOpen ? (
              <div style={{ ...remainingListStyle, left: 0, right: "auto", width: "min(320px, 86vw)" }}>
                {pendingClients.length === 0 ? (
                  <span style={columnCaptionStyle}>No queda nadie por cobrar este mes.</span>
                ) : (
                  pendingClients.map((client) => (
                    <div key={client.id} style={remainingListItemStyle}>
                      <span>
                        <strong>{client.name}</strong>{" "}
                        <span style={columnCaptionStyle}>{getClientRelativeLabel(client.nextPaymentAt, now)}</span>
                      </span>
                      <strong>{formatCurrency(client.amount)}</strong>
                    </div>
                  ))
                )}
                <div style={remainingListTotalStyle}>
                  <span>Total</span>
                  <strong>{formatCurrency(remainingThisMonth)}</strong>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {expenseModal ? (
          <ExpenseModal expense={expenseModal.expense} onClose={() => setExpenseModal(null)} onSave={saveExpense} onDelete={removeExpense} />
        ) : null}
      </header>

      <section style={{ display: "grid", gap: 10 }}>
        <button type="button" onClick={() => setIsFormOpen((current) => !current)} style={isFormOpen ? { ...clientNewButtonStyle, borderStyle: "solid", color: "#9aa3c0", borderColor: "#323a5c" } : clientNewButtonStyle}>
          {isFormOpen ? "Cancelar" : "+ Nuevo cliente"}
        </button>

        {isFormOpen ? (
          <form onSubmit={handleSubmit} style={{ ...clientFormGridStyle, ...clientNewFormPanelStyle }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="client-name">
                Nombre
              </label>
              <input
                id="client-name"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Nombre del cliente"
                style={inputStyle}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="client-amount">
                Monto
              </label>
              <input
                id="client-amount"
                type="number"
                min="1"
                step="1"
                value={clientAmount}
                onChange={(event) => setClientAmount(event.target.value)}
                placeholder="4500"
                style={inputStyle}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="client-frequency">
                Frecuencia
              </label>
              <select
                id="client-frequency"
                value={clientFrequency}
                onChange={(event) => setClientFrequency(event.target.value as BillingFrequency)}
                style={inputStyle}
              >
                <option value="monthly">Mensual</option>
                <option value="semiannual">Cada 6 meses</option>
              </select>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="client-next-payment">
                Proximo pago
              </label>
              <input
                id="client-next-payment"
                type="date"
                value={clientNextPaymentAt}
                onChange={(event) => setClientNextPaymentAt(event.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="client-debt-amount">
                Monto adeudado (opcional)
              </label>
              <input
                id="client-debt-amount"
                type="number"
                min="0"
                step="1"
                value={clientDebtAmount}
                onChange={(event) => setClientDebtAmount(event.target.value)}
                placeholder="Ej: 4000"
                style={inputStyle}
              />
            </div>

            <div style={formActionsStyle}>
              <button type="submit" style={primaryButtonStyle}>
                Crear cliente
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <div style={clientGridStyle}>
        {clients.length === 0 ? <p style={emptyStateStyle}>Todavia no hay clientes cargados.</p> : null}

        {clients.map((client) => {
          const alertState = getClientAlertState(client.nextPaymentAt, now);
          const alertStyle = CLIENT_ALERT_STYLES[alertState];
          const expanded = expandedClientId === client.id;

          const equipment = client.equipment;
          const equipmentPendingHere = equipment && equipment.remaining > 0 ? equipment.remaining : 0;
          const debtPendingHere = client.debtRemaining && client.debtRemaining > 0 ? client.debtRemaining : 0;

          return (
            <article key={client.id} style={clientCardAccentStyle(alertStyle.color)}>
              <button type="button" onClick={() => setExpandedClientId(expanded ? null : client.id)} style={clientRowButtonStyle} aria-expanded={expanded}>
                <div style={clientHeaderTextStyle}>
                  <strong style={clientNameStyle}>{client.name}</strong>
                  {/* Dias hasta el proximo pago, visible sin desplegar (pedido explicito, 22/10/2026). */}
                  <span style={{ fontSize: 12, fontWeight: 700, color: alertStyle.color }}>{getClientRelativeLabel(client.nextPaymentAt, now)}</span>
                </div>
                <div style={clientHeaderAmountStyle}>
                  <span style={clientAmountStyle}>{formatCurrency(client.amount)}</span>
                  <span style={metaChipStyle}>
                    {client.frequency === "monthly" ? "por mes" : "cada 6 meses"} {expanded ? "▴" : "▾"}
                  </span>
                </div>
              </button>

              {equipmentPendingHere > 0 || debtPendingHere > 0 ? (
                <div style={clientChipsRowStyle}>
                  {equipmentPendingHere > 0 ? (
                    <span style={clientChipStyle("#c4b5fd", "rgba(167, 139, 250, 0.14)")}>Equipo: faltan {formatCurrency(equipmentPendingHere)}</span>
                  ) : null}
                  {debtPendingHere > 0 ? (
                    <span style={clientChipStyle("#fcd34d", "rgba(251, 191, 36, 0.14)")}>Deuda: {formatCurrency(debtPendingHere)}</span>
                  ) : null}
                </div>
              ) : null}

              {expanded ? (
                <div style={clientDetailsStyle}>
                  <div style={fichaGridStyle}>
                    <div style={debtPanelStyle}>
                      <div style={fichaHeaderStyle}>
                        <span style={fichaLabelStyle}>Cobro</span>
                        <span style={{ ...fichaLabelStyle, color: alertStyle.color }}>{getClientRelativeLabel(client.nextPaymentAt, now)}</span>
                      </div>
                      <div style={fichaBigStyle}>{formatCurrency(client.amount)}</div>
                      <span style={fichaSubStyle}>{BILLING_FREQUENCY_LABELS[client.frequency]}</span>
                      <div style={fichaTableStyle}>
                        <div style={fichaRowStyle}>
                          <span>Próximo pago</span>
                          <span>{formatDate(client.nextPaymentAt)}</span>
                        </div>
                      </div>
                      <div style={fichaLinksStyle}>
                        <button type="button" onClick={() => onRegisterClientPayment(client.id)} style={secondaryButtonStyle}>
                          Registrar pago
                        </button>
                        <button type="button" onClick={() => onOpenEditClient(client)} style={fichaLinkButtonStyle}>
                          Editar cliente
                        </button>
                      </div>
                    </div>

                    <ClientCommissionPanel client={client} onClientChanged={onClientChanged} />

                    <ClientEquipmentPanel client={client} onClientChanged={onClientChanged} />

                    <ClientDebtPanel client={client} onRegisterClientDebtPayment={onRegisterClientDebtPayment} />

                  </div>

                  <button type="button" onClick={() => setClientToDelete(client)} style={clientDeleteLinkStyle}>
                    Eliminar cliente
                  </button>
                  {clientToDelete?.id === client.id ? (
                    <ScrumConfirmModal
                      title="¿Seguro que querés eliminar este cliente?"
                      message={`"${client.name}" se borra junto con todo su historial de pagos y de montos. No se puede deshacer.`}
                      confirmLabel="Sí, eliminar"
                      onCancel={() => setClientToDelete(null)}
                      onConfirm={() => {
                        setClientToDelete(null);
                        onDeleteClient(client.id);
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
