import { useEffect, useState } from "react";
import { requestJson } from "../scrum.api";
import { debtPanelStyle, inputStyle, labelStyle, metaChipStyle, secondaryButtonStyle } from "../scrum.styles";
import { shareReceipt } from "../scrumReceipt";
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
type NoticeTarget = { appKey: NoticeAppKey; username: string; fullName: string | null };

const APP_LABELS: Record<NoticeAppKey, string> = { gym: "Gimnasio", distribuidora: "Distribuidora", eme: "Eme", gaby: "Gaby", joker: "Joker" };
// Todas menos el gimnasio avisan a toda la app (no hay a quien elegir); el
// gimnasio se elige por gimnasio y lo ven todos sus usuarios.
const APP_WIDE_USER = "_app";
const APP_WIDE_APPS: NoticeAppKey[] = ["distribuidora", "eme", "gaby", "joker"];
const APP_WIDE_HINTS: Partial<Record<NoticeAppKey, string>> = {
  distribuidora: "El aviso lo ve solo el administrador de la distribuidora.",
  joker: "El aviso lo ve solo el administrador de Joker.",
  eme: "Esta app no tiene login: el aviso le sale a quien la abra.",
  gaby: "Esta app no tiene login: el aviso le sale a quien la abra."
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
  const [targets, setTargets] = useState<NoticeTarget[]>([]);
  const [appKey, setAppKey] = useState<NoticeAppKey>("gym");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [receiptMessage, setReceiptMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    requestJson<{ notices: ClientNotice[]; targets: NoticeTarget[] }>("/scrum/notices")
      .then((data) => {
        if (cancelled) return;
        const mine = data.notices.find((entry) => entry.clientId === client.id) ?? null;
        setNotice(mine);
        setTargets(data.targets);
        setAppKey(mine?.appKey ?? "gym");
        setUsername(mine?.appUsername ?? "");
      })
      .catch(() => {
        if (!cancelled) setMessage("No se pudo cargar el aviso.");
      });
    return () => {
      cancelled = true;
    };
  }, [client.id]);

  async function setActive(active: boolean) {
    if (!username) {
      setMessage("Elegí primero el usuario de la app.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const saved = await requestJson<ClientNotice>(`/scrum/clients/${client.id}/notice`, {
        method: "PUT",
        body: JSON.stringify({ appKey, appUsername: username, active })
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

      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 14 }}>Aviso de demora en la app</strong>
        <label style={labelStyle} htmlFor={`notice-app-${client.id}`}>
          App del cliente
        </label>
        <select
          id={`notice-app-${client.id}`}
          value={appKey}
          onChange={(event) => {
            const next = event.target.value as NoticeAppKey;
            setAppKey(next);
            setUsername(APP_WIDE_APPS.includes(next) ? APP_WIDE_USER : "");
          }}
          disabled={busy || active}
          style={inputStyle}
        >
          {(Object.keys(APP_LABELS) as NoticeAppKey[]).map((key) => (
            <option key={key} value={key}>
              {APP_LABELS[key]}
            </option>
          ))}
        </select>
        {APP_WIDE_APPS.includes(appKey) ? (
          <span style={metaChipStyle}>{APP_WIDE_HINTS[appKey]}</span>
        ) : (
          <>
            <label style={labelStyle} htmlFor={`notice-user-${client.id}`}>
              Gimnasio (el aviso lo ven todos sus usuarios)
            </label>
            <select
              id={`notice-user-${client.id}`}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={busy || active}
              style={inputStyle}
            >
              <option value="">Elegir usuario…</option>
              {targets
                .filter((target) => target.appKey === appKey)
                .map((target) => (
                  <option key={`${target.appKey}-${target.username}`} value={target.username}>
                    {target.username}
                    {target.fullName ? ` (${target.fullName})` : ""}
                  </option>
                ))}
            </select>
          </>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {active ? (
            <button type="button" onClick={() => void setActive(false)} disabled={busy} style={secondaryButtonStyle}>
              Desactivar aviso
            </button>
          ) : (
            <button type="button" onClick={() => void setActive(true)} disabled={busy || !username} style={secondaryButtonStyle}>
              Activar aviso de demora
            </button>
          )}
          {active ? <span style={{ ...metaChipStyle, fontWeight: 700 }}>Activo</span> : null}
        </div>
        {active && notice?.activatedAt ? <span style={metaChipStyle}>Activado: {formatDateTime(notice.activatedAt)}</span> : null}
        {active ? (
          <span style={metaChipStyle}>
            {notice?.lastSeenAt ? `Lo vio: ${formatDateTime(notice.lastSeenAt)}` : "Todavía no entró a la app desde que se activó."}
          </span>
        ) : null}
        {message ? <span style={{ ...metaChipStyle, fontWeight: 700 }}>{message}</span> : null}
      </div>

      {client.whatsapp ? (
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 14 }}>Recibo</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={() => void sendReceipt()} style={secondaryButtonStyle}>
            Recibo por WhatsApp
          </button>
        </div>
        {receiptMessage ? <span style={metaChipStyle}>{receiptMessage}</span> : null}
      </div>
      ) : null}
    </div>
  );
}
