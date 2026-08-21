import type { Dispatch, SetStateAction } from "react";
import { BILLING_FREQUENCY_LABELS, type BillingFrequency, type ClientBilling } from "../scrum.types";
import {
  compactInputStyle,
  fieldGroupStyle,
  labelStyle,
  modalCardStyle,
  modalCloseButtonStyle,
  modalHeaderStyle,
  modalOverlayStyle,
  primaryButtonStyle,
  secondaryButtonStyle
} from "../scrum.styles";
import { formatCurrency, formatDate } from "../scrum.utils";

type ScrumClientEditModalProps = {
  editingClient: ClientBilling | null;
  editingClientName: string;
  editingClientFrequency: BillingFrequency;
  editingClientNextPaymentAt: string;
  editingClientAmountDelta: string;
  editingClientAmountDeltaDescription: string;
  isSaving: boolean;
  isAddingAmountChange: boolean;
  onClose: () => void;
  onSave: () => void;
  onAddAmountChange: () => void;
  setEditingClientName: Dispatch<SetStateAction<string>>;
  setEditingClientFrequency: Dispatch<SetStateAction<BillingFrequency>>;
  setEditingClientNextPaymentAt: Dispatch<SetStateAction<string>>;
  setEditingClientAmountDelta: Dispatch<SetStateAction<string>>;
  setEditingClientAmountDeltaDescription: Dispatch<SetStateAction<string>>;
};

// El monto se guarda por ciclo de facturacion (ej: 6000 cada 6 meses), pero
// siempre se muestra normalizado a "por mes" para poder comparar clientes
// mensuales y semestrales de un vistazo.
function getCycleMonths(frequency: BillingFrequency) {
  return frequency === "monthly" ? 1 : 6;
}

export function ScrumClientEditModal({
  editingClient,
  editingClientName,
  editingClientFrequency,
  editingClientNextPaymentAt,
  editingClientAmountDelta,
  editingClientAmountDeltaDescription,
  isSaving,
  isAddingAmountChange,
  onClose,
  onSave,
  onAddAmountChange,
  setEditingClientName,
  setEditingClientFrequency,
  setEditingClientNextPaymentAt,
  setEditingClientAmountDelta,
  setEditingClientAmountDeltaDescription
}: ScrumClientEditModalProps) {
  if (!editingClient) {
    return null;
  }

  const cycleMonths = getCycleMonths(editingClient.frequency);
  const currentMonthlyAmount = editingClient.amount / cycleMonths;

  const sortedHistory = [...editingClient.amountHistory].sort((a, b) => a.changedAt.localeCompare(b.changedAt));
  const initialMonthlyAmount = sortedHistory.length ? sortedHistory[0].previousAmount / cycleMonths : currentMonthlyAmount;

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

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onSave} disabled={isSaving} style={{ ...primaryButtonStyle, minWidth: 120 }}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>

        <div style={fieldGroupStyle}>
          <span style={labelStyle}>Monto actual</span>
          <strong style={{ fontSize: 20 }}>{formatCurrency(currentMonthlyAmount)} por mes</strong>
        </div>

        <div style={fieldGroupStyle}>
          <span style={labelStyle}>Sumar (o restar) al monto mensual</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="number"
              step="1"
              placeholder="Ej: 100 o -50"
              value={editingClientAmountDelta}
              onChange={(event) => setEditingClientAmountDelta(event.target.value)}
              style={{ ...compactInputStyle, maxWidth: 140 }}
            />
            <input
              placeholder="Descripcion (ej: arreglo de caja registradora)"
              value={editingClientAmountDeltaDescription}
              onChange={(event) => setEditingClientAmountDeltaDescription(event.target.value)}
              style={{ ...compactInputStyle, flex: 1, minWidth: 200 }}
            />
            <button
              type="button"
              onClick={onAddAmountChange}
              disabled={isAddingAmountChange}
              style={{ ...secondaryButtonStyle, minWidth: 100 }}
            >
              {isAddingAmountChange ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <span style={labelStyle}>Historial del monto</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 13, color: "#4b5568" }}>
              Monto inicial: <strong>{formatCurrency(initialMonthlyAmount)}</strong> por mes
            </div>
            {sortedHistory.map((change) => (
              <div key={change.id} style={{ fontSize: 13, color: "#4b5568" }}>
                <span style={{ color: change.delta >= 0 ? "#1f6f31" : "#9e2b2b", fontWeight: 700 }}>
                  {change.delta >= 0 ? "+" : ""}
                  {formatCurrency(change.delta / cycleMonths)}
                </span>{" "}
                de {change.description} <span style={{ color: "#8c98ad" }}>({formatDate(change.changedAt.slice(0, 10))})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
