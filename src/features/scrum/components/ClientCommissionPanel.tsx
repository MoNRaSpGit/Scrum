import { useState } from "react";
import { requestJson } from "../scrum.api";
import {
  debtAmountInputStyle,
  debtPanelStyle,
  debtPaymentFormStyle,
  fichaBigStyle,
  fichaHeaderStyle,
  fichaLabelStyle,
  fichaLinkButtonStyle,
  fichaLinksStyle,
  fichaRowStrongStyle,
  fichaRowStyle,
  fichaSubStyle,
  fichaTableStyle,
  ghostButtonStyle,
  secondaryButtonStyle
} from "../scrum.styles";
import type { ClientBilling } from "../scrum.types";
import { formatCurrency, getMonthlyAmount } from "../scrum.utils";

// Comision (14/11/2026, pedido explicito): porcentaje del monto que se le da
// a quien vendio el proyecto (ej: 50%). La ganancia mensual cuenta solo lo
// que queda para nosotros; la comision va en su propia tarjeta.
export function ClientCommissionPanel({ client, onClientChanged }: { client: ClientBilling; onClientChanged: (client: ClientBilling) => void }) {
  const percent = client.commissionPercent ?? 0;
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(nextPercent: number) {
    setBusy(true);
    setMessage("");
    try {
      const response = await requestJson<{ ok: boolean; item: ClientBilling }>(`/scrum/clients/${client.id}/commission`, {
        method: "PUT",
        body: JSON.stringify({ percent: nextPercent })
      });
      onClientChanged(response.item);
      setIsEditing(false);
    } catch {
      setMessage("No se pudo guardar. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  function startEditing() {
    setInput(percent > 0 ? String(percent) : "50");
    setMessage("");
    setIsEditing(true);
  }

  function submit() {
    const value = Number(input);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setMessage("Poné un porcentaje entre 0 y 100.");
      return;
    }
    void save(value);
  }

  if (isEditing) {
    return (
      <div style={debtPanelStyle}>
        <span style={fichaLabelStyle}>Comisión</span>
        <div style={debtPaymentFormStyle}>
          <input type="number" min="0" max="100" step="1" value={input} onChange={(event) => setInput(event.target.value)} placeholder="%" style={debtAmountInputStyle} />
          <span style={fichaSubStyle}>% del monto</span>
        </div>
        <div style={debtPaymentFormStyle}>
          <button type="button" onClick={submit} disabled={busy} style={secondaryButtonStyle}>
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

  if (percent <= 0) {
    return (
      <div style={debtPanelStyle}>
        <span style={fichaLabelStyle}>Comisión</span>
        <span style={fichaSubStyle}>Sin comisión: todo lo que paga el cliente es tuyo.</span>
        <div style={fichaLinksStyle}>
          <button type="button" onClick={startEditing} style={fichaLinkButtonStyle}>
            + Agregar comisión
          </button>
        </div>
      </div>
    );
  }

  const monthly = getMonthlyAmount(client.amount, client.frequency);
  const commission = (monthly * percent) / 100;

  return (
    <div style={debtPanelStyle}>
      <div style={fichaHeaderStyle}>
        <span style={fichaLabelStyle}>Comisión</span>
        <span style={{ ...fichaLabelStyle, color: "#6ee7b7" }}>{percent}%</span>
      </div>
      <div style={fichaBigStyle}>{formatCurrency(commission)}</div>
      <span style={fichaSubStyle}>por mes para quien vendió</span>
      <div style={fichaTableStyle}>
        <div style={fichaRowStyle}>
          <span>Monto por mes</span>
          <span>{formatCurrency(monthly)}</span>
        </div>
        <div style={fichaRowStyle}>
          <span>Comisión ({percent}%)</span>
          <span>− {formatCurrency(commission)}</span>
        </div>
        <div style={{ ...fichaRowStrongStyle, color: "#6ee7b7" }}>
          <span>Te queda</span>
          <span>{formatCurrency(monthly - commission)}</span>
        </div>
      </div>
      <div style={fichaLinksStyle}>
        <button type="button" onClick={startEditing} style={fichaLinkButtonStyle}>
          Editar %
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("¿Quitar la comisión de este cliente?")) void save(0);
          }}
          style={{ ...fichaLinkButtonStyle, color: "#9aa3c0" }}
        >
          Quitar
        </button>
      </div>
      {message ? <span style={fichaSubStyle}>{message}</span> : null}
    </div>
  );
}
