import { useEffect, useState } from "react";
import { requestJson } from "../scrum.api";
import { debtPanelStyle, metaChipStyle, secondaryButtonStyle } from "../scrum.styles";
import { sendReceiptText, shareReceipt } from "../scrumReceipt";
import type { ClientBilling } from "../scrum.types";
import { formatCurrency, formatDate, formatDateTime } from "../scrum.utils";

type NoticeAppKey = "gym" | "distribuidora" | "eme" | "gaby" | "joker";
type ClientNotice = {
  clientId: number;
  appKey: NoticeAppKey;
  appUsername: string;
  active: boolean;
  activatedAt: string | null;
  lastSeenAt: string | null;
};
// Avisos de demora y recibo por WhatsApp de un cliente (11/11/2026, pedido
// explicito):
// - "Aviso de demora": vincula al cliente con su usuario en la app y activa
//   el cartel "su servicio se encuentra vencido" (le salta al iniciar
//   sesion hasta que se desactive aca).
// - "Recibo por WhatsApp": imagen con el logo, lo que pago y la fecha.
// Dias que faltan para el vencimiento (negativo = ya vencio), en dias de
// calendario, igual que las etiquetas "Faltan N dias" de la tarjeta.
const REMINDER_DAYS_BEFORE = 2;

function daysUntilDue(nextPaymentAt: string, now: number) {
  const today = new Date(now);
  const dueDate = new Date(`${nextPaymentAt}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}

function reminderText(client: ClientBilling, daysLeft: number) {
  const when = daysLeft === 0 ? "hoy" : daysLeft === 1 ? "mañana" : `en ${daysLeft} días`;
  return `Estimado/a ${client.name}, le recordamos que su cuota de ${formatCurrency(client.amount)} vence ${when} (${formatDate(client.nextPaymentAt)}). Cualquier consulta, estamos a las órdenes. Gracias. — Logic Lab`;
}

function overdueText(client: ClientBilling, daysLate: number) {
  const ago = daysLate === 1 ? "hace 1 día" : `hace ${daysLate} días`;
  return `Estimado/a ${client.name}, según nuestro registro su cuota de ${formatCurrency(client.amount)} venció ${ago} (${formatDate(client.nextPaymentAt)}). Si ya la abonó, avísenos y le enviamos el comprobante; si necesita ayuda, escríbanos. Gracias. — Logic Lab`;
}

function openWhatsApp(client: ClientBilling, text: string) {
  // Al WhatsApp cargado del cliente (los botones solo salen si lo tiene).
  window.open(`https://wa.me/${client.whatsapp ?? ""}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

export function ClientNoticePanel({ client, now }: { client: ClientBilling; now: number }) {
  const daysLeft = daysUntilDue(client.nextPaymentAt, now);
  const isOverdue = daysLeft < 0;
  const canRemind = !isOverdue && daysLeft <= REMINDER_DAYS_BEFORE;
  const [notice, setNotice] = useState<ClientNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [receiptMessage, setReceiptMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    requestJson<{ notices: ClientNotice[] }>("/scrum/notices")
      .then((data) => {
        if (cancelled) return;
        const mine = data.notices.find((entry) => entry.clientId === client.id) ?? null;
        setNotice(mine);
      })
      .catch(() => {
        if (!cancelled) setMessage("No se pudo cargar el aviso.");
      });
    return () => {
      cancelled = true;
    };
  }, [client.id]);

  // (16/11/2026) Ya no se elige app ni usuario a mano: este panel es del
  // cliente abierto. Solo queda poder apagar un aviso en-app que ya estuviera
  // activo (el backend y los datos no se tocaron).
  async function deactivate() {
    if (!notice) return;
    setBusy(true);
    setMessage("");
    try {
      const saved = await requestJson<ClientNotice>(`/scrum/clients/${client.id}/notice`, {
        method: "PUT",
        body: JSON.stringify({ appKey: notice.appKey, appUsername: notice.appUsername, active: false })
      });
      setNotice(saved);
    } catch {
      setMessage("No se pudo guardar. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReceipt() {
    setReceiptMessage("");
    try {
      const result = await shareReceipt(client);
      setReceiptMessage(result === "downloaded" ? "Imagen descargada: adjuntala en WhatsApp." : "");
    } catch (error) {
      setReceiptMessage(error instanceof Error ? error.message : "No se pudo armar el recibo.");
    }
  }

  const active = notice?.active === true;

  return (
    <div style={debtPanelStyle}>
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 14 }}>Aviso por WhatsApp</strong>
        {!client.whatsapp ? (
          <span style={metaChipStyle}>Cargale el WhatsApp a este cliente (botón Editar) para habilitar los avisos y el recibo.</span>
        ) : isOverdue ? (
          <button type="button" onClick={() => openWhatsApp(client, overdueText(client, Math.abs(daysLeft)))} style={secondaryButtonStyle}>
            Avisar retraso (venció hace {Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? "día" : "días"})
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openWhatsApp(client, reminderText(client, daysLeft))}
            disabled={!canRemind}
            style={{ ...secondaryButtonStyle, opacity: canRemind ? 1 : 0.5, cursor: canRemind ? "pointer" : "not-allowed" }}
          >
            Recordar vencimiento
          </button>
        )}
        {client.whatsapp && !isOverdue && !canRemind ? (
          <span style={metaChipStyle}>Se activa cuando falten {REMINDER_DAYS_BEFORE} días o menos (faltan {daysLeft}).</span>
        ) : null}
      </div>

      {active ? (
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ fontSize: 14 }}>Aviso de demora en la app</strong>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={() => void deactivate()} disabled={busy} style={secondaryButtonStyle}>
              Desactivar aviso
            </button>
            <span style={{ ...metaChipStyle, fontWeight: 700 }}>Activo</span>
          </div>
          {notice?.activatedAt ? <span style={metaChipStyle}>Activado: {formatDateTime(notice.activatedAt)}</span> : null}
          <span style={metaChipStyle}>
            {notice?.lastSeenAt ? `Lo vio: ${formatDateTime(notice.lastSeenAt)}` : "Todavía no entró a la app desde que se activó."}
          </span>
          {message ? <span style={{ ...metaChipStyle, fontWeight: 700 }}>{message}</span> : null}
        </div>
      ) : null}

      {client.whatsapp ? (
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 14 }}>Recibo</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={() => sendReceiptText(client)} style={secondaryButtonStyle}>
            Recibo por WhatsApp a {client.name}
          </button>
          <button type="button" onClick={() => void sendReceipt()} style={secondaryButtonStyle}>
            Recibo con imagen (logo)
          </button>
        </div>
        <span style={metaChipStyle}>
          El primero abre el chat de {client.name} con el mensaje. El segundo arma la imagen con el logo y abre el menú de compartir del celular: ahí elegís WhatsApp y a {client.name}.
        </span>
        {receiptMessage ? <span style={metaChipStyle}>{receiptMessage}</span> : null}
      </div>
      ) : null}
    </div>
  );
}
