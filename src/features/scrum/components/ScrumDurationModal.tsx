import type { Dispatch, SetStateAction } from "react";
import type { TaskDurationUnit } from "../scrum.types";
import { compactInputStyle, compactNumberInputStyle, modalCardStyle, modalCloseButtonStyle, modalHeaderStyle, modalOverlayStyle, primaryButtonStyle, taskDurationEditorStyle } from "../scrum.styles";

type ScrumDurationModalProps = {
  editingDurationUnit: TaskDurationUnit;
  editingDurationValue: string;
  editingTaskId: number | null;
  onClose: () => void;
  onSave: (taskId: number) => void;
  setEditingDurationUnit: Dispatch<SetStateAction<TaskDurationUnit>>;
  setEditingDurationValue: Dispatch<SetStateAction<string>>;
};

export function ScrumDurationModal({
  editingDurationUnit,
  editingDurationValue,
  editingTaskId,
  onClose,
  onSave,
  setEditingDurationUnit,
  setEditingDurationValue
}: ScrumDurationModalProps) {
  if (!editingTaskId) {
    return null;
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <strong style={{ fontSize: 18 }}>Editar plazo</strong>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle}>
            Cerrar
          </button>
        </div>

        <div style={taskDurationEditorStyle}>
          <select value={editingDurationUnit} onChange={(event) => setEditingDurationUnit(event.target.value as TaskDurationUnit)} style={compactInputStyle}>
            <option value="days">Dias</option>
            <option value="weeks">Semanas</option>
            <option value="months">Meses</option>
          </select>
          <input
            type="number"
            min="1"
            max={editingDurationUnit === "days" ? "6" : editingDurationUnit === "weeks" ? "4" : undefined}
            step="1"
            value={editingDurationValue}
            onChange={(event) => setEditingDurationValue(event.target.value)}
            style={compactNumberInputStyle}
          />
          <button type="button" onClick={() => onSave(editingTaskId)} style={primaryButtonStyle}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
