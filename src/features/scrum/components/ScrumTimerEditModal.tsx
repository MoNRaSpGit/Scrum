import type { Dispatch, SetStateAction } from "react";
import {
  compactInputStyle,
  fieldGroupStyle,
  labelStyle,
  modalCardStyle,
  modalCloseButtonStyle,
  modalHeaderStyle,
  modalOverlayStyle,
  primaryButtonStyle
} from "../scrum.styles";

type ScrumTimerEditModalProps = {
  isOpen: boolean;
  hoursInput: string;
  minutesInput: string;
  onClose: () => void;
  onSave: () => void;
  setHoursInput: Dispatch<SetStateAction<string>>;
  setMinutesInput: Dispatch<SetStateAction<string>>;
};

export function ScrumTimerEditModal({
  isOpen,
  hoursInput,
  minutesInput,
  onClose,
  onSave,
  setHoursInput,
  setMinutesInput
}: ScrumTimerEditModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <strong style={{ fontSize: 18 }}>Editar cronometro</strong>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle}>
            Cerrar
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: "#6a7891" }}>
          Por si arrancaste a trabajar antes de apretar "Iniciar cronometro" (o te olvidaste de arrancarlo). El tiempo acumulado de hoy queda en lo que pongas aca.
        </p>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="timer-edit-hours">
              Horas
            </label>
            <input
              id="timer-edit-hours"
              type="number"
              min="0"
              step="1"
              value={hoursInput}
              onChange={(event) => setHoursInput(event.target.value)}
              style={compactInputStyle}
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="timer-edit-minutes">
              Minutos
            </label>
            <input
              id="timer-edit-minutes"
              type="number"
              min="0"
              max="59"
              step="1"
              value={minutesInput}
              onChange={(event) => setMinutesInput(event.target.value)}
              style={compactInputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onSave} style={{ ...primaryButtonStyle, minWidth: 120 }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
