import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../shared/config/api";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskDifficulty = "green" | "yellow" | "red" | "blue";
type TaskDurationUnit = "days" | "weeks" | "months";
type ViewMode = "board" | "history" | "clients";
type BillingFrequency = "monthly" | "semiannual";
type ClientAlertState = "white" | "green" | "yellow" | "red";

type ScrumTask = {
  id: number;
  title: string;
  description?: string | null;
  estimatedMinutes: number;
  createdAt: number;
  durationUnit: TaskDurationUnit;
  durationValue: number;
  difficulty: TaskDifficulty;
  dailyTaskKey?: string | null;
  status: TaskStatus;
  startedAt: number | null;
  completedAt: number | null;
};

type ClientBilling = {
  id: number;
  name: string;
  amount: number;
  frequency: BillingFrequency;
  nextPaymentAt: string;
};

type BoardTimerHistoryEntry = {
  dayKey: string;
  totalSeconds: number;
};

type BoardTimerSnapshot = {
  dayKey: string;
  trackedSeconds: number;
  timerStartedAt: number | null;
  history: BoardTimerHistoryEntry[];
};

const INITIAL_TASKS: ScrumTask[] = [];

const INITIAL_CLIENTS: ClientBilling[] = [];

const BOARD_TIMER_STORAGE_KEY = "frontend-scrum-board-timer";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Tareas para realizar",
  in_progress: "Realizando",
  done: "Finalizadas"
};

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  green: "Verde",
  yellow: "Amarillo",
  red: "Rojo"
  ,
  blue: "Diaria"
};

const DIFFICULTY_STYLES: Record<TaskDifficulty, { accent: string; background: string; text: string }> = {
  green: {
    accent: "#2f9e44",
    background: "#eefaf1",
    text: "#1f6f31"
  },
  yellow: {
    accent: "#d4a017",
    background: "#fff8e6",
    text: "#8f6800"
  },
  red: {
    accent: "#d64545",
    background: "#fff0f0",
    text: "#9e2b2b"
  },
  blue: {
    accent: "#2b6fe8",
    background: "#eef4ff",
    text: "#214fa8"
  }
};

const CLIENT_ALERT_STYLES: Record<ClientAlertState, { background: string; color: string; border: string; label: string }> = {
  white: {
    background: "#ffffff",
    color: "#5f6b80",
    border: "#d7dfeb",
    label: "Normal"
  },
  green: {
    background: "#eefaf1",
    color: "#1f6f31",
    border: "#8ed3a0",
    label: "En mes"
  },
  yellow: {
    background: "#fff8e6",
    color: "#8f6800",
    border: "#f0cf71",
    label: "En semana"
  },
  red: {
    background: "#fff0f0",
    color: "#9e2b2b",
    border: "#efadad",
    label: "Vencido"
  }
};

const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: "Mensual",
  semiannual: "Cada 6 meses"
};

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function getClientAlertState(nextPaymentAt: string, now: number): ClientAlertState {
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

function getClientRelativeLabel(nextPaymentAt: string, now: number) {
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

function getMontevideoDateKey(dateValue: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(dateValue));
}

function getMontevideoDayStart(dayKey: string) {
  return new Date(`${dayKey}T00:00:00-03:00`).getTime();
}

function formatHistoryDay(dayKey: string) {
  return new Intl.DateTimeFormat("es-UY", {
    timeZone: "America/Montevideo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${dayKey}T00:00:00-03:00`));
}

function formatTaskDuration(durationUnit: TaskDurationUnit, durationValue: number) {
  if (durationUnit === "days") {
    return durationValue === 1 ? "1 dia" : `${durationValue} dias`;
  }

  if (durationUnit === "weeks") {
    return durationValue === 1 ? "1 semana" : `${durationValue} semanas`;
  }

  return durationValue === 1 ? "1 mes" : `${durationValue} meses`;
}

function getTaskDueAt(task: ScrumTask, startAt: number) {
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

function formatTaskRemaining(task: ScrumTask, now: number) {
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
    const hourLabel = totalHours === 1 ? "1 hora" : `${totalHours} horas`;
    const minuteLabel = minutes === 1 ? "1 minuto" : `${minutes} minutos`;
    return `Quedan ${hourLabel}:${minuteLabel}`;
  }

  if (totalDays < 7 && task.durationUnit === "days") {
    const dayLabel = totalDays === 1 ? "1 dia" : `${totalDays} dias`;
    const hourLabel = hours === 1 ? "1 hora" : `${hours} horas`;
    const minuteLabel = minutes === 1 ? "1 minuto" : `${minutes} minutos`;
    return `Quedan ${dayLabel}:${hourLabel}:${minuteLabel}`;
  }

  if (totalWeeks > 0) {
    const weekLabel = totalWeeks === 1 ? "1 semana" : `${totalWeeks} semanas`;
    const dayLabel = days === 1 ? "1 dia" : `${days} dias`;
    const hourLabel = hours === 1 ? "1 hora" : `${hours} horas`;
    const minuteLabel = minutes === 1 ? "1 minuto" : `${minutes} minutos`;
    return `Quedan ${weekLabel} ${dayLabel}:${hourLabel}:${minuteLabel}`;
  }

  const dayLabel = totalDays === 1 ? "1 dia" : `${totalDays} dias`;
  const hourLabel = hours === 1 ? "1 hora" : `${hours} horas`;
  const minuteLabel = minutes === 1 ? "1 minuto" : `${minutes} minutos`;
  return `Quedan ${dayLabel}:${hourLabel}:${minuteLabel}`;
}

function formatTrackedTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  return `${hours}:${paddedMinutes}:${paddedSeconds}`;
}

function formatTrackedTimeWithMilliseconds(totalMilliseconds: number) {
  const safeMilliseconds = Math.max(0, Math.floor(totalMilliseconds));
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = safeMilliseconds % 1000;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function formatTrackedTimeSummary(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

function mergeBoardTimerHistory(history: BoardTimerHistoryEntry[], entry: BoardTimerHistoryEntry) {
  const nextHistory = [...history];
  const existingIndex = nextHistory.findIndex((currentEntry) => currentEntry.dayKey === entry.dayKey);

  if (existingIndex >= 0) {
    nextHistory[existingIndex] = entry;
  } else {
    nextHistory.push(entry);
  }

  return nextHistory.sort((left, right) => right.dayKey.localeCompare(left.dayKey));
}

function getInitialBoardTimerState(now: number): BoardTimerSnapshot {
  const todayKey = getMontevideoDateKey(now);

  if (typeof window === "undefined") {
    return {
      dayKey: todayKey,
      trackedSeconds: 0,
      timerStartedAt: null,
      history: []
    };
  }

  try {
    const rawSnapshot = window.localStorage.getItem(BOARD_TIMER_STORAGE_KEY);
    if (!rawSnapshot) {
      return {
        dayKey: todayKey,
        trackedSeconds: 0,
        timerStartedAt: null,
        history: []
      };
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
    return {
      dayKey: todayKey,
      trackedSeconds: 0,
      timerStartedAt: null,
      history: []
    };
  }
}

function getTaskPriority(task: ScrumTask) {
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

function moveTaskStatus(task: ScrumTask): ScrumTask {
  if (task.status === "todo") {
    return {
      ...task,
      status: "in_progress",
      startedAt: Date.now(),
      completedAt: null
    };
  }

  if (task.status === "in_progress") {
    return {
      ...task,
      status: "done",
      completedAt: Date.now()
    };
  }

  return task;
}

export function ScrumHomePage() {
  const [tasks, setTasks] = useState<ScrumTask[]>(INITIAL_TASKS);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationUnit, setDurationUnit] = useState<TaskDurationUnit>("days");
  const [durationValue, setDurationValue] = useState("1");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("green");
  const [now, setNow] = useState(() => Date.now());
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [clients, setClients] = useState<ClientBilling[]>(INITIAL_CLIENTS);
  const [expandedClientId, setExpandedClientId] = useState<number | null>(INITIAL_CLIENTS[0]?.id ?? null);
  const [clientName, setClientName] = useState("");
  const [clientAmount, setClientAmount] = useState("");
  const [clientFrequency, setClientFrequency] = useState<BillingFrequency>("monthly");
  const [clientNextPaymentAt, setClientNextPaymentAt] = useState("2026-08-05");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingDurationUnit, setEditingDurationUnit] = useState<TaskDurationUnit>("days");
  const [editingDurationValue, setEditingDurationValue] = useState("1");
  const [boardTimerState, setBoardTimerState] = useState(() => getInitialBoardTimerState(Date.now()));
  const currentDayKey = getMontevideoDateKey(now);
  const boardElapsedSeconds =
    boardTimerState.trackedSeconds +
    (boardTimerState.timerStartedAt ? Math.max(0, Math.floor((now - boardTimerState.timerStartedAt) / 1000)) : 0);
  const boardElapsedMilliseconds =
    boardTimerState.trackedSeconds * 1000 +
    (boardTimerState.timerStartedAt ? Math.max(0, now - boardTimerState.timerStartedAt) : 0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setIsLoadingWorkspace(true);
        const response = await requestJson<{ ok: boolean; tasks: ScrumTask[]; clients: ClientBilling[] }>("/scrum/workspace");
        setTasks(response.tasks || []);
        setClients(response.clients || []);
        setExpandedClientId((response.clients || [])[0]?.id ?? null);
        setFeedbackMessage(null);
      } catch {
        setFeedbackMessage("No se pudo cargar la informacion de Scrum.");
      } finally {
        setIsLoadingWorkspace(false);
      }
    }

    void loadWorkspace();
  }, [currentDayKey]);

  useEffect(() => {
    if (boardTimerState.dayKey === currentDayKey) {
      return;
    }

    const archivedSeconds = boardTimerState.timerStartedAt
      ? boardTimerState.trackedSeconds + Math.max(0, Math.floor((now - boardTimerState.timerStartedAt) / 1000))
      : boardTimerState.trackedSeconds;

    setBoardTimerState((currentState) => ({
      dayKey: currentDayKey,
      trackedSeconds: 0,
      timerStartedAt: currentState.timerStartedAt ? now : null,
      history:
        archivedSeconds > 0
          ? mergeBoardTimerHistory(currentState.history, {
              dayKey: currentState.dayKey,
              totalSeconds: archivedSeconds
            })
          : currentState.history
    }));
  }, [boardTimerState.dayKey, boardTimerState.timerStartedAt, boardTimerState.trackedSeconds, currentDayKey, now]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      BOARD_TIMER_STORAGE_KEY,
      JSON.stringify({
        dayKey: boardTimerState.dayKey,
        trackedSeconds: boardTimerState.trackedSeconds,
        timerStartedAt: boardTimerState.timerStartedAt,
        history: boardTimerState.history
      } satisfies BoardTimerSnapshot)
    );
  }, [boardTimerState]);

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo").sort((left, right) => getTaskPriority(left) - getTaskPriority(right)),
      in_progress: tasks
        .filter((task) => task.status === "in_progress")
        .sort((left, right) => getTaskPriority(left) - getTaskPriority(right)),
      done: tasks.filter((task) => task.status === "done").sort((left, right) => getTaskPriority(left) - getTaskPriority(right))
    }),
    [tasks]
  );

  const completedHistory = useMemo(() => {
    const grouped = new Map<
      string,
      {
        dateLabel: string;
        tasks: ScrumTask[];
      }
    >();

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
  }, [tasks]);

  const boardTimerHistory = useMemo(
    () =>
      boardTimerState.history.map((entry) => ({
        ...entry,
        dateLabel: formatHistoryDay(entry.dayKey)
      })),
    [boardTimerState.history]
  );

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const parsedDurationValue = Number(durationValue);
    if (!normalizedTitle || !Number.isFinite(parsedDurationValue) || parsedDurationValue <= 0) {
      return;
    }

    if (durationUnit === "days" && parsedDurationValue > 6) {
      setFeedbackMessage("Si usas dias, la cantidad maxima es 6.");
      return;
    }

    if (durationUnit === "weeks" && parsedDurationValue > 4) {
      setFeedbackMessage("Si usas semanas, la cantidad maxima es 4.");
      return;
    }

    try {
      const response = await requestJson<{ ok: boolean; item: ScrumTask }>("/scrum/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: normalizedTitle,
          description: description.trim() || undefined,
          durationUnit,
          durationValue: Math.round(parsedDurationValue),
          difficulty
        })
      });

      setTasks((currentTasks) => [response.item, ...currentTasks]);
      setTitle("");
      setDescription("");
      setDurationUnit("days");
      setDurationValue("1");
      setDifficulty("green");
      setFeedbackMessage(null);
    } catch {
      setFeedbackMessage("No se pudo crear la tarea.");
    }
  }

  async function handleAdvanceTask(taskId: number) {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const nextTask = moveTaskStatus(currentTask);

    try {
      const response = await requestJson<{ ok: boolean; item: ScrumTask }>(`/scrum/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextTask.status,
          startedAt: nextTask.startedAt ? new Date(nextTask.startedAt).toISOString() : null,
          completedAt: nextTask.completedAt ? new Date(nextTask.completedAt).toISOString() : null
        })
      });

      setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? response.item : task)));
      setFeedbackMessage(null);
    } catch {
      setFeedbackMessage("No se pudo actualizar la tarea.");
    }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      await requestJson<{ ok: boolean }>(`/scrum/tasks/${taskId}`, {
        method: "DELETE"
      });
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      setFeedbackMessage(null);
    } catch {
      setFeedbackMessage("No se pudo borrar la tarea.");
    }
  }

  async function handleUpdateTaskDuration(taskId: number) {
    const parsedDurationValue = Number(editingDurationValue);
    if (!Number.isFinite(parsedDurationValue) || parsedDurationValue <= 0) {
      setFeedbackMessage("El plazo tiene que ser mayor a 0.");
      return;
    }

    if (editingDurationUnit === "days" && parsedDurationValue > 6) {
      setFeedbackMessage("Si usas dias, la cantidad maxima es 6.");
      return;
    }

    if (editingDurationUnit === "weeks" && parsedDurationValue > 4) {
      setFeedbackMessage("Si usas semanas, la cantidad maxima es 4.");
      return;
    }

    try {
      const response = await requestJson<{ ok: boolean; item: ScrumTask }>(`/scrum/tasks/${taskId}/duration`, {
        method: "PATCH",
        body: JSON.stringify({
          durationUnit: editingDurationUnit,
          durationValue: Math.round(parsedDurationValue)
        })
      });

      setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? response.item : task)));
      setEditingTaskId(null);
      setFeedbackMessage(null);
    } catch {
      setFeedbackMessage("No se pudo actualizar el plazo.");
    }
  }

  async function handleRegisterClientPayment(clientId: number) {
    try {
      const response = await requestJson<{ ok: boolean; item: ClientBilling }>(`/scrum/clients/${clientId}/payment`, {
        method: "PATCH"
      });

      setClients((currentClients) =>
        currentClients.map((client) => (client.id === clientId ? response.item : client))
      );
      setFeedbackMessage(null);
    } catch {
      setFeedbackMessage("No se pudo registrar el pago.");
    }
  }

  async function handleDeleteClient(clientId: number) {
    try {
      await requestJson<{ ok: boolean }>(`/scrum/clients/${clientId}`, {
        method: "DELETE"
      });
      setClients((currentClients) => currentClients.filter((client) => client.id !== clientId));
      setExpandedClientId((currentExpandedId) => (currentExpandedId === clientId ? null : currentExpandedId));
      setFeedbackMessage(null);
    } catch {
      setFeedbackMessage("No se pudo borrar el cliente.");
    }
  }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = clientName.trim();
    const parsedAmount = Number(clientAmount);
    if (!normalizedName || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !clientNextPaymentAt) {
      return;
    }

    try {
      const response = await requestJson<{ ok: boolean; item: ClientBilling }>("/scrum/clients", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          amount: Math.round(parsedAmount),
          frequency: clientFrequency,
          nextPaymentAt: clientNextPaymentAt
        })
      });

      setClients((currentClients) => [response.item, ...currentClients]);
      setExpandedClientId(response.item.id);
      setClientName("");
      setClientAmount("");
      setClientFrequency("monthly");
      setClientNextPaymentAt("2026-08-05");
      setFeedbackMessage(null);
    } catch {
      setFeedbackMessage("No se pudo crear el cliente.");
    }
  }

  function handleBoardTimerToggle() {
    if (boardTimerState.timerStartedAt) {
      const totalWorkedSeconds =
        boardTimerState.trackedSeconds + Math.max(0, Math.floor((Date.now() - boardTimerState.timerStartedAt) / 1000));
      setBoardTimerState((currentState) => ({
        ...currentState,
        trackedSeconds: totalWorkedSeconds,
        timerStartedAt: null
      }));
      setFeedbackMessage(`Tiempo trabajado total: ${formatTrackedTime(totalWorkedSeconds)}`);
      return;
    }

    setBoardTimerState((currentState) => ({
      ...currentState,
      timerStartedAt: Date.now()
    }));
    setFeedbackMessage(null);
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>Scrum</h1>
          </div>
          <div style={boardTimerBlockStyle}>
            <div style={boardTimerWrapStyle}>
              <button
                type="button"
                onClick={handleBoardTimerToggle}
                style={boardTimerButtonStyle(Boolean(boardTimerState.timerStartedAt))}
              >
                {boardTimerState.timerStartedAt ? "Detener cronometro" : "Iniciar cronometro"}
              </button>
            </div>
            <div style={boardTimerPanelStyle}>
              <span style={boardTimerCaptionStyle}>{boardTimerState.timerStartedAt ? "En vivo" : "Resultado de hoy"}</span>
              <span style={boardTimerValueStyle}>
                {boardTimerState.timerStartedAt
                  ? formatTrackedTimeWithMilliseconds(boardElapsedMilliseconds)
                  : formatTrackedTimeSummary(boardElapsedSeconds)}
              </span>
            </div>
          </div>
          {feedbackMessage ? <p style={noticeStyle}>{feedbackMessage}</p> : null}
        </div>
        <div style={headerTabsAlignStyle}>
          <section style={tabsWrapStyle}>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              style={tabButtonStyle(viewMode === "board")}
            >
              Tablero
            </button>
            <button
              type="button"
              onClick={() => setViewMode("history")}
              style={tabButtonStyle(viewMode === "history")}
            >
              Historial
            </button>
            <button
              type="button"
              onClick={() => setViewMode("clients")}
              style={tabButtonStyle(viewMode === "clients")}
            >
              Clientes
            </button>
          </section>
        </div>
      </section>

      {isLoadingWorkspace ? (
        <section style={loadingPanelStyle}>
          <p style={emptyStateStyle}>Cargando tareas y clientes...</p>
        </section>
      ) : null}

      {!isLoadingWorkspace && viewMode === "board" ? (
      <section style={controlStripStyle}>
        <form onSubmit={handleCreateTask} style={formGridStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="task-title">
              Nombre
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nueva tarea"
              style={inputStyle}
            />
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
            <select
              id="task-difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as TaskDifficulty)}
              style={inputStyle}
            >
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
      ) : null}

      {!isLoadingWorkspace && viewMode === "board" ? (
        <section style={boardStyle}>
          {(["todo", "in_progress", "done"] as TaskStatus[]).map((statusKey) => (
            <section key={statusKey} style={columnStyle}>
              <header style={columnHeaderStyle}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ fontSize: 17 }}>{STATUS_LABELS[statusKey]}</strong>
                  <span style={columnCaptionStyle}>
                    {statusKey === "todo"
                      ? "Pendientes para empezar"
                      : statusKey === "in_progress"
                        ? "Tareas en curso"
                        : "Tareas cerradas"}
                  </span>
                </div>
                <span style={counterStyle}>{groupedTasks[statusKey].length}</span>
              </header>

              <div style={taskListStyle}>
                {groupedTasks[statusKey].length === 0 ? <p style={emptyStateStyle}>Sin tareas en esta columna.</p> : null}

                {groupedTasks[statusKey].map((task) => {
                  const difficultyStyle = DIFFICULTY_STYLES[task.difficulty];
                  const canAdvance = task.status !== "done";
                  const expanded = expandedTaskId === task.id;

                  return (
                    <article
                      key={task.id}
                      style={{
                        ...taskCardStyle,
                        borderLeft: `5px solid ${difficultyStyle.accent}`,
                        background: difficultyStyle.background
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                        style={taskRowButtonStyle}
                      >
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
                              <span style={metaChipStyle}>
                                Plazo: {formatTaskDuration(task.durationUnit, task.durationValue)}
                              </span>
                            </div>
                            <span
                              style={{
                                ...difficultyBadgeStyle,
                                background: difficultyStyle.accent,
                                color: "#ffffff"
                              }}
                            >
                              {DIFFICULTY_LABELS[task.difficulty]}
                            </span>
                          </div>

                          <div style={taskFooterStyle}>
                            <span style={statusPillStyle(task.status)}>
                              {task.status === "todo" ? "Pendiente" : task.status === "in_progress" ? "En curso" : "Finalizada"}
                            </span>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTaskId(task.id);
                                  setEditingDurationUnit(task.durationUnit);
                                  setEditingDurationValue(String(task.durationValue));
                                }}
                                style={secondaryButtonStyle}
                              >
                                Editar
                              </button>
                              {canAdvance ? (
                                <button type="button" onClick={() => handleAdvanceTask(task.id)} style={advanceButtonStyle}>
                                  {task.status === "todo" ? "Mover a realizando >" : "Mover a finalizadas >"}
                                </button>
                              ) : null}
                              {task.status === "done" ? (
                                <button type="button" onClick={() => handleDeleteTask(task.id)} style={deleteButtonStyle}>
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
      ) : !isLoadingWorkspace ? (
        viewMode === "history" ? (
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
              {boardTimerHistory.length === 0 ? (
                <p style={emptyStateStyle}>Todavia no hay dias guardados en el cronometro.</p>
              ) : null}

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
                            ...difficultyBadgeStyle,
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
        ) : (
          <section style={historyPanelStyle}>
            <header style={historyHeaderStyle}>
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ fontSize: 18 }}>Clientes</strong>
                <span style={columnCaptionStyle}>Seguimiento de cobro segun frecuencia y proximidad del proximo pago.</span>
              </div>
            </header>

            <section style={clientCreatePanelStyle}>
              <form onSubmit={handleCreateClient} style={clientFormGridStyle}>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle} htmlFor="client-name">
                    Nombre
                  </label>
                  <input
                    id="client-name"
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Nombre del cliente"
                    style={inputStyle}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle} htmlFor="client-amount">
                    Monto
                  </label>
                  <input
                    id="client-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={clientAmount}
                    onChange={(event) => setClientAmount(event.target.value)}
                    placeholder="4500"
                    style={inputStyle}
                  />
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle} htmlFor="client-frequency">
                    Frecuencia
                  </label>
                  <select
                    id="client-frequency"
                    value={clientFrequency}
                    onChange={(event) => setClientFrequency(event.target.value as BillingFrequency)}
                    style={inputStyle}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="semiannual">Cada 6 meses</option>
                  </select>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle} htmlFor="client-next-payment">
                    Proximo pago
                  </label>
                  <input
                    id="client-next-payment"
                    type="date"
                    value={clientNextPaymentAt}
                    onChange={(event) => setClientNextPaymentAt(event.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={formActionsStyle}>
                  <button type="submit" style={primaryButtonStyle}>
                    Crear cliente
                  </button>
                </div>
              </form>
            </section>

            <div style={clientGridStyle}>
              {clients.length === 0 ? <p style={emptyStateStyle}>Todavia no hay clientes cargados.</p> : null}

              {clients.map((client) => {
                const alertState = getClientAlertState(client.nextPaymentAt, now);
                const alertStyle = CLIENT_ALERT_STYLES[alertState];
                const expanded = expandedClientId === client.id;

                return (
                  <article
                    key={client.id}
                    style={clientCardStyle}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedClientId(expanded ? null : client.id)}
                      style={clientRowButtonStyle}
                    >
                      <strong style={{ fontSize: 16 }}>{client.name}</strong>
                      <span
                        style={{
                          ...clientStatusBadgeStyle,
                          background: alertStyle.background,
                          color: alertStyle.color,
                          border: `1px solid ${alertStyle.border}`
                        }}
                      >
                        {alertStyle.label}
                      </span>
                    </button>

                    {expanded ? (
                      <div style={clientDetailsStyle}>
                        <div style={clientMetaGridStyle}>
                          <span style={clientPrimaryValueStyle}>{formatCurrency(client.amount)}</span>
                          <span style={metaChipStyle}>{BILLING_FREQUENCY_LABELS[client.frequency]}</span>
                        </div>

                        <div style={clientFooterStyle}>
                          <span style={metaChipStyle}>Proximo pago: {formatDate(client.nextPaymentAt)}</span>
                          <span style={{ ...metaChipStyle, color: alertStyle.color, fontWeight: 700 }}>
                            {getClientRelativeLabel(client.nextPaymentAt, now)}
                          </span>
                        </div>

                        <div style={clientActionsStyle}>
                          <button
                            type="button"
                            onClick={() => handleRegisterClientPayment(client.id)}
                            style={secondaryButtonStyle}
                          >
                            Registrar pago
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(client.id)}
                            style={deleteButtonStyle}
                          >
                            Eliminar cliente
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )
      ) : null}

      {editingTaskId ? (
        <div style={modalOverlayStyle} onClick={() => setEditingTaskId(null)}>
          <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <strong style={{ fontSize: 18 }}>Editar plazo</strong>
              <button type="button" onClick={() => setEditingTaskId(null)} style={modalCloseButtonStyle}>
                Cerrar
              </button>
            </div>

            <div style={taskDurationEditorStyle}>
              <select
                value={editingDurationUnit}
                onChange={(event) => setEditingDurationUnit(event.target.value as TaskDurationUnit)}
                style={compactInputStyle}
              >
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
              <button type="button" onClick={() => handleUpdateTaskDuration(editingTaskId)} style={primaryButtonStyle}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "20px",
  background: "#f3f6fb",
  color: "#162033",
  fontFamily: "Inter, Segoe UI, sans-serif",
  display: "grid",
  gap: 20
};

const heroStyle: React.CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)",
  gap: 20,
  alignItems: "center"
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 44px)",
  lineHeight: 1.05
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 16,
  flexWrap: "wrap"
};

const boardTimerBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "start"
};

const boardTimerWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-start"
};

const boardTimerPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
  justifyItems: "start"
};

const boardTimerCaptionStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#5f6b80",
  textTransform: "uppercase"
};

const boardTimerValueStyle: React.CSSProperties = {
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

const boardTimerSummaryStyle: React.CSSProperties = {
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

const noticeStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "#44526b"
};

const loadingPanelStyle: React.CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto"
};

const headerTabsAlignStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end"
};

const controlStripStyle: React.CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 18,
  display: "grid",
  gap: 14
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1.6fr) minmax(220px, 1.8fr) minmax(180px, 1fr) minmax(240px, 1.2fr) auto",
  gap: 14,
  alignItems: "end"
};

const fieldGroupStyle: React.CSSProperties = {
  display: "grid",
  gap: 8
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#44526b"
};

const inputStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #cfd8e6",
  background: "#ffffff",
  color: "#162033",
  fontSize: 14
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  alignSelf: "end"
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "0 16px",
  border: "none",
  borderRadius: 8,
  background: "#1f4ed8",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer"
};

function boardTimerButtonStyle(running: boolean): React.CSSProperties {
  return {
    minHeight: 42,
    padding: "0 16px",
    border: "none",
    borderRadius: 8,
    background: running ? "#d64545" : "#1f4ed8",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer"
  };
}

const tabsWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap"
};

function tabButtonStyle(active: boolean): React.CSSProperties {
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

const boardStyle: React.CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  alignItems: "start"
};

const columnStyle: React.CSSProperties = {
  minHeight: 520,
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 16,
  display: "grid",
  gap: 14,
  alignContent: "start"
};

const columnHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 12
};

const columnCaptionStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "#6a7891"
};

const counterStyle: React.CSSProperties = {
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

const taskListStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  alignContent: "start"
};

const emptyStateStyle: React.CSSProperties = {
  margin: 0,
  padding: "16px 14px",
  border: "1px dashed #d6deea",
  borderRadius: 8,
  color: "#6a7891",
  fontSize: 14
};

const taskCardStyle: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid #dfe6f2",
  padding: 14,
  display: "grid",
  gap: 12
};

const taskHeaderStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "start",
  justifyContent: "space-between"
};

const taskRowButtonStyle: React.CSSProperties = {
  display: "flex",
  width: "100%",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textAlign: "left"
};

const taskTitleStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.45
};

const taskDescriptionStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "#5b6982"
};

const difficultyBadgeStyle: React.CSSProperties = {
  minHeight: 24,
  padding: "0 10px",
  borderRadius: 999,
  display: "inline-grid",
  placeItems: "center",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap"
};

const metaChipStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#30415d",
  lineHeight: 1.5
};

const taskFooterStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap"
};

const taskDetailsStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  paddingTop: 10,
  borderTop: "1px solid rgba(22, 32, 51, 0.08)"
};

const durationInlineStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(120px, 1fr) minmax(90px, 100px)",
  gap: 10,
  alignItems: "center"
};

const taskDurationEditorStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(120px, 160px) minmax(80px, 100px) auto",
  gap: 10,
  alignItems: "center"
};

const compactInputStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 38
};

const compactNumberInputStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 38,
  width: "100%"
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  display: "grid",
  placeItems: "center",
  padding: 20,
  zIndex: 1000
};

const modalCardStyle: React.CSSProperties = {
  width: "min(520px, 100%)",
  background: "#ffffff",
  borderRadius: 8,
  border: "1px solid #d7dfeb",
  padding: 18,
  display: "grid",
  gap: 16
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12
};

const modalCloseButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #cfd8e6",
  background: "#ffffff",
  color: "#162033",
  fontWeight: 700,
  cursor: "pointer"
};

function statusPillStyle(status: TaskStatus): React.CSSProperties {
  if (status === "done") {
    return {
      minHeight: 28,
      padding: "0 10px",
      borderRadius: 999,
      background: "#eaf8ee",
      color: "#1f6f31",
      display: "inline-grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 800
    };
  }

  if (status === "in_progress") {
    return {
      minHeight: 28,
      padding: "0 10px",
      borderRadius: 999,
      background: "#eef4ff",
      color: "#2247b5",
      display: "inline-grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 800
    };
  }

  return {
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#f4f6fa",
    color: "#56647d",
    display: "inline-grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 800
  };
}

const advanceButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  border: "none",
  borderRadius: 8,
  background: "#162033",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer"
};

const deleteButtonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  border: "1px solid #e3bcbc",
  borderRadius: 8,
  background: "#fff5f5",
  color: "#9e2b2b",
  fontWeight: 700,
  cursor: "pointer"
};

const historyPanelStyle: React.CSSProperties = {
  width: "min(1240px, 100%)",
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 18,
  display: "grid",
  gap: 16
};

const timerHistoryPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
  padding: 18,
  background: "#f8fbff",
  border: "1px solid #d7dfeb",
  borderRadius: 8
};

const timerHistoryHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
};

const historyHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
};

const historyListStyle: React.CSSProperties = {
  display: "grid",
  gap: 14
};

const historyCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f3",
  borderRadius: 8,
  padding: 16,
  display: "grid",
  gap: 12,
  background: "#fbfcff"
};

const historyDayHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
};

const historyTaskListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10
};

const historyTaskRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 0",
  borderTop: "1px solid #e8edf5"
};

const clientGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 12
};

const clientCreatePanelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 16,
  display: "grid",
  gap: 14
};

const clientFormGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 2fr) minmax(140px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr) auto",
  gap: 14,
  alignItems: "end"
};

const clientCardStyle: React.CSSProperties = {
  border: "1px solid #d7dfeb",
  borderRadius: 8,
  padding: 14,
  display: "grid",
  gap: 12,
  background: "#ffffff"
};

const clientRowButtonStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textAlign: "left"
};

const clientStatusBadgeStyle: React.CSSProperties = {
  minHeight: 26,
  padding: "0 10px",
  borderRadius: 999,
  display: "inline-grid",
  placeItems: "center",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap"
};

const clientDetailsStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  paddingTop: 10,
  borderTop: "1px solid #e2e8f3"
};

const clientActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap"
};

const clientMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 6
};

const clientPrimaryValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  lineHeight: 1
};

const clientFooterStyle: React.CSSProperties = {
  display: "grid",
  gap: 6
};

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 8,
  border: "1px solid #cfd8e6",
  background: "#ffffff",
  color: "#162033",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer"
};
