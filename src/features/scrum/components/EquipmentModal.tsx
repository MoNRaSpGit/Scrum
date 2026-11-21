import { useState } from "react";
import { requestJson } from "../scrum.api";
import { modalCardStyle, modalCloseButtonStyle, modalHeaderStyle, modalOverlayStyle } from "../scrum.styles";
import type { ClientBilling } from "../scrum.types";
import { formatCurrency, formatDate, getMontevideoDateKey } from "../scrum.utils";

type EquipmentResponse = { ok: boolean; item: ClientBilling };

// Planilla de equipos (21/11/2026, pedido explicito): un renglon por cliente con
// cuanto va, cuanto le queda, en que cuota esta y cuando vence; "Pagó la cuota"
// registra el pago de esa cuota y todo se recalcula solo.
export function EquipmentModal({
  clients,
  onClose,
  onClientChanged,
  onOpenClient
}: {
  clients: ClientBilling[];
  onClose: () => void;
  onClientChanged: (client: ClientBilling) => void;
  onOpenClient: (clientId: number) => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const withEquipment = clients
    .filter((client) => client.equipment)
    .sort((a, b) => {
      const aDone = (a.equipment?.remaining ?? 0) <= 0;
      const bDone = (b.equipment?.remaining ?? 0) <= 0;
      if (aDone !== bDone) return aDone ? 1 : -1;
      return a.nextPaymentAt.localeCompare(b.nextPaymentAt);
    });
  const totalLeft = withEquipment.reduce((sum, client) => sum + Math.max(0, client.equipment?.remaining ?? 0), 0);
  const totalPaid = withEquipment.reduce((sum, client) => sum + (client.equipment?.paid ?? 0), 0);
  const nextTotal = withEquipment.reduce(
    (sum, client) => sum + Math.min(client.equipment?.installmentAmount ?? 0, Math.max(0, client.equipment?.remaining ?? 0)),
    0
  );
  const todayKey = getMontevideoDateKey(Date.now());

  function daysUntil(dateKey: string) {
    const ms = new Date(dateKey + "T00:00:00").getTime() - new Date(todayKey + "T00:00:00").getTime();
    return Math.round(ms / 86_400_000);
  }

  async function payInstallment(client: ClientBilling) {
    const equipment = client.equipment;
    if (!equipment) return;
    const amount = Math.min(equipment.installmentAmount, equipment.remaining);
    setBusyId(client.id);
    setMessage("");
    try {
      const response = await requestJson<EquipmentResponse>(`/scrum/clients/${client.id}/equipment/payments`, {
        method: "POST",
        body: JSON.stringify({ amount })
      });
      onClientChanged(response.item);
      setConfirmId(null);
    } catch {
      setMessage("No se pudo guardar el pago. Probá de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={{ ...modalCardStyle, width: "min(760px, 100%)", maxHeight: "90vh", overflowY: "auto" }} onClick={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <strong style={{ fontSize: 18 }}>Equipos</strong>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle}>
            Cerrar
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <Summary label="Próximo cobro" value={formatCurrency(nextTotal)} color="#c4b5fd" />
          <Summary label="Ya cobrado" value={formatCurrency(totalPaid)} color="#6ee7b7" />
          <Summary label="Falta cobrar" value={formatCurrency(totalLeft)} color="#fda4af" />
        </div>

        {withEquipment.length === 0 ? (
          <span style={{ color: "#9aa3c0" }}>Ningún cliente tiene equipo. Se agrega desde la ficha del cliente → Materiales.</span>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {withEquipment.map((client) => {
              const equipment = client.equipment!;
              const done = equipment.remaining <= 0;
              const paidInstallments = Math.max(0, equipment.months - equipment.installmentsLeft);
              const current = Math.min(equipment.months, paidInstallments + 1);
              const percent = equipment.total > 0 ? Math.min(100, (equipment.paid / equipment.total) * 100) : 0;
              const days = daysUntil(client.nextPaymentAt);
              const dueText = days < 0 ? `venció hace ${-days} ${-days === 1 ? "día" : "días"}` : days === 0 ? "vence hoy" : `faltan ${days} ${days === 1 ? "día" : "días"}`;
              const installment = Math.min(equipment.installmentAmount, Math.max(0, equipment.remaining));
              return (
                <div
                  key={client.id}
                  style={{ display: "grid", gap: 8, padding: 12, borderRadius: 12, border: "1px solid rgba(167, 139, 250, 0.28)", background: "rgba(167, 139, 250, 0.06)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => onOpenClient(client.id)}
                      style={{ all: "unset", cursor: "pointer", fontWeight: 700, fontSize: 16, textDecoration: "underline", textUnderlineOffset: 3 }}
                    >
                      {client.name}
                    </button>
                    <span style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 600 }}>
                      {done ? "✓ Saldado" : `Cuota ${current} de ${equipment.months} · ${formatCurrency(equipment.installmentAmount)}/mes`}
                    </span>
                  </div>

                  <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ width: percent + "%", height: "100%", background: done ? "#34d399" : "#a78bfa" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, fontSize: 13 }}>
                    <span>
                      <span style={{ color: "#9aa3c0" }}>Pagó</span> <strong>{formatCurrency(equipment.paid)}</strong>
                    </span>
                    <span>
                      <span style={{ color: "#9aa3c0" }}>Falta</span> <strong style={{ color: done ? "#34d399" : "#fda4af" }}>{formatCurrency(Math.max(0, equipment.remaining))}</strong>
                    </span>
                    <span>
                      <span style={{ color: "#9aa3c0" }}>Total</span> <strong>{formatCurrency(equipment.total)}</strong>
                    </span>
                  </div>

                  {!done ? (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: days < 0 ? "#fda4af" : "#9aa3c0" }}>
                        Vence {formatDate(client.nextPaymentAt)} · {dueText}
                      </span>
                      {confirmId === client.id ? (
                        <span style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            disabled={busyId === client.id}
                            onClick={() => void payInstallment(client)}
                            style={{ padding: "6px 12px", borderRadius: 8, border: 0, background: "#34d399", color: "#06281b", fontWeight: 700, cursor: "pointer" }}
                          >
                            {busyId === client.id ? "Guardando…" : `Sí, pagó ${formatCurrency(installment)}`}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "inherit", cursor: "pointer" }}
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(client.id)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(52, 211, 153, 0.5)", background: "rgba(52, 211, 153, 0.12)", color: "#6ee7b7", fontWeight: 700, cursor: "pointer" }}
                        >
                          ✓ Pagó la cuota
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {message ? <span style={{ color: "#fda4af" }}>{message}</span> : null}
        <span style={{ fontSize: 12, color: "#9aa3c0" }}>Si pagó otro monto (dos cuotas juntas, una parte), registralo desde la ficha del cliente → Materiales.</span>
      </div>
    </div>
  );
}

function Summary({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "grid", gap: 2, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
      <span style={{ fontSize: 12, color: "#9aa3c0" }}>{label}</span>
      <strong style={{ fontSize: 18, color }}>{value}</strong>
    </div>
  );
}
