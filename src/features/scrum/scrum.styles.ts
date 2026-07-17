import type { CSSProperties } from "react";
import type { TaskStatus } from "./scrum.types";

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "20px",
  background: "#f3f6fb",
  color: "#162033",
  fontFamily: "Inter, Segoe UI, sans-serif",
  display: "grid",
  gap: 20
};

export const heroStyle: CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 20,
  alignItems: "start"
};

export const titleStyle: CSSProperties = { margin: 0, fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.05 };
export const titleRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" };
export const boardTimerBlockStyle: CSSProperties = { display: "grid", gap: 10, justifyItems: "start" };
export const boardTimerWrapStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
export const boardTimerPanelStyle: CSSProperties = { display: "grid", gap: 4, justifyItems: "start" };
export const boardTimerCaptionStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#5f6b80",
  textTransform: "uppercase"
};
export const boardTimerValueStyle: CSSProperties = {
  minWidth: 188,
  minHeight: 42,
  padding: "0 14px",
  borderRadius: 8,
  border: "1px solid #d7dfeb",
  background: "#ffffff",
  color: "#162033",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  fontVariantNumeric: "tabular-nums",
  fontWeight: 800
};
export const boardTimerSummaryStyle: CSSProperties = {
  minHeight: 32,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid #d7dfeb",
  background: "#ffffff",
  color: "#162033",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 800
};
export const noticeStyle: CSSProperties = { margin: 0, fontSize: 14, color: "#44526b" };
export const headerTabsAlignStyle: CSSProperties = { display: "flex", justifyContent: "flex-end" };
export const tabsWrapStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
export const loadingPanelStyle: CSSProperties = { width: "min(1240px, 100%)", margin: "0 auto" };
export const panelStyle: CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 18,
  display: "grid",
  gap: 14
};
export const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1.6fr) minmax(220px, 1.8fr) minmax(180px, 1fr) minmax(240px, 1.2fr) auto",
  gap: 14,
  alignItems: "end"
};
export const clientFormGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(160px, 1fr)) auto",
  gap: 14,
  alignItems: "end"
};
export const fieldGroupStyle: CSSProperties = { display: "grid", gap: 8 };
export const labelStyle: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#44526b" };
export const inputStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #cfd8e6",
  background: "#ffffff",
  color: "#162033",
  fontSize: 14
};
export const formActionsStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", alignSelf: "end" };
export const boardStyle: CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  alignItems: "start"
};
export const columnStyle: CSSProperties = {
  minHeight: 520,
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 16,
  display: "grid",
  gap: 14,
  alignContent: "start"
};
export const columnHeaderStyle: CSSProperties = { display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 };
export const columnCaptionStyle: CSSProperties = { fontSize: 13, lineHeight: 1.5, color: "#6a7891" };
export const counterStyle: CSSProperties = {
  minWidth: 32,
  minHeight: 32,
  padding: "0 10px",
  borderRadius: 999,
  display: "inline-grid",
  placeItems: "center",
  background: "#e8eefc",
  color: "#2847b8",
  fontSize: 13,
  fontWeight: 800
};
export const taskListStyle: CSSProperties = { display: "grid", gap: 12, alignContent: "start" };
export const emptyStateStyle: CSSProperties = {
  margin: 0,
  padding: "16px 14px",
  border: "1px dashed #d6deea",
  borderRadius: 8,
  color: "#6a7891",
  fontSize: 14
};
export const taskCardBaseStyle: CSSProperties = {
  borderRadius: 8,
  border: "1px solid #dfe6f2",
  padding: 14,
  display: "grid",
  gap: 12
};
export const taskHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" };
export const taskRowButtonStyle: CSSProperties = {
  border: "none",
  padding: 0,
  margin: 0,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer"
};
export const taskTitleStyle: CSSProperties = { fontSize: 16, lineHeight: 1.3 };
export const taskDescriptionStyle: CSSProperties = { fontSize: 14, lineHeight: 1.5, color: "#4b5871" };
export const difficultyBadgeBaseStyle: CSSProperties = {
  minHeight: 30,
  padding: "0 12px",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 800
};
export const metaChipStyle: CSSProperties = { fontSize: 13, color: "#44526b" };
export const taskFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
};
export const taskDetailsStyle: CSSProperties = { display: "grid", gap: 12 };
export const durationInlineStyle: CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) 100px" };
export const historyPanelStyle: CSSProperties = { ...panelStyle };
export const timerHistoryPanelStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: 18,
  background: "#f8fbff",
  border: "1px solid #d7dfeb",
  borderRadius: 8
};
export const timerHistoryHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
};
export const historyHeaderStyle: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 };
export const historyListStyle: CSSProperties = { display: "grid", gap: 12 };
export const historyCardStyle: CSSProperties = {
  border: "1px solid #d7dfeb",
  background: "#ffffff",
  borderRadius: 8,
  padding: 16,
  display: "grid",
  gap: 12
};
export const historyDayHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
export const historyTaskListStyle: CSSProperties = { display: "grid", gap: 10 };
export const historyTaskRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  borderTop: "1px solid #edf1f7",
  paddingTop: 10
};
export const clientGridStyle: CSSProperties = { display: "grid", gap: 12 };
export const clientCardStyle: CSSProperties = {
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 12
};
export const clientRowButtonStyle: CSSProperties = {
  border: "none",
  padding: 0,
  margin: 0,
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  textAlign: "left"
};
export const clientStatusBadgeStyle: CSSProperties = {
  minHeight: 30,
  padding: "0 12px",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 800
};
export const clientDetailsStyle: CSSProperties = { display: "grid", gap: 12 };
export const clientActionsStyle: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
export const clientMetaGridStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };
export const clientPrimaryValueStyle: CSSProperties = { fontSize: 18, fontWeight: 800 };
export const clientFooterStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
export const debtPanelStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 14,
  border: "1px solid #edf1f7",
  borderRadius: 8,
  background: "#f8fbff"
};
export const debtSummaryRowStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };
export const debtPaymentFormStyle: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
export const debtAmountInputStyle: CSSProperties = { ...inputStyle, minHeight: 38, width: 140 };
export const debtHistoryListStyle: CSSProperties = { display: "grid", gap: 8 };
export const debtHistoryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 13,
  color: "#44526b",
  borderTop: "1px solid #edf1f7",
  paddingTop: 8
};
export const debtHistoryTotalRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontWeight: 800,
  borderTop: "1px solid #d7dfeb",
  paddingTop: 8
};
export const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(18, 24, 38, 0.45)",
  display: "grid",
  placeItems: "center",
  padding: 20
};
export const modalCardStyle: CSSProperties = {
  width: "min(460px, 100%)",
  background: "#ffffff",
  borderRadius: 8,
  padding: 18,
  display: "grid",
  gap: 16
};
export const modalHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
export const modalCloseButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #d7dfeb",
  background: "#ffffff",
  cursor: "pointer"
};
export const taskDurationEditorStyle: CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) 100px auto" };
export const compactInputStyle: CSSProperties = { ...inputStyle, minHeight: 40 };
export const compactNumberInputStyle: CSSProperties = { ...inputStyle, minHeight: 40 };

export const primaryButtonStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 16px",
  border: "none",
  borderRadius: 8,
  background: "#1f4ed8",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer"
};

export function boardTimerButtonStyle(running: boolean): CSSProperties {
  return { ...primaryButtonStyle, background: running ? "#d64545" : "#1f4ed8" };
}

export function tabButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 999,
    border: active ? "1px solid #1f4ed8" : "1px solid #d4dbe7",
    background: active ? "#eaf0ff" : "#ffffff",
    color: active ? "#1f4ed8" : "#43526a",
    fontWeight: 700,
    cursor: "pointer"
  };
}

export function statusPillStyle(status: TaskStatus): CSSProperties {
  if (status === "todo") {
    return {
      minHeight: 30,
      padding: "0 12px",
      borderRadius: 999,
      background: "#eef4ff",
      color: "#1f4ed8",
      fontSize: 12,
      fontWeight: 800,
      display: "inline-flex",
      alignItems: "center"
    };
  }
  if (status === "in_progress") {
    return {
      minHeight: 30,
      padding: "0 12px",
      borderRadius: 999,
      background: "#fff8e6",
      color: "#8f6800",
      fontSize: 12,
      fontWeight: 800,
      display: "inline-flex",
      alignItems: "center"
    };
  }
  return {
    minHeight: 30,
    padding: "0 12px",
    borderRadius: 999,
    background: "#eefaf1",
    color: "#1f6f31",
    fontSize: 12,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center"
  };
}

export const secondaryButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 8,
  border: "1px solid #d7dfeb",
  background: "#ffffff",
  color: "#162033",
  fontWeight: 700,
  cursor: "pointer"
};

export const advanceButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: 38,
  background: "#0f766e"
};

export const deleteButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: 38,
  background: "#d64545"
};
