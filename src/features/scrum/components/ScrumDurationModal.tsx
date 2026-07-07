import type { Dispatch, SetStateAction } from "react";
import { DIFFICULTY_LABELS, type TaskDifficulty, type TaskDurationUnit } from "../scrum.types";
import {
  compactInputStyle,
  compactNumberInputStyle,
  deleteButtonStyle,
  modalCardStyle,
  modalCloseButtonStyle,
  modalHeaderStyle,
  modalOverlayStyle,
  primaryButtonStyle,
  taskDurationEditorStyle
} from "../scrum.styles";

type ScrumDurationModalProps = {
  editingDifficulty: TaskDifficulty;
  editingDurationUnit: TaskDurationUnit;
  editingDurationValue: string;
  editingTaskId: number | null;
  onClose: () => void;
  onDelete: (taskId: number) => void;
  onSave: (taskId: number) => void;
  setEditingDifficulty: Dispatch<SetStateAction<TaskDifficulty>>;
  setEditingDurationUnit: Dispatch<SetStateAction<TaskDurationUnit>>;
  setEditingDurationValue: Dispatch<SetStateAction<string>>;
};

export function ScrumDurationModal({
  editingDifficulty,
  editingDurationUnit,
  editingDurationValue,
  editingTaskId,
  onClose,
  onDelete,
  onSave,
  setEditingDifficulty,
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
          <select value={editingDifficulty} onChange={(event) => setEditingDifficulty(event.target.value as TaskDifficulty)} style={compactInputStyle}>
            {Object.entries(DIFFICULTY_LABELS).map(([difficulty, label]) => (
              <option key={difficulty} value={difficulty}>
                {label}
              </option>
            ))}
          </select>
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
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Eliminar esta tarea?")) {
                onDelete(editingTaskId);
              }
            }}
            style={deleteButtonStyle}
          >
            Eliminar tarea
          </button>
          <button type="button" onClick={() => onSave(editingTaskId)} style={{ ...primaryButtonStyle, minWidth: 120 }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
