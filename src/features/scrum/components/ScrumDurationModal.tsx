import { useState, type Dispatch, type SetStateAction } from "react";
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
import { ScrumConfirmModal } from "./ScrumConfirmModal";

type ScrumDurationModalProps = {
  editingDifficulty: TaskDifficulty;
  editingDurationUnit: TaskDurationUnit;
  editingDurationValue: string;
  editingTaskId: number | null;
  // Nombre de la tarea, para el cartel de confirmacion al eliminar.
  editingTaskTitle?: string;
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
  editingTaskTitle,
  onClose,
  onDelete,
  onSave,
  setEditingDifficulty,
  setEditingDurationUnit,
  setEditingDurationValue
}: ScrumDurationModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
            onClick={() => setConfirmingDelete(true)}
            style={deleteButtonStyle}
          >
            Eliminar tarea
          </button>
          <button type="button" onClick={() => onSave(editingTaskId)} style={{ ...primaryButtonStyle, minWidth: 120 }}>
            Guardar
          </button>
        </div>
      </div>

      {confirmingDelete ? (
        <ScrumConfirmModal
          title="¿Seguro que querés eliminar esta tarea?"
          message={`${editingTaskTitle ? `"${editingTaskTitle}" ` : "La tarea "}se borra del tablero. No se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete(editingTaskId);
          }}
        />
      ) : null}
    </div>
  );
}
