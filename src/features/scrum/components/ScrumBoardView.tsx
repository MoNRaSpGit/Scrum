import type { Dispatch, FormEvent, SetStateAction } from "react";
import { DIFFICULTY_LABELS, DIFFICULTY_STYLES, STATUS_LABELS, type ScrumTask, type TaskDifficulty, type TaskDurationUnit, type TaskStatus } from "../scrum.types";
import {
  advanceButtonStyle,
  boardStyle,
  columnCaptionStyle,
  columnHeaderStyle,
  columnStyle,
  counterStyle,
  deleteButtonStyle,
  difficultyBadgeBaseStyle,
  durationInlineStyle,
  emptyStateStyle,
  fieldGroupStyle,
  formActionsStyle,
  formGridStyle,
  inputStyle,
  labelStyle,
  metaChipStyle,
  panelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  statusPillStyle,
  taskCardBaseStyle,
  taskDescriptionStyle,
  taskDetailsStyle,
  taskFooterStyle,
  taskHeaderStyle,
  taskListStyle,
  taskRowButtonStyle,
  taskTitleStyle
} from "../scrum.styles";
import { formatTaskDuration, formatTaskRemaining, statusLabel } from "../scrum.utils";

type ScrumBoardViewProps = {
  description: string;
  difficulty: TaskDifficulty;
  durationUnit: TaskDurationUnit;
  durationValue: string;
  expandedTaskId: number | null;
  groupedTasks: Record<TaskStatus, ScrumTask[]>;
  now: number;
  onAdvanceTask: (taskId: number) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteTask: (taskId: number) => void;
  onOpenEditTask: (task: ScrumTask) => void;
  setDescription: Dispatch<SetStateAction<string>>;
  setDifficulty: Dispatch<SetStateAction<TaskDifficulty>>;
  setDurationUnit: Dispatch<SetStateAction<TaskDurationUnit>>;
  setDurationValue: Dispatch<SetStateAction<string>>;
  setExpandedTaskId: Dispatch<SetStateAction<number | null>>;
  setTitle: Dispatch<SetStateAction<string>>;
  title: string;
};

export function ScrumBoardView({
  description,
  difficulty,
  durationUnit,
  durationValue,
  expandedTaskId,
  groupedTasks,
  now,
  onAdvanceTask,
  onCreateTask,
  onDeleteTask,
  onOpenEditTask,
  setDescription,
  setDifficulty,
  setDurationUnit,
  setDurationValue,
  setExpandedTaskId,
  setTitle,
  title
}: ScrumBoardViewProps) {
  return (
    <>
      <section style={panelStyle}>
        <form onSubmit={onCreateTask} style={formGridStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="task-title">
              Nombre
            </label>
            <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nueva tarea" style={inputStyle} />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="task-description">
              Descripcion
            </label>
            <input
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Opcional"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="task-difficulty">
              Dificultad
            </label>
            <select id="task-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as TaskDifficulty)} style={inputStyle}>
              <option value="green">Verde</option>
              <option value="yellow">Amarillo</option>
              <option value="red">Rojo</option>
              <option value="blue">Diaria</option>
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="task-duration-unit">
              Plazo
            </label>
            <div style={durationInlineStyle}>
              <select
                id="task-duration-unit"
                value={durationUnit}
                onChange={(event) => {
                  const nextUnit = event.target.value as TaskDurationUnit;
                  setDurationUnit(nextUnit);
                  if (nextUnit !== "days" && Number(durationValue) <= 0) {
                    setDurationValue("1");
                  }
                }}
                style={inputStyle}
              >
                <option value="days">Dias</option>
                <option value="weeks">Semanas</option>
                <option value="months">Meses</option>
              </select>
              <input
                type="number"
                min="1"
                max={durationUnit === "days" ? "6" : durationUnit === "weeks" ? "4" : undefined}
                step="1"
                value={durationValue}
                onChange={(event) => setDurationValue(event.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={formActionsStyle}>
            <button type="submit" style={primaryButtonStyle}>
              Crear tarea
            </button>
          </div>
        </form>
      </section>

      <section style={boardStyle}>
        {(["todo", "in_progress", "done"] as TaskStatus[]).map((statusKey) => (
          <section key={statusKey} style={columnStyle}>
            <header style={columnHeaderStyle}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ fontSize: 17 }}>{STATUS_LABELS[statusKey]}</strong>
                <span style={columnCaptionStyle}>
                  {statusKey === "todo" ? "Pendientes para empezar" : statusKey === "in_progress" ? "Tareas en curso" : "Tareas cerradas"}
                </span>
              </div>
              <span style={counterStyle}>{groupedTasks[statusKey].length}</span>
            </header>

            <div style={taskListStyle}>
              {groupedTasks[statusKey].length === 0 ? <p style={emptyStateStyle}>Sin tareas en esta columna.</p> : null}

              {groupedTasks[statusKey].map((task) => {
                const difficultyStyle = DIFFICULTY_STYLES[task.difficulty];
                const expanded = expandedTaskId === task.id;

                return (
                  <article
                    key={task.id}
                    style={{
                      ...taskCardBaseStyle,
                      borderLeft: `5px solid ${difficultyStyle.accent}`,
                      background: difficultyStyle.background
                    }}
                  >
                    <button type="button" onClick={() => setExpandedTaskId(expanded ? null : task.id)} style={taskRowButtonStyle}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={taskTitleStyle}>{task.title}</strong>
                        <span style={metaChipStyle}>{formatTaskRemaining(task, now)}</span>
                      </div>
                    </button>

                    {expanded ? (
                      <div style={taskDetailsStyle}>
                        <div style={taskHeaderStyle}>
                          <div style={{ display: "grid", gap: 6 }}>
                            {task.description ? <span style={taskDescriptionStyle}>{task.description}</span> : null}
                            <span style={metaChipStyle}>Plazo: {formatTaskDuration(task.durationUnit, task.durationValue)}</span>
                          </div>
                          <span style={{ ...difficultyBadgeBaseStyle, background: difficultyStyle.accent, color: "#ffffff" }}>
                            {DIFFICULTY_LABELS[task.difficulty]}
                          </span>
                        </div>

                        <div style={taskFooterStyle}>
                          <span style={statusPillStyle(task.status)}>{statusLabel(task.status)}</span>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" onClick={() => onOpenEditTask(task)} style={secondaryButtonStyle}>
                              Editar
                            </button>
                            {task.status !== "done" ? (
                              <button type="button" onClick={() => onAdvanceTask(task.id)} style={advanceButtonStyle}>
                                {task.status === "todo" ? "Mover a realizando >" : "Mover a finalizadas >"}
                              </button>
                            ) : null}
                            {task.status === "done" ? (
                              <button type="button" onClick={() => onDeleteTask(task.id)} style={deleteButtonStyle}>
                                Borrar
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </section>
    </>
  );
}
