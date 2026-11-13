import { useState } from "react";
import { requestJson } from "../scrum.api";
import {
  debtAmountInputStyle,
  debtHistoryListStyle,
  debtHistoryRowStyle,
  debtHistoryTotalRowStyle,
  debtPanelStyle,
  debtPaymentFormStyle,
  fichaBarFillStyle,
  fichaBarTrackStyle,
  fichaBigStyle,
  fichaHeaderStyle,
  fichaLabelStyle,
  fichaLinkButtonStyle,
  fichaLinksStyle,
  fichaSubStyle,
  ghostButtonStyle,
  secondaryButtonStyle
} from "../scrum.styles";
import type { ClientBilling } from "../scrum.types";
import { formatCurrency, formatDateTime } from "../scrum.utils";

type EquipmentResponse = { ok: boolean; item: ClientBilling };

// Materiales / equipo de un cliente (14/11/2026, pedido explicito): el equipo
// lo compra Logic Lab y se lo cobra aparte del programa, en cuotas (ej: $200
// x 10 meses). NO suma a la ganancia mensual. Cada pago es de monto libre:
// una cuota, dos juntas o todo de golpe; lo que falta se recalcula solo.
export function ClientEquipmentPanel({ client, onClientChanged }: { client: ClientBilling; onClientChanged: (client: ClientBilling) => void }) {
  const equipment = client.equipment;
  const [isEditing, setIsEditing] = useState(false);
  const [installmentInput, setInstallmentInput] = useState("");
  const [monthsInput, setMonthsInput] = useState("10");
  const [paymentInput, setPaymentInput] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(path: string, init: RequestInit, onDone?: () => void) {
    setBusy(true);
    setMessage("");
    try {
      const response = await requestJson<EquipmentResponse>(path, init);
      onClientChanged(response.item);
      onDone?.();
    } catch {
      setMessage("No se pudo guardar. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  function startEditing() {
    setInstallmentInput(equipment ? String(equipment.installmentAmount) : "");
    setMonthsInput(equipment ? String(equipment.months) : "10");
    setMessage("");
    setIsEditing(true);
  }

  function savePlan() {
    const installmentAmount = Number(installmentInput);
    const months = Math.round(Number(monthsInput));
    if (!Number.isFinite(installmentAmount) || installmentAmount <= 0 || !Number.isFinite(months) || months < 1 || months > 120) {
      setMessage("Poné una cuota mayor a 0 y los meses (1 a 120).");
      return;
    }
    void run(`/scrum/clients/${client.id}/equipment`, { method: "PUT", body: JSON.stringify({ installmentAmount, months }) }, () => setIsEditing(false));
  }

  function registerPayment() {
    const amount = Number(paymentInput || equipment?.installmentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Poné el monto que pagó.");
      return;
    }
    void run(`/scrum/clients/${client.id}/equipment/payments`, { method: "POST", body: JSON.stringify({ amount }) }, () => setPaymentInput(""));
  }

  if (!equipment && !isEditing) {
    return (
      <div style={debtPanelStyle}>
        <span style={fichaLabelStyle}>Materiales</span>
        <span style={fichaSubStyle}>Equipo que comprás y le cobrás aparte, en cuotas.</span>
        <div style={fichaLinksStyle}>
          <button type="button" onClick={startEditing} style={fichaLinkButtonStyle}>
            + Agregar materiales
          </button>
        </div>
      </div>
    );
  }

  if (isEditing || !equipment) {
    return (
      <div style={debtPanelStyle}>
        <span style={fichaLabelStyle}>Materiales</span>
        <span style={fichaSubStyle}>Se cobran aparte, no suman a la ganancia.</span>
        <div style={debtPaymentFormStyle}>
          <input type="number" min="1" step="1" value={installmentInput} onChange={(event) => setInstallmentInput(event.target.value)} placeholder="Cuota (ej: 200)" style={debtAmountInputStyle} />
          <input type="number" min="1" max="120" step="1" value={monthsInput} onChange={(event) => setMonthsInput(event.target.value)} placeholder="Meses (ej: 10)" style={debtAmountInputStyle} />
        </div>
        <div style={debtPaymentFormStyle}>
          <button type="button" onClick={savePlan} disabled={busy} style={secondaryButtonStyle}>
            Guardar
          </button>
          <button type="button" onClick={() => setIsEditing(false)} style={ghostButtonStyle}>
            Cancelar
          </button>
        </div>
        {message ? <span style={fichaSubStyle}>{message}</span> : null}
      </div>
    );
  }

  const settled = equipment.remaining <= 0;
  const paidPercent = equipment.total > 0 ? (equipment.paid / equipment.total) * 100 : 0;

  return (
    <div style={debtPanelStyle}>
      <div style={fichaHeaderStyle}>
        <span style={fichaLabelStyle}>Materiales</span>
        <span style={{ ...fichaLabelStyle, color: "#c4b5fd" }}>{Math.round(paidPercent)}% pago</span>
      </div>
      <div style={fichaBigStyle}>{settled ? "Saldados" : formatCurrency(equipment.remaining)}</div>
      <span style={fichaSubStyle}>
        {settled ? `Se pagó el total de ${formatCurrency(equipment.total)}` : `faltan de ${formatCurrency(equipment.total)}`}
        {" · "}
        {formatCurrency(equipment.installmentAmount)} x {equipment.months} meses
        {settled ? "" : ` · quedan ~${equipment.installmentsLeft} cuotas`}
      </span>
      <div style={fichaBarTrackStyle}>
        <div style={fichaBarFillStyle(paidPercent, "#a78bfa")} />
      </div>

      {!settled ? (
        <div style={debtPaymentFormStyle}>
          <input
            type="number"
            min="1"
            step="1"
            value={paymentInput}
            onChange={(event) => setPaymentInput(event.target.value)}
            placeholder={`Monto (${equipment.installmentAmount})`}
            style={debtAmountInputStyle}
          />
          <button type="button" onClick={registerPayment} disabled={busy} style={secondaryButtonStyle}>
            Registrar pago
          </button>
        </div>
      ) : null}

      <div style={fichaLinksStyle}>
        {equipment.payments.length > 0 ? (
          <button type="button" onClick={() => setShowDetails((current) => !current)} style={fichaLinkButtonStyle}>
            {showDetails ? "Ocultar pagos" : "Ver pagos"}
          </button>
        ) : null}
        <button type="button" onClick={startEditing} style={fichaLinkButtonStyle}>
          Editar plan
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("¿Quitar los materiales de este cliente? Se borran también sus pagos.")) {
              void run(`/scrum/clients/${client.id}/equipment`, { method: "DELETE" });
            }
          }}
          style={{ ...fichaLinkButtonStyle, color: "#9aa3c0" }}
        >
          Quitar
        </button>
      </div>

      {showDetails ? (
        <div style={debtHistoryListStyle}>
          {equipment.payments.map((payment) => (
            <div key={payment.id} style={debtHistoryRowStyle}>
              <span>{formatDateTime(payment.paidAt)}</span>
              <span>
                {formatCurrency(payment.amount)}{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("¿Borrar este pago?")) {
                      void run(`/scrum/clients/${client.id}/equipment/payments/${payment.id}`, { method: "DELETE" });
                    }
                  }}
                  style={{ ...ghostButtonStyle, padding: "0 6px" }}
                  aria-label="Borrar pago"
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
          <div style={debtHistoryTotalRowStyle}>
            <span>Total pagado</span>
            <span>{formatCurrency(equipment.paid)}</span>
          </div>
        </div>
      ) : null}

      {message ? <span style={fichaSubStyle}>{message}</span> : null}
    </div>
  );
}
