import type { ViewMode } from "../scrum.types";
import {
  boardTimerBlockStyle,
  boardTimerButtonStyle,
  boardTimerCaptionStyle,
  boardTimerPanelStyle,
  boardTimerValueStyle,
  boardTimerWrapStyle,
  headerTabsAlignStyle,
  heroStyle,
  noticeStyle,
  tabButtonStyle,
  tabsWrapStyle,
  titleRowStyle,
  titleStyle
} from "../scrum.styles";

type ScrumHeaderProps = {
  boardTimerRunning: boolean;
  boardTimerValue: string;
  feedbackMessage: string | null;
  onToggleBoardTimer: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
};

export function ScrumHeader({
  boardTimerRunning,
  boardTimerValue,
  feedbackMessage,
  onToggleBoardTimer,
  viewMode,
  onChangeViewMode
}: ScrumHeaderProps) {
  return (
    <section style={heroStyle}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={titleRowStyle}>
          <h1 style={titleStyle}>Scrum</h1>
        </div>
        <div style={boardTimerBlockStyle}>
          <div style={boardTimerWrapStyle}>
            <button type="button" onClick={onToggleBoardTimer} style={boardTimerButtonStyle(boardTimerRunning)}>
              {boardTimerRunning ? "Detener cronometro" : "Iniciar cronometro"}
            </button>
          </div>
          <div style={boardTimerPanelStyle}>
            <span style={boardTimerCaptionStyle}>{boardTimerRunning ? "En vivo" : "Tiempo acumulado hoy"}</span>
            <span style={boardTimerValueStyle}>{boardTimerValue}</span>
          </div>
        </div>
        {feedbackMessage ? <p style={noticeStyle}>{feedbackMessage}</p> : null}
      </div>
      <div style={headerTabsAlignStyle}>
        <section style={tabsWrapStyle}>
          <button type="button" onClick={() => onChangeViewMode("board")} style={tabButtonStyle(viewMode === "board")}>
            Tablero
          </button>
          <button type="button" onClick={() => onChangeViewMode("history")} style={tabButtonStyle(viewMode === "history")}>
            Historial
          </button>
          <button type="button" onClick={() => onChangeViewMode("clients")} style={tabButtonStyle(viewMode === "clients")}>
            Clientes
          </button>
        </section>
      </div>
    </section>
  );
}
