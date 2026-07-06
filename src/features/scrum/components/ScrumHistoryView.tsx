import { DIFFICULTY_STYLES, type BoardTimerHistoryDisplayEntry, type CompletedHistoryEntry } from "../scrum.types";
import {
  boardTimerSummaryStyle,
  columnCaptionStyle,
  counterStyle,
  difficultyBadgeBaseStyle,
  emptyStateStyle,
  historyCardStyle,
  historyDayHeaderStyle,
  historyHeaderStyle,
  historyListStyle,
  historyPanelStyle,
  historyTaskListStyle,
  historyTaskRowStyle,
  taskDescriptionStyle,
  timerHistoryHeaderStyle,
  timerHistoryPanelStyle
} from "../scrum.styles";
import { formatTrackedTime } from "../scrum.utils";

type ScrumHistoryViewProps = {
  boardElapsedSeconds: number;
  boardTimerHistory: BoardTimerHistoryDisplayEntry[];
  completedHistory: CompletedHistoryEntry[];
};

export function ScrumHistoryView({ boardElapsedSeconds, boardTimerHistory, completedHistory }: ScrumHistoryViewProps) {
  return (
    <section style={historyPanelStyle}>
      <header style={historyHeaderStyle}>
        <div style={{ display: "grid", gap: 4 }}>
          <strong style={{ fontSize: 18 }}>Historial diario</strong>
          <span style={columnCaptionStyle}>Aca ves por dia las tareas que ya pasaron a finalizadas.</span>
        </div>
      </header>

      <section style={timerHistoryPanelStyle}>
        <div style={timerHistoryHeaderStyle}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 17 }}>Tiempo trabajado</strong>
            <span style={columnCaptionStyle}>Se reinicia a las 00:00 de Uruguay y guarda el total del dia.</span>
          </div>
          <span style={boardTimerSummaryStyle}>{formatTrackedTime(boardElapsedSeconds)}</span>
        </div>

        <div style={historyListStyle}>
          {boardTimerHistory.length === 0 ? <p style={emptyStateStyle}>Todavia no hay dias guardados en el cronometro.</p> : null}
          {boardTimerHistory.map((entry) => (
            <article key={entry.dayKey} style={historyCardStyle}>
              <div style={historyDayHeaderStyle}>
                <strong style={{ fontSize: 16, textTransform: "capitalize" }}>{entry.dateLabel}</strong>
                <span style={boardTimerSummaryStyle}>{formatTrackedTime(entry.totalSeconds)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div style={historyListStyle}>
        {completedHistory.length === 0 ? <p style={emptyStateStyle}>Todavia no hay tareas finalizadas para registrar.</p> : null}

        {completedHistory.map((entry) => (
          <article key={entry.dateLabel} style={historyCardStyle}>
            <div style={historyDayHeaderStyle}>
              <strong style={{ fontSize: 16, textTransform: "capitalize" }}>{entry.dateLabel}</strong>
              <span style={counterStyle}>{entry.tasks.length}</span>
            </div>

            <div style={historyTaskListStyle}>
              {entry.tasks.map((task) => {
                const difficultyStyle = DIFFICULTY_STYLES[task.difficulty];

                return (
                  <div key={task.id} style={historyTaskRowStyle}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 14 }}>{task.title}</strong>
                      {task.description ? <span style={taskDescriptionStyle}>{task.description}</span> : null}
                    </div>
                    <span
                      style={{
                        ...difficultyBadgeBaseStyle,
                        background: difficultyStyle.background,
                        color: difficultyStyle.text,
                        border: `1px solid ${difficultyStyle.accent}`
                      }}
                    >
                      Hecha
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
