import type { ViewMode } from "../scrum.types";
import {
  boardTimerBlockStyle,
  boardTimerButtonStyle,
  boardTimerCaptionStyle,
  boardTimerPanelStyle,
  boardTimerValueStyle,
  boardTimerWrapStyle,
  brandMarkStyle,
  ghostButtonStyle,
  headerTopRowStyle,
  heroStyle,
  noticeStyle,
  tabButtonStyle,
  tabsWrapStyle,
  titleStyle
} from "../scrum.styles";

type ScrumHeaderProps = {
  boardTimerRunning: boolean;
  boardTimerValue: string;
  feedbackMessage: string | null;
  onToggleBoardTimer: () => void;
  onEditBoardTimer: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
};

const TABS: { key: ViewMode; label: string }[] = [
  { key: "board", label: "Tablero" },
  { key: "clients", label: "Clientes" },
  { key: "charts", label: "Gráficos" }
];

// Rediseno 22/10/2026 (pedido explicito): "quiero que lo rediseñes
// totalmente... tablero, clientes y graficos" -- se sacan Historial y
// Deudas de la barra (quedan sin uso real, el codigo sigue intacto).
export function ScrumHeader({
  boardTimerRunning,
  boardTimerValue,
  feedbackMessage,
  onToggleBoardTimer,
  onEditBoardTimer,
  viewMode,
  onChangeViewMode
}: ScrumHeaderProps) {
  return (
    <section style={heroStyle}>
      <div style={headerTopRowStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={brandMarkStyle}>S</span>
          <h1 style={titleStyle}>Scrum</h1>
        </div>

        <nav style={tabsWrapStyle}>
          {TABS.map((tab) => (
            <button key={tab.key} type="button" onClick={() => onChangeViewMode(tab.key)} style={tabButtonStyle(viewMode === tab.key)}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {viewMode === "board" ? (
        <div style={boardTimerBlockStyle}>
          <div style={boardTimerWrapStyle}>
            <button type="button" onClick={onToggleBoardTimer} style={boardTimerButtonStyle(boardTimerRunning)}>
              {boardTimerRunning ? "Detener cronómetro" : "Iniciar cronómetro"}
            </button>
            <button type="button" onClick={onEditBoardTimer} style={ghostButtonStyle}>
              Editar
            </button>
            <div style={boardTimerPanelStyle}>
              <span style={boardTimerCaptionStyle}>{boardTimerRunning ? "En vivo" : "Tiempo acumulado hoy"}</span>
              <span style={boardTimerValueStyle}>{boardTimerValue}</span>
            </div>
          </div>
          {feedbackMessage ? <p style={noticeStyle}>{feedbackMessage}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
