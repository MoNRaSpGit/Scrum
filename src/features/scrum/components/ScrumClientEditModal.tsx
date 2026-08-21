import type { Dispatch, SetStateAction } from "react";
import { BILLING_FREQUENCY_LABELS, type BillingFrequency, type ClientBilling } from "../scrum.types";
import {
  compactInputStyle,
  fieldGroupStyle,
  labelStyle,
  metaChipStyle,
  modalCardStyle,
  modalCloseButtonStyle,
  modalHeaderStyle,
  modalOverlayStyle,
  primaryButtonStyle
} from "../scrum.styles";
import { formatCurrency, formatDate } from "../scrum.utils";

type ScrumClientEditModalProps = {
  editingClient: ClientBilling | null;
  editingClientName: string;
  editingClientAmount: string;
  editingClientFrequency: BillingFrequency;
  editingClientNextPaymentAt: string;
  editingClientAmountChangeDescription: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  setEditingClientName: Dispatch<SetStateAction<string>>;
  setEditingClientAmount: Dispatch<SetStateAction<string>>;
  setEditingClientFrequency: Dispatch<SetStateAction<BillingFrequency>>;
  setEditingClientNextPaymentAt: Dispatch<SetStateAction<string>>;
  setEditingClientAmountChangeDescription: Dispatch<SetStateAction<string>>;
};

// Horizontes de proyeccion segun la frecuencia: para mensual tiene sentido
// mostrar 1/3/6/12 meses, para "cada 6 meses" solo tiene sentido mostrar
// multiplos del ciclo (6/12/18/24), porque antes de cumplirse un ciclo
// todavia no se cobro nada.
function buildAmountProjection(amount: number, frequency: BillingFrequency) {
  const cycleMonths = frequency === "monthly" ? 1 : 6;
  const horizons = frequency === "monthly" ? [1, 3, 6, 12] : [6, 12, 18, 24];

  return horizons.map((months) => {
    const payments = Math.round(months / cycleMonths);
    return { months, payments, total: amount * payments };
  });
}

export function ScrumClientEditModal({
  editingClient,
  editingClientName,
  editingClientAmount,
  editingClientFrequency,
  editingClientNextPaymentAt,
  editingClientAmountChangeDescription,
  isSaving,
  onClose,
  onSave,
  setEditingClientName,
  setEditingClientAmount,
  setEditingClientFrequency,
  setEditingClientNextPaymentAt,
  setEditingClientAmountChangeDescription
}: ScrumClientEditModalProps) {
  if (!editingClient) {
    return null;
  }

  const parsedAmount = Number(editingClientAmount);
  const projection = Number.isFinite(parsedAmount) && parsedAmount > 0 ? buildAmountProjection(parsedAmount, editingClientFrequency) : [];
  const amountChanged = Number.isFinite(parsedAmount) && Math.round(parsedAmount) !== Math.round(editingClient.amount);
  const sortedHistory = [...editingClient.amountHistory].sort((a, b) => b.changedAt.localeCompare(a.changedAt));

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <strong style={{ fontSize: 18 }}>Editar cliente</strong>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle}>
            Cerrar
          </button>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="edit-client-name">
            Nombre
          </label>
          <input
            id="edit-client-name"
            value={editingClientName}
            onChange={(event) => setEditingClientName(event.target.value)}
            style={compactInputStyle}
          />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="edit-client-amount">
            Monto
          </label>
          <input
            id="edit-client-amount"
            type="number"
            min="1"
            step="1"
            value={editingClientAmount}
            onChange={(event) => setEditingClientAmount(event.target.value)}
            style={compactInputStyle}
          />
        </div>

        {amountChanged ? (
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="edit-client-amount-description">
              Descripcion del cambio de monto
            </label>
            <input
              id="edit-client-amount-description"
              value={editingClientAmountChangeDescription}
              onChange={(event) => setEditingClientAmountChangeDescription(event.target.value)}
              placeholder="Ej: solucion de caja registradora"
              style={compactInputStyle}
            />
          </div>
        ) : null}

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="edit-client-frequency">
            Frecuencia
          </label>
          <select
            id="edit-client-frequency"
            value={editingClientFrequency}
            onChange={(event) => setEditingClientFrequency(event.target.value as BillingFrequency)}
            style={compactInputStyle}
          >
            {Object.entries(BILLING_FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="edit-client-next-payment">
            Proximo pago
          </label>
          <input
            id="edit-client-next-payment"
            type="date"
            value={editingClientNextPaymentAt}
            onChange={(event) => setEditingClientNextPaymentAt(event.target.value)}
            style={compactInputStyle}
          />
        </div>

        {projection.length ? (
          <div style={fieldGroupStyle}>
            <span style={labelStyle}>Proyeccion con este monto</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {projection.map((entry) => (
                <span key={entry.months} style={metaChipStyle}>
                  {entry.months} meses ({entry.payments} {entry.payments === 1 ? "pago" : "pagos"}): <strong>{formatCurrency(entry.total)}</strong>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {sortedHistory.length ? (
          <div style={fieldGroupStyle}>
            <span style={labelStyle}>Historial de cambios de monto</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {sortedHistory.map((change) => (
                <div key={change.id} style={{ fontSize: 13, color: "#4b5568" }}>
                  <strong>{formatDate(change.changedAt.slice(0, 10))}</strong>{" "}
                  <span style={{ color: change.delta >= 0 ? "#1f6f31" : "#9e2b2b", fontWeight: 700 }}>
                    {change.delta >= 0 ? "+" : ""}
                    {formatCurrency(change.delta)}
                  </span>{" "}
                  ({formatCurrency(change.previousAmount)} → {formatCurrency(change.newAmount)}) — {change.description}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onSave} disabled={isSaving} style={{ ...primaryButtonStyle, minWidth: 120 }}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
