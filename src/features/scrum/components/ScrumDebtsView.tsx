import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { CLIENT_ALERT_STYLES, type ScrumDebt } from "../scrum.types";
import {
  clientActionsStyle,
  clientCardStyle,
  clientDetailsStyle,
  clientFooterStyle,
  clientFormGridStyle,
  clientGridStyle,
  clientMetaGridStyle,
  clientPrimaryValueStyle,
  clientRowButtonStyle,
  clientStatusBadgeStyle,
  columnCaptionStyle,
  debtAmountInputStyle,
  debtDetailInputStyle,
  debtHistoryListStyle,
  debtHistoryRowStyle,
  debtHistoryTotalRowStyle,
  debtPanelStyle,
  debtPaymentFormStyle,
  debtSummaryRowStyle,
  deleteButtonStyle,
  emptyStateStyle,
  fieldGroupStyle,
  formActionsStyle,
  historyHeaderStyle,
  historyPanelStyle,
  inputStyle,
  labelStyle,
  metaChipStyle,
  panelStyle,
  primaryButtonStyle,
  secondaryButtonStyle
} from "../scrum.styles";
import { formatCurrency, formatDate, formatDateTime, getClientAlertState, getClientRelativeLabel } from "../scrum.utils";

type ScrumDebtsViewProps = {
  debtName: string;
  debtAmount: string;
  debtDueDate: string;
  debts: ScrumDebt[];
  now: number;
  onCreateDebt: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteDebt: (debtId: number) => void;
  onAddDebtCharge: (debtId: number, amount: string, detail: string) => void;
  onAddDebtPayment: (debtId: number, amount: string) => void;
  onUpdateDebtDueDate: (debtId: number, dueDate: string) => void;
  setDebtName: Dispatch<SetStateAction<string>>;
  setDebtAmount: Dispatch<SetStateAction<string>>;
  setDebtDueDate: Dispatch<SetStateAction<string>>;
};

function DebtCard({
  debt,
  now,
  onDeleteDebt,
  onAddDebtCharge,
  onAddDebtPayment,
  onUpdateDebtDueDate
}: {
  debt: ScrumDebt;
  now: number;
  onDeleteDebt: (debtId: number) => void;
  onAddDebtCharge: (debtId: number, amount: string, detail: string) => void;
  onAddDebtPayment: (debtId: number, amount: string) => void;
  onUpdateDebtDueDate: (debtId: number, dueDate: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateDraft, setDueDateDraft] = useState(debt.dueDate);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDetail, setChargeDetail] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const alertState = getClientAlertState(debt.dueDate, now);
  const alertStyle = CLIENT_ALERT_STYLES[alertState];
  const isSettled = debt.remaining <= 0;

  const movements = [
    ...debt.charges.map((charge) => ({ kind: "charge" as const, id: `c${charge.id}`, amount: charge.amount, detail: charge.detail, at: charge.chargedAt })),
    ...debt.payments.map((payment) => ({ kind: "payment" as const, id: `p${payment.id}`, amount: payment.amount, detail: null, at: payment.paidAt }))
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <article style={clientCardStyle}>
      <button type="button" onClick={() => setExpanded((current) => !current)} style={clientRowButtonStyle}>
        <strong style={{ fontSize: 16 }}>{debt.name}</strong>
        <span style={clientMetaGridStyle}>
          <span style={clientPrimaryValueStyle}>{isSettled ? "Saldada" : formatCurrency(debt.remaining)}</span>
          <span
            style={{
              ...clientStatusBadgeStyle,
              background: alertStyle.background,
              color: alertStyle.color,
              border: `1px solid ${alertStyle.border}`
            }}
          >
            {isSettled ? "Saldada" : alertStyle.label}
          </span>
        </span>
      </button>

      {expanded ? (
      <div style={clientDetailsStyle}>
        <div style={clientMetaGridStyle}>
          <span style={clientPrimaryValueStyle}>{isSettled ? "Saldada" : formatCurrency(debt.remaining)}</span>
          <span style={metaChipStyle}>de {formatCurrency(debt.totalCharged)}</span>
        </div>

        <div style={clientFooterStyle}>
          {isEditingDueDate ? (
            <>
              <input
                type="date"
                value={dueDateDraft}
                onChange={(event) => setDueDateDraft(event.target.value)}
                style={{ ...inputStyle, minHeight: 38, width: 170 }}
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateDebtDueDate(debt.id, dueDateDraft);
                  setIsEditingDueDate(false);
                }}
                style={secondaryButtonStyle}
              >
                Guardar fecha
              </button>
            </>
          ) : (
            <>
              <span style={metaChipStyle}>Vence: {formatDate(debt.dueDate)}</span>
              <span style={{ ...metaChipStyle, color: alertStyle.color, fontWeight: 700 }}>
                {getClientRelativeLabel(debt.dueDate, now)}
              </span>
              <button type="button" onClick={() => setIsEditingDueDate(true)} style={secondaryButtonStyle}>
                Editar fecha
              </button>
            </>
          )}
        </div>

        <div style={debtPanelStyle}>
          <div style={debtSummaryRowStyle}>
            <span style={metaChipStyle}>Cargado: {formatCurrency(debt.totalCharged)}</span>
            <span style={metaChipStyle}>Pagado: {formatCurrency(debt.totalPaid)}</span>
            {movements.length > 0 ? (
              <button type="button" onClick={() => setShowDetails((current) => !current)} style={secondaryButtonStyle}>
                {showDetails ? "Ocultar historial" : "Ver historial"}
              </button>
            ) : null}
          </div>

          <div style={debtPaymentFormStyle}>
            <input
              type="number"
              min="0.01"
              step="1"
              value={chargeAmount}
              onChange={(event) => setChargeAmount(event.target.value)}
              placeholder="Monto"
              style={debtAmountInputStyle}
            />
            <input
              value={chargeDetail}
              onChange={(event) => setChargeDetail(event.target.value)}
              placeholder="Detalle (ej: papitas fritas)"
              style={debtDetailInputStyle}
            />
            <button
              type="button"
              onClick={() => {
                onAddDebtCharge(debt.id, chargeAmount, chargeDetail);
                setChargeAmount("");
                setChargeDetail("");
              }}
              style={secondaryButtonStyle}
            >
              + Agregar cargo
            </button>
          </div>

          {!isSettled ? (
            <div style={debtPaymentFormStyle}>
              <input
                type="number"
                min="0.01"
                step="1"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder="Monto pagado"
                style={debtAmountInputStyle}
              />
              <button
                type="button"
                onClick={() => {
                  onAddDebtPayment(debt.id, paymentAmount);
                  setPaymentAmount("");
                }}
                style={secondaryButtonStyle}
              >
                Registrar pago
              </button>
            </div>
          ) : null}

          {showDetails ? (
            <div style={debtHistoryListStyle}>
              {movements.map((movement) => (
                <div key={movement.id} style={debtHistoryRowStyle}>
                  <span>
                    {formatDateTime(movement.at)} {movement.kind === "charge" ? `— ${movement.detail}` : "— pago"}
                  </span>
                  <span style={{ color: movement.kind === "charge" ? "#9e2b2b" : "#1f6f31", fontWeight: 700 }}>
                    {movement.kind === "charge" ? "+" : "-"}
                    {formatCurrency(movement.amount)}
                  </span>
                </div>
              ))}
              <div style={debtHistoryTotalRowStyle}>
                <span>Monto inicial</span>
                <span>{formatCurrency(debt.initialAmount)}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div style={clientActionsStyle}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Eliminar la deuda "${debt.name}"? Se borra tambien su historial de cargos y pagos.`)) {
                onDeleteDebt(debt.id);
              }
            }}
            style={deleteButtonStyle}
          >
            Eliminar deuda
          </button>
        </div>
      </div>
      ) : null}
    </article>
  );
}

export function ScrumDebtsView({
  debtName,
  debtAmount,
  debtDueDate,
  debts,
  now,
  onCreateDebt,
  onDeleteDebt,
  onAddDebtCharge,
  onAddDebtPayment,
  onUpdateDebtDueDate,
  setDebtName,
  setDebtAmount,
  setDebtDueDate
}: ScrumDebtsViewProps) {
  return (
    <section style={historyPanelStyle}>
      <header style={historyHeaderStyle}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 18 }}>Deudas</strong>
          <span style={columnCaptionStyle}>Lo que debes vos, con cargos y pagos totales o parciales.</span>
        </div>
      </header>

      <section style={panelStyle}>
        <form onSubmit={onCreateDebt} style={clientFormGridStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="debt-name">
              Nombre
            </label>
            <input
              id="debt-name"
              value={debtName}
              onChange={(event) => setDebtName(event.target.value)}
              placeholder="Ej: Comida Rapida"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="debt-amount">
              Monto inicial
            </label>
            <input
              id="debt-amount"
              type="number"
              min="1"
              step="1"
              value={debtAmount}
              onChange={(event) => setDebtAmount(event.target.value)}
              placeholder="500"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="debt-due-date">
              Vencimiento (opcional, por defecto 1 mes)
            </label>
            <input
              id="debt-due-date"
              type="date"
              value={debtDueDate}
              onChange={(event) => setDebtDueDate(event.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={formActionsStyle}>
            <button type="submit" style={primaryButtonStyle}>
              Crear deuda
            </button>
          </div>
        </form>
      </section>

      <div style={clientGridStyle}>
        {debts.length === 0 ? <p style={emptyStateStyle}>Todavia no hay deudas cargadas.</p> : null}

        {debts.map((debt) => (
          <DebtCard
            key={debt.id}
            debt={debt}
            now={now}
            onDeleteDebt={onDeleteDebt}
            onAddDebtCharge={onAddDebtCharge}
            onAddDebtPayment={onAddDebtPayment}
            onUpdateDebtDueDate={onUpdateDebtDueDate}
          />
        ))}
      </div>
    </section>
  );
}
