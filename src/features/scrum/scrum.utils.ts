import {
  BOARD_TIMER_STORAGE_KEY,
  type BillingFrequency,
  type BoardTimerHistoryEntry,
  type BoardTimerSnapshot,
  type ClientAlertState,
  type CompletedHistoryEntry,
  type ScrumTask,
  type TaskDurationUnit,
  type TaskStatus
} from "./scrum.types";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function getClientAlertState(nextPaymentAt: string, now: number): ClientAlertState {
  const today = new Date(now);
  const dueDate = new Date(`${nextPaymentAt}T00:00:00`);
  const diffMs = dueDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "red";
  }

  if (diffDays <= 7) {
    return "yellow";
  }

  if (diffDays <= 30) {
    return "green";
  }

  return "white";
}

export function getClientRelativeLabel(nextPaymentAt: string, now: number) {
  const today = new Date(now);
  const dueDate = new Date(`${nextPaymentAt}T00:00:00`);
  const diffMs = dueDate.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return overdueDays === 1 ? "Vencio hace 1 dia" : `Vencio hace ${overdueDays} dias`;
  }

  if (diffDays <= 30) {
    return diffDays === 1 ? "Falta 1 dia" : `Faltan ${diffDays} dias`;
  }

  const months = Math.floor(diffDays / 30);
  return months === 1 ? "Falta 1 mes" : `Faltan ${months} meses`;
}

export function getMontevideoDateKey(dateValue: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(dateValue));
}

export function getMontevideoDayStart(dayKey: string) {
  return new Date(`${dayKey}T00:00:00-03:00`).getTime();
}

export function formatHistoryDay(dayKey: string) {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${dayKey}T00:00:00-03:00`));
}

export function formatTaskDuration(durationUnit: TaskDurationUnit, durationValue: number) {
  if (durationUnit === "days") {
    return durationValue === 1 ? "1 dia" : `${durationValue} dias`;
  }

  if (durationUnit === "weeks") {
    return durationValue === 1 ? "1 semana" : `${durationValue} semanas`;
  }

  return durationValue === 1 ? "1 mes" : `${durationValue} meses`;
}

export function getTaskDueAt(task: ScrumTask, startAt: number) {
  const dueAt = new Date(startAt);

  if (task.durationUnit === "days") {
    dueAt.setDate(dueAt.getDate() + task.durationValue);
    return dueAt.getTime();
  }

  if (task.durationUnit === "weeks") {
    dueAt.setDate(dueAt.getDate() + task.durationValue * 7);
    return dueAt.getTime();
  }

  dueAt.setMonth(dueAt.getMonth() + task.durationValue);
  return dueAt.getTime();
}

export function formatTaskRemaining(task: ScrumTask, now: number) {
  if (task.status === "todo" || !task.startedAt) {
    return `Plazo: ${formatTaskDuration(task.durationUnit, task.durationValue)}`;
  }

  if (task.status === "done") {
    return "Tarea finalizada";
  }

  const diffMs = getTaskDueAt(task, task.startedAt) - now;
  if (diffMs <= 0) {
    return "Plazo vencido";
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);
  const minutes = totalMinutes % 60;
  const hours = totalHours % 24;
  const days = totalDays % 7;

  if (totalHours < 24) {
    return `Quedan ${totalHours === 1 ? "1 hora" : `${totalHours} horas`}:${minutes === 1 ? "1 minuto" : `${minutes} minutos`}`;
  }

  if (totalDays < 7 && task.durationUnit === "days") {
    return `Quedan ${totalDays === 1 ? "1 dia" : `${totalDays} dias`}:${hours === 1 ? "1 hora" : `${hours} horas`}:${
      minutes === 1 ? "1 minuto" : `${minutes} minutos`
    }`;
  }

  if (totalWeeks > 0) {
    return `Quedan ${totalWeeks === 1 ? "1 semana" : `${totalWeeks} semanas`} ${days === 1 ? "1 dia" : `${days} dias`}:${
      hours === 1 ? "1 hora" : `${hours} horas`
    }:${minutes === 1 ? "1 minuto" : `${minutes} minutos`}`;
  }

  return `Quedan ${totalDays === 1 ? "1 dia" : `${totalDays} dias`}:${hours === 1 ? "1 hora" : `${hours} horas`}:${
    minutes === 1 ? "1 minuto" : `${minutes} minutos`
  }`;
}

export function formatTrackedTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function mergeBoardTimerHistory(history: BoardTimerHistoryEntry[], entry: BoardTimerHistoryEntry) {
  const nextHistory = [...history];
  const existingIndex = nextHistory.findIndex((currentEntry) => currentEntry.dayKey === entry.dayKey);

  if (existingIndex >= 0) {
    nextHistory[existingIndex] = entry;
  } else {
    nextHistory.push(entry);
  }

  return nextHistory.sort((left, right) => right.dayKey.localeCompare(left.dayKey));
}

export function getInitialBoardTimerState(now: number): BoardTimerSnapshot {
  const todayKey = getMontevideoDateKey(now);

  if (typeof window === "undefined") {
    return { dayKey: todayKey, trackedSeconds: 0, timerStartedAt: null, history: [] };
  }

  try {
    const rawSnapshot = window.localStorage.getItem(BOARD_TIMER_STORAGE_KEY);
    if (!rawSnapshot) {
      return { dayKey: todayKey, trackedSeconds: 0, timerStartedAt: null, history: [] };
    }

    const parsedSnapshot = JSON.parse(rawSnapshot) as Partial<BoardTimerSnapshot>;
    const dayKey = typeof parsedSnapshot.dayKey === "string" ? parsedSnapshot.dayKey : todayKey;
    const trackedSeconds = Number.isFinite(parsedSnapshot.trackedSeconds)
      ? Math.max(0, Math.floor(parsedSnapshot.trackedSeconds as number))
      : 0;
    const timerStartedAt =
      Number.isFinite(parsedSnapshot.timerStartedAt) && parsedSnapshot.timerStartedAt
        ? Number(parsedSnapshot.timerStartedAt)
        : null;
    const history = Array.isArray(parsedSnapshot.history)
      ? parsedSnapshot.history
          .filter((entry): entry is BoardTimerHistoryEntry => Boolean(entry && typeof entry.dayKey === "string"))
          .map((entry) => ({
            dayKey: entry.dayKey,
            totalSeconds: Math.max(0, Math.floor(Number(entry.totalSeconds) || 0))
          }))
      : [];

    if (dayKey === todayKey) {
      return { dayKey, trackedSeconds, timerStartedAt, history };
    }

    const nextMidnight = getMontevideoDayStart(dayKey) + 24 * 60 * 60 * 1000;
    const archivedSeconds = timerStartedAt
      ? trackedSeconds + Math.max(0, Math.floor((nextMidnight - timerStartedAt) / 1000))
      : trackedSeconds;

    return {
      dayKey: todayKey,
      trackedSeconds: 0,
      timerStartedAt: timerStartedAt ? now : null,
      history: archivedSeconds > 0 ? mergeBoardTimerHistory(history, { dayKey, totalSeconds: archivedSeconds }) : history
    };
  } catch {
    return { dayKey: todayKey, trackedSeconds: 0, timerStartedAt: null, history: [] };
  }
}

export function getTaskPriority(task: ScrumTask) {
  switch (task.difficulty) {
    case "blue":
      return 0;
    case "red":
      return 1;
    case "yellow":
      return 2;
    case "green":
      return 3;
    default:
      return 9;
  }
}

export function moveTaskStatus(task: ScrumTask, direction: "forward" | "backward" = "forward"): ScrumTask {
  if (direction === "backward") {
    if (task.status === "done") {
      return { ...task, status: "in_progress", completedAt: null, startedAt: task.startedAt || Date.now() };
    }

    if (task.status === "in_progress") {
      return { ...task, status: "todo", startedAt: null, completedAt: null };
    }

    return task;
  }

  if (task.status === "todo") {
    return { ...task, status: "in_progress", startedAt: Date.now(), completedAt: null };
  }

  if (task.status === "in_progress") {
    return { ...task, status: "done", completedAt: Date.now() };
  }

  return task;
}

export function buildCompletedHistory(tasks: ScrumTask[]): CompletedHistoryEntry[] {
  const grouped = new Map<string, CompletedHistoryEntry>();

  tasks
    .filter((task) => task.status === "done" && task.completedAt)
    .sort((left, right) => Number(right.completedAt) - Number(left.completedAt))
    .forEach((task) => {
      const completedAt = task.completedAt || Date.now();
      const dateKey = new Intl.DateTimeFormat("es-UY", {
        timeZone: "America/Montevideo",
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(new Date(completedAt));

      const current = grouped.get(dateKey) || { dateLabel: dateKey, tasks: [] };
      current.tasks.push(task);
      grouped.set(dateKey, current);
    });

  return Array.from(grouped.values());
}

export function addBillingCycle(dateValue: string, frequency: BillingFrequency) {
  const nextDate = new Date(`${dateValue}T00:00:00.000Z`);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + (frequency === "monthly" ? 1 : 6));
  return nextDate.toISOString().slice(0, 10);
}

export function statusLabel(status: TaskStatus) {
  if (status === "todo") {
    return "Pendiente";
  }
  if (status === "in_progress") {
    return "En curso";
  }
  return "Finalizada";
}
