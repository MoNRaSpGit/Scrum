import type { CSSProperties } from "react";
import type { TaskStatus } from "./scrum.types";

// ---------------- Rediseno (22/10/2026, pedido explicito): "lo hicimos
// muy a la pasada... ahora lo veo medio mal trabajado, quiero que lo
// rediseñes totalmente, moderno, lindo, intuitivo" -- paleta y tipografia
// nuevas. Mismo nombres exportados que antes para no tener que tocar los
// modales que no cambiaron de estructura (ScrumClientEditModal,
// ScrumDurationModal, ScrumTimerEditModal, ScrumConfirmModal): heredan el
// look nuevo solo. ----------------
//
// Modo oscuro "cine/neon" (31/10/2026, pedido explicito: "version oscura,
// mas cool, tipo pelicula, con los botones fosforecentes"). Fondo casi
// negro azulado + acentos bien saturados con glow (box-shadow) en los
// botones principales. Mismos nombres exportados que antes, solo cambian
// los valores -- los componentes no se tocan salvo contraste puntual.

const FONT_FAMILY = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

// Tokens de color -- un solo lugar para toda la paleta.
const COLOR = {
  bg: "#090c14",
  surface: "#121728",
  surfaceSunken: "#0d111e",
  border: "#232a44",
  borderStrong: "#323a5c",
  textPrimary: "#eef1fb",
  textSecondary: "#9aa3c0",
  textMuted: "#6b7390",
  // Cian electrico -- acento principal, usado en los botones "fosforecentes".
  accent: "#22d3ee",
  accentHover: "#7dd3fc",
  accentSoft: "rgba(34, 211, 238, 0.14)",
  accentSoftBorder: "rgba(34, 211, 238, 0.38)",
  // Violeta -- segundo acento, para la accion "Avanzar" (distinta del cian).
  accentAlt: "#a78bfa",
  success: "#34d399",
  successSoft: "rgba(52, 211, 153, 0.14)",
  successSoftBorder: "rgba(52, 211, 153, 0.4)",
  successText: "#6ee7b7",
  warning: "#fbbf24",
  warningSoft: "rgba(251, 191, 36, 0.14)",
  warningSoftBorder: "rgba(251, 191, 36, 0.4)",
  warningText: "#fcd34d",
  danger: "#fb4570",
  dangerSoft: "rgba(251, 69, 112, 0.14)",
  dangerSoftBorder: "rgba(251, 69, 112, 0.4)",
  dangerText: "#ff8aa3",
  // Texto oscuro para escribir ARRIBA de un boton solido fosforecente
  // (mejor contraste que blanco sobre un color tan brillante).
  onNeon: "#071019"
};

const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 };
const SHADOW_SM = "0 1px 3px rgba(0, 0, 0, 0.45)";
const SHADOW_MD = "0 16px 40px rgba(0, 0, 0, 0.55)";

// Glow fosforecente de cada acento -- reutilizado por todos los botones
// solidos para que "brillen" sobre el fondo oscuro.
const GLOW_ACCENT = "0 0 1px rgba(34, 211, 238, 0.9), 0 0 18px rgba(34, 211, 238, 0.5)";
const GLOW_ACCENT_ALT = "0 0 1px rgba(167, 139, 250, 0.9), 0 0 18px rgba(167, 139, 250, 0.5)";
const GLOW_DANGER = "0 0 1px rgba(251, 69, 112, 0.9), 0 0 18px rgba(251, 69, 112, 0.5)";

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "24px 20px 60px",
  background: COLOR.bg,
  color: COLOR.textPrimary,
  fontFamily: FONT_FAMILY,
  display: "grid",
  gap: 24
};

// ---------------- Header / navegacion ----------------
export const heroStyle: CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: 16
};
export const titleStyle: CSSProperties = { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.3 };
export const titleRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" };
export const headerTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap"
};
export const brandMarkStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: COLOR.accent,
  boxShadow: GLOW_ACCENT,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: COLOR.onNeon,
  fontWeight: 800,
  fontSize: 16
};
export const boardTimerBlockStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
export const boardTimerWrapStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
export const boardTimerPanelStyle: CSSProperties = { display: "grid", gap: 1, justifyItems: "start" };
export const boardTimerCaptionStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: COLOR.textMuted,
  textTransform: "uppercase",
  letterSpacing: 0.4
};
export const boardTimerValueStyle: CSSProperties = {
  minWidth: 150,
  minHeight: 36,
  padding: "0 12px",
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surfaceSunken,
  color: COLOR.accent,
  textShadow: "0 0 10px rgba(34, 211, 238, 0.55)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontVariantNumeric: "tabular-nums",
  fontWeight: 800
};
export const boardTimerSummaryStyle: CSSProperties = {
  minHeight: 28,
  padding: "0 10px",
  borderRadius: RADIUS.pill,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  color: COLOR.textPrimary,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 800
};
export const noticeStyle: CSSProperties = { margin: 0, fontSize: 13, color: COLOR.textSecondary };
export const headerTabsAlignStyle: CSSProperties = { display: "flex", justifyContent: "flex-start" };
export const tabsWrapStyle: CSSProperties = {
  display: "inline-flex",
  gap: 4,
  flexWrap: "wrap",
  padding: 4,
  background: COLOR.surfaceSunken,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.pill
};

// ---------------- Paneles / layout general ----------------
export const loadingPanelStyle: CSSProperties = { width: "min(1240px, 100%)", margin: "0 auto" };
export const panelStyle: CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  background: COLOR.surface,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.lg,
  padding: 20,
  boxShadow: SHADOW_SM,
  display: "grid",
  gap: 14
};
export const collapsibleFormHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
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
export const fieldGroupStyle: CSSProperties = { display: "grid", gap: 7 };
export const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 700, color: COLOR.textSecondary };
export const inputStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 12px",
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLOR.borderStrong}`,
  background: COLOR.surfaceSunken,
  color: COLOR.textPrimary,
  // 16px, no 14: por debajo de eso Safari/Chrome en celular hacen zoom
  // automatico al enfocar el campo (bug encontrado 22/10/2026).
  fontSize: 16,
  fontFamily: FONT_FAMILY
};
export const formActionsStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", alignSelf: "end" };

// ---------------- Tablero ----------------
export const boardStyle: CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  alignItems: "start"
};
export const columnStyle: CSSProperties = {
  minHeight: 420,
  background: COLOR.surfaceSunken,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.lg,
  padding: 14,
  display: "grid",
  gap: 12,
  alignContent: "start"
};
export const columnHeaderStyle: CSSProperties = { display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12, padding: "2px 4px" };
export const columnCaptionStyle: CSSProperties = { fontSize: 12, lineHeight: 1.5, color: COLOR.textMuted };
export const counterStyle: CSSProperties = {
  minWidth: 28,
  minHeight: 28,
  padding: "0 9px",
  borderRadius: RADIUS.pill,
  display: "inline-grid",
  placeItems: "center",
  background: COLOR.surface,
  border: `1px solid ${COLOR.border}`,
  color: COLOR.textSecondary,
  fontSize: 12,
  fontWeight: 800
};
export const taskListStyle: CSSProperties = { display: "grid", gap: 10, alignContent: "start" };
export const emptyStateStyle: CSSProperties = {
  margin: 0,
  padding: "18px 14px",
  border: `1px dashed ${COLOR.borderStrong}`,
  borderRadius: RADIUS.md,
  color: COLOR.textMuted,
  fontSize: 13,
  textAlign: "center"
};
export const taskCardBaseStyle: CSSProperties = {
  borderRadius: RADIUS.md,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  padding: 14,
  display: "grid",
  gap: 10,
  boxShadow: SHADOW_SM
};
export const taskHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" };
export const taskRowButtonStyle: CSSProperties = {
  border: "none",
  padding: 0,
  margin: 0,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
  fontFamily: FONT_FAMILY
};
export const taskTitleStyle: CSSProperties = { fontSize: 15, lineHeight: 1.3, fontWeight: 700, color: COLOR.textPrimary };
export const taskDescriptionStyle: CSSProperties = { fontSize: 13, lineHeight: 1.5, color: COLOR.textSecondary };
export const difficultyBadgeBaseStyle: CSSProperties = {
  minHeight: 26,
  padding: "0 10px",
  borderRadius: RADIUS.pill,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.2
};
export const metaChipStyle: CSSProperties = { fontSize: 12, color: COLOR.textSecondary };
export const taskFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
};
export const taskDetailsStyle: CSSProperties = { display: "grid", gap: 12, paddingTop: 2 };
export const durationInlineStyle: CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) 100px" };

// Pequeño punto de color + etiqueta, mas liviano que un badge solido
// (usado arriba de cada tarjeta de tarea en el tablero rediseñado).
export function difficultyDotStyle(color: string): CSSProperties {
  return { width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 };
}

// ---------------- Historial (dejado de lado de la navegacion, pedido
// explicito 22/10/2026 -- el codigo se deja intacto por si se reactiva) ----------------
export const historyPanelStyle: CSSProperties = { ...panelStyle };
export const timerHistoryPanelStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: 18,
  background: COLOR.surfaceSunken,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.md
};
export const timerHistoryHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
};
export const historyHeaderStyle: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" };
export const historyListStyle: CSSProperties = { display: "grid", gap: 12 };
export const historyCardStyle: CSSProperties = {
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  borderRadius: RADIUS.md,
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
  borderTop: `1px solid ${COLOR.border}`,
  paddingTop: 10
};

// ---------------- Clientes ----------------
export const clientGridStyle: CSSProperties = { display: "grid", gap: 10 };
export const clientCardStyle: CSSProperties = {
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.md,
  background: COLOR.surface,
  padding: 16,
  display: "grid",
  gap: 12,
  boxShadow: SHADOW_SM
};
export const clientRowButtonStyle: CSSProperties = {
  border: "none",
  padding: 0,
  margin: 0,
  background: "transparent",
  // Un <button> no hereda el color del texto de la pagina (el navegador
  // le pone su propio color por defecto, oscuro) -- sin esto, el nombre
  // del cliente quedaba invisible sobre el fondo oscuro de la tarjeta.
  color: COLOR.textPrimary,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  textAlign: "left",
  width: "100%",
  fontFamily: FONT_FAMILY
};
export const clientStatusBadgeStyle: CSSProperties = {
  minHeight: 26,
  padding: "0 10px",
  borderRadius: RADIUS.pill,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 800,
  flexShrink: 0
};
export const clientDetailsStyle: CSSProperties = { display: "grid", gap: 12, paddingTop: 4 };
export const clientActionsStyle: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
export const clientMetaGridStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };
export const clientPrimaryValueStyle: CSSProperties = { fontSize: 20, fontWeight: 800, color: COLOR.textPrimary };
export const clientFooterStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
// Rediseno 14/11/2026: ya no es una caja dentro de otra caja, sino una
// seccion separada por una linea fina (Deuda / Materiales / Aviso).
export const debtPanelStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  paddingTop: 12,
  borderTop: `1px solid ${COLOR.border}`
};
export const debtSummaryRowStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" };
export const debtPaymentFormStyle: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
export const debtAmountInputStyle: CSSProperties = { ...inputStyle, minHeight: 38, width: 140 };
export const debtDetailInputStyle: CSSProperties = { ...inputStyle, minHeight: 38, flex: 1, minWidth: 180 };
export const debtHistoryListStyle: CSSProperties = { display: "grid", gap: 8 };
export const debtHistoryRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 13,
  color: COLOR.textSecondary,
  borderTop: `1px solid ${COLOR.border}`,
  paddingTop: 8
};
export const debtHistoryTotalRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontWeight: 800,
  borderTop: `1px solid ${COLOR.borderStrong}`,
  paddingTop: 8
};

// ---------------- Modales ----------------
export const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(3, 4, 8, 0.72)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 40
};
export const modalCardStyle: CSSProperties = {
  width: "min(460px, 100%)",
  background: COLOR.surface,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.lg,
  padding: 20,
  display: "grid",
  gap: 16,
  boxShadow: SHADOW_MD,
  fontFamily: FONT_FAMILY
};
export const modalHeaderStyle: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
export const modalCloseButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: "0 12px",
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  color: COLOR.textSecondary,
  cursor: "pointer",
  fontWeight: 600
};
export const taskDurationEditorStyle: CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) 100px auto" };
export const compactInputStyle: CSSProperties = { ...inputStyle, minHeight: 40 };
export const compactNumberInputStyle: CSSProperties = { ...inputStyle, minHeight: 40 };

// ---------------- Gráficos ----------------
export const monthlyEarningsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 2,
  padding: "8px 16px",
  borderRadius: RADIUS.md,
  background: COLOR.accentSoft,
  border: `1px solid ${COLOR.accentSoftBorder}`
};
export const monthlyEarningsLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  color: COLOR.accentHover
};
export const monthlyEarningsValueStyle: CSSProperties = { fontSize: 22, fontWeight: 800, color: COLOR.accent };

// "Por cobrar" (04/11/2026, pedido explicito): tarjeta al lado de
// Ganancia mensual, mismo molde pero en rojo (igual que el estado
// "vencido" de la tarjeta del cliente) -- es plata que todavia no se
// cobro, no una proyeccion.
export const summaryCardsRowStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
export const receivableStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 2,
  padding: "8px 16px",
  borderRadius: RADIUS.md,
  background: COLOR.dangerSoft,
  border: `1px solid ${COLOR.dangerSoftBorder}`
};
export const receivableLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  color: COLOR.dangerText
};
export const receivableValueStyle: CSSProperties = { fontSize: 22, fontWeight: 800, color: COLOR.danger };

// "Resta este mes" (05/11/2026, pedido explicito): tercera tarjeta, en
// amarillo -- plata de clientes que todavia no vencieron pero les toca
// pagar antes de fin de mes ("faltan 5 dias", "faltan 6 dias").
export const remainingThisMonthStyle: CSSProperties = {
  ...receivableStyle,
  background: COLOR.warningSoft,
  border: `1px solid ${COLOR.warningSoftBorder}`
};
export const remainingThisMonthLabelStyle: CSSProperties = { ...receivableLabelStyle, color: COLOR.warningText };
export const remainingThisMonthValueStyle: CSSProperties = { ...receivableValueStyle, color: COLOR.warning };

// Lista desplegable de quien paga este mes (se abre al tocar la tarjeta).
export const remainingWrapperStyle: CSSProperties = { position: "relative" };
export const remainingListStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  zIndex: 20,
  minWidth: 260,
  maxWidth: "min(360px, 90vw)",
  maxHeight: 320,
  overflowY: "auto",
  display: "grid",
  gap: 8,
  padding: 12,
  borderRadius: RADIUS.md,
  background: COLOR.surface,
  border: `1px solid ${COLOR.warningSoftBorder}`,
  boxShadow: SHADOW_SM
};
export const remainingListItemStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, color: COLOR.textPrimary, fontSize: 14 };
export const remainingListTotalStyle: CSSProperties = { ...remainingListItemStyle, borderTop: `1px solid ${COLOR.border}`, paddingTop: 8, color: COLOR.warning };

export const earningsChartCardStyle: CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  background: COLOR.surface,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.lg,
  padding: 20,
  boxShadow: SHADOW_SM,
  display: "grid",
  gap: 4,
  position: "relative"
};
export const earningsChartTitleStyle: CSSProperties = { margin: 0, fontSize: 15, fontWeight: 800, color: COLOR.textPrimary };
export const earningsChartCaptionStyle: CSSProperties = { margin: 0, fontSize: 13, color: COLOR.textMuted };
export const earningsChartTooltipStyle: CSSProperties = {
  position: "absolute",
  pointerEvents: "none",
  background: COLOR.surface,
  border: `1px solid ${COLOR.borderStrong}`,
  color: COLOR.textPrimary,
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  whiteSpace: "nowrap",
  boxShadow: SHADOW_MD,
  transform: "translate(-50%, -100%)",
  zIndex: 2
};

// ---------------- Botones ----------------
export const primaryButtonStyle: CSSProperties = {
  minHeight: 42,
  padding: "0 18px",
  border: "none",
  borderRadius: RADIUS.sm,
  background: COLOR.accent,
  boxShadow: GLOW_ACCENT,
  color: COLOR.onNeon,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT_FAMILY
};

export function boardTimerButtonStyle(running: boolean): CSSProperties {
  return {
    ...primaryButtonStyle,
    minHeight: 36,
    background: running ? COLOR.danger : COLOR.accent,
    boxShadow: running ? GLOW_DANGER : GLOW_ACCENT
  };
}

export function tabButtonStyle(active: boolean): CSSProperties {
  return {
    minHeight: 36,
    padding: "0 16px",
    borderRadius: RADIUS.pill,
    border: "none",
    background: active ? COLOR.surface : "transparent",
    color: active ? COLOR.accent : COLOR.textSecondary,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: active ? `${SHADOW_SM}, 0 0 10px rgba(34, 211, 238, 0.3)` : "none",
    fontFamily: FONT_FAMILY
  };
}

export function statusPillStyle(status: TaskStatus): CSSProperties {
  const base: CSSProperties = {
    minHeight: 28,
    padding: "0 12px",
    borderRadius: RADIUS.pill,
    fontSize: 12,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center"
  };
  if (status === "todo") return { ...base, background: COLOR.accentSoft, color: COLOR.accentHover };
  if (status === "in_progress") return { ...base, background: COLOR.warningSoft, color: COLOR.warningText };
  return { ...base, background: COLOR.successSoft, color: COLOR.successText };
}

export const secondaryButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLOR.border}`,
  background: COLOR.surface,
  color: COLOR.textPrimary,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT_FAMILY
};

export const ghostButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: RADIUS.sm,
  border: "none",
  background: "transparent",
  color: COLOR.textSecondary,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT_FAMILY
};

export const advanceButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: 36,
  background: COLOR.accentAlt,
  boxShadow: GLOW_ACCENT_ALT
};

export const deleteButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: 36,
  background: COLOR.danger,
  boxShadow: GLOW_DANGER
};

// ---------------- Clientes: rediseno de UX (14/11/2026) ----------------
// Pedido: "no me gusta mucho como se ve, mejorar la parte de clientes,
// los colores me siguen gustando". Misma paleta, mejor jerarquia: resumen en
// grilla pareja, tarjeta con monto a la vista y franja de estado, acciones
// ordenadas y "Eliminar" discreto.
export const clientSummaryGridStyle: CSSProperties = { display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" };
const summaryTileBase: CSSProperties = {
  display: "grid",
  gap: 2,
  padding: "12px 14px",
  borderRadius: RADIUS.md,
  textAlign: "left",
  fontFamily: FONT_FAMILY,
  minWidth: 0
};
export const summaryTileAccentStyle: CSSProperties = { ...summaryTileBase, background: COLOR.accentSoft, border: `1px solid ${COLOR.accentSoftBorder}` };
export const summaryTileAltStyle: CSSProperties = {
  ...summaryTileBase,
  background: "rgba(167, 139, 250, 0.14)",
  border: "1px solid rgba(167, 139, 250, 0.38)"
};
export const summaryTileWarningStyle: CSSProperties = { ...summaryTileBase, background: COLOR.warningSoft, border: `1px solid ${COLOR.warningSoftBorder}` };
export const summaryTileCommissionStyle: CSSProperties = {
  ...summaryTileBase,
  background: COLOR.successSoft,
  border: `1px solid ${COLOR.successSoftBorder}`
};
export const summaryTileLabelStyle: CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 };
export const summaryTileValueStyle: CSSProperties = { fontSize: 22, fontWeight: 800, lineHeight: 1.15 };
export const summaryTileColors = { accent: [COLOR.accentHover, COLOR.accent], alt: ["#c4b5fd", COLOR.accentAlt], warning: [COLOR.warningText, COLOR.warning] } as const;

export const clientNewButtonStyle: CSSProperties = {
  minHeight: 46,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: RADIUS.md,
  border: `1px dashed ${COLOR.accentSoftBorder}`,
  background: "transparent",
  color: COLOR.accent,
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: FONT_FAMILY
};
export const clientNewFormPanelStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  boxSizing: "border-box",
  padding: 16,
  borderRadius: RADIUS.md,
  border: `1px solid ${COLOR.borderStrong}`,
  background: COLOR.surfaceSunken
};

export function clientCardAccentStyle(color: string): CSSProperties {
  return {
    border: `1px solid ${COLOR.border}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: RADIUS.md,
    background: COLOR.surface,
    padding: "14px 16px",
    display: "grid",
    gap: 10,
    boxShadow: SHADOW_SM
  };
}
export const clientHeaderTextStyle: CSSProperties = { display: "grid", gap: 4, minWidth: 0 };
export const clientNameStyle: CSSProperties = { fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
export const clientHeaderAmountStyle: CSSProperties = { display: "grid", gap: 2, justifyItems: "end", flexShrink: 0 };
export const clientAmountStyle: CSSProperties = { fontSize: 17, fontWeight: 800, color: COLOR.textPrimary };
export const clientChipsRowStyle: CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
export function clientChipStyle(color: string, background: string): CSSProperties {
  return { fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: RADIUS.pill, color, background };
}
export const clientFactsGridStyle: CSSProperties = { display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" };
export const clientFactStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  padding: "8px 10px",
  borderRadius: RADIUS.sm,
  background: COLOR.surfaceSunken,
  border: `1px solid ${COLOR.border}`
};
export const clientFactLabelStyle: CSSProperties = { fontSize: 11, fontWeight: 700, color: COLOR.textMuted, textTransform: "uppercase", letterSpacing: 0.4 };
export const clientFactValueStyle: CSSProperties = { fontSize: 14, fontWeight: 700, color: COLOR.textPrimary };
export const clientMainActionsStyle: CSSProperties = { display: "flex", gap: 8 };
export const clientDeleteLinkStyle: CSSProperties = {
  justifySelf: "end",
  border: "none",
  background: "transparent",
  color: COLOR.dangerText,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  padding: "6px 4px",
  fontFamily: FONT_FAMILY,
  opacity: 0.85
};
export const clientSectionStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  paddingTop: 12,
  borderTop: `1px solid ${COLOR.border}`
};
