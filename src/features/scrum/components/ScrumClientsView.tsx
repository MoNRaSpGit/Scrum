import type { Dispatch, FormEvent, SetStateAction } from "react";
import { BILLING_FREQUENCY_LABELS, CLIENT_ALERT_STYLES, type BillingFrequency, type ClientBilling } from "../scrum.types";
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
import { formatCurrency, formatDate, getClientAlertState, getClientRelativeLabel } from "../scrum.utils";

type ScrumClientsViewProps = {
  clientAmount: string;
  clientFrequency: BillingFrequency;
  clientName: string;
  clientNextPaymentAt: string;
  clients: ClientBilling[];
  expandedClientId: number | null;
  now: number;
  onCreateClient: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteClient: (clientId: number) => void;
  onRegisterClientPayment: (clientId: number) => void;
  setClientAmount: Dispatch<SetStateAction<string>>;
  setClientFrequency: Dispatch<SetStateAction<BillingFrequency>>;
  setClientName: Dispatch<SetStateAction<string>>;
  setClientNextPaymentAt: Dispatch<SetStateAction<string>>;
  setExpandedClientId: Dispatch<SetStateAction<number | null>>;
};

export function ScrumClientsView({
  clientAmount,
  clientFrequency,
  clientName,
  clientNextPaymentAt,
  clients,
  expandedClientId,
  now,
  onCreateClient,
  onDeleteClient,
  onRegisterClientPayment,
  setClientAmount,
  setClientFrequency,
  setClientName,
  setClientNextPaymentAt,
  setExpandedClientId
}: ScrumClientsViewProps) {
  return (
    <section style={historyPanelStyle}>
      <header style={historyHeaderStyle}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 18 }}>Clientes</strong>
          <span style={columnCaptionStyle}>Seguimiento de cobro segun frecuencia y proximidad del proximo pago.</span>
        </div>
      </header>

      <section style={panelStyle}>
        <form onSubmit={onCreateClient} style={clientFormGridStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="client-name">
              Nombre
            </label>
            <input id="client-name" value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nombre del cliente" style={inputStyle} />
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

          <div style={formActionsStyle}>
            <button type="submit" style={primaryButtonStyle}>
              Crear cliente
            </button>
          </div>
        </form>
      </section>

      <div style={clientGridStyle}>
        {clients.length === 0 ? <p style={emptyStateStyle}>Todavia no hay clientes cargados.</p> : null}

        {clients.map((client) => {
          const alertState = getClientAlertState(client.nextPaymentAt, now);
          const alertStyle = CLIENT_ALERT_STYLES[alertState];
          const expanded = expandedClientId === client.id;

          return (
            <article key={client.id} style={clientCardStyle}>
              <button type="button" onClick={() => setExpandedClientId(expanded ? null : client.id)} style={clientRowButtonStyle}>
                <strong style={{ fontSize: 16 }}>{client.name}</strong>
                <span
                  style={{
                    ...clientStatusBadgeStyle,
                    background: alertStyle.background,
                    color: alertStyle.color,
                    border: `1px solid ${alertStyle.border}`
                  }}
                >
                  {alertStyle.label}
                </span>
              </button>

              {expanded ? (
                <div style={clientDetailsStyle}>
                  <div style={clientMetaGridStyle}>
                    <span style={clientPrimaryValueStyle}>{formatCurrency(client.amount)}</span>
                    <span style={metaChipStyle}>{BILLING_FREQUENCY_LABELS[client.frequency]}</span>
                  </div>

                  <div style={clientFooterStyle}>
                    <span style={metaChipStyle}>Proximo pago: {formatDate(client.nextPaymentAt)}</span>
                    <span style={{ ...metaChipStyle, color: alertStyle.color, fontWeight: 700 }}>
                      {getClientRelativeLabel(client.nextPaymentAt, now)}
                    </span>
                  </div>

                  <div style={clientActionsStyle}>
                    <button type="button" onClick={() => onRegisterClientPayment(client.id)} style={secondaryButtonStyle}>
                      Registrar pago
                    </button>
                    <button type="button" onClick={() => onDeleteClient(client.id)} style={deleteButtonStyle}>
                      Eliminar cliente
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
