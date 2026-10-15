import { deleteButtonStyle, modalCardStyle, modalOverlayStyle, secondaryButtonStyle } from "../scrum.styles";

type ScrumConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Confirmacion propia de la app (15/10/2026, pedido explicito: "el cartel
// de confirmacion es de Windows, quiero un modal nuestro que diga seguro
// que queres eliminar..."). Reemplaza a window.confirm en tareas,
// clientes y deudas. Va por encima de cualquier otro modal abierto.
export function ScrumConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ScrumConfirmModalProps) {
  return (
    <div style={{ ...modalOverlayStyle, zIndex: 50 }} onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        style={{ ...modalCardStyle, width: "min(400px, 100%)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <strong style={{ fontSize: 18 }}>{title}</strong>
        <p style={{ margin: 0, color: "#5b6576", lineHeight: 1.45 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle} autoFocus>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} style={deleteButtonStyle}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
