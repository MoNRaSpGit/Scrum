import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ScrumBoardView } from "./components/ScrumBoardView";
import { ScrumClientsView } from "./components/ScrumClientsView";
import { ScrumDurationModal } from "./components/ScrumDurationModal";
import { ScrumHeader } from "./components/ScrumHeader";
import { ScrumHistoryView } from "./components/ScrumHistoryView";
import { requestJson } from "./scrum.api";
import { loadingPanelStyle, pageStyle, emptyStateStyle } from "./scrum.styles";
import {
  INITIAL_CLIENTS,
  INITIAL_TASKS,
  type BoardTimerHistoryDisplayEntry,
  type ClientBilling,
  type ScrumTask,
  type TaskDifficulty,
  type TaskDurationUnit,
  type ViewMode
} from "./scrum.types";
import {
  buildCompletedHistory,
  formatHistoryDay,
  formatTrackedTime,
  getInitialBoardTimerState,
  getMontevideoDateKey,
  getTaskPriority,
  mergeBoardTimerHistory,
  moveTaskStatus
} from "./scrum.utils";

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
  const [clientDebtAmount, setClientDebtAmount] = useState("");
  const [clientFrequency, setClientFrequency] = useState<"monthly" | "semiannual">("monthly");
  const [clientNextPaymentAt, setClientNextPaymentAt] = useState("2026-08-05");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingDifficulty, setEditingDifficulty] = useState<TaskDifficulty>("green");
  const [editingDurationUnit, setEditingDurationUnit] = useState<TaskDurationUnit>("days");
  const [editingDurationValue, setEditingDurationValue] = useState("1");
  const [boardTimerState, setBoardTimerState] = useState(() => getInitialBoardTimerState(Date.now()));

  const currentDayKey = getMontevideoDateKey(now);
  const boardElapsedSeconds =
    boardTimerState.trackedSeconds +
    (boardTimerState.timerStartedAt ? Math.max(0, Math.floor((now - boardTimerState.timerStartedAt) / 1000)) : 0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
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
    window.localStorage.setItem(
      "frontend-scrum-board-timer",
      JSON.stringify({
        dayKey: boardTimerState.dayKey,
        trackedSeconds: boardTimerState.trackedSeconds,
        timerStartedAt: boardTimerState.timerStartedAt,
        history: boardTimerState.history
      })
    );
  }, [boardTimerState]);

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo").sort((left, right) => getTaskPriority(left) - getTaskPriority(right)),
      in_progress: tasks.filter((task) => task.status === "in_progress").sort((left, right) => getTaskPriority(left) - getTaskPriority(right)),
      done: tasks.filter((task) => task.status === "done").sort((left, right) => getTaskPriority(left) - getTaskPriority(right))
    }),
    [tasks]
  );

  const completedHistory = useMemo(() => buildCompletedHistory(tasks), [tasks]);

  const boardTimerHistory = useMemo<BoardTimerHistoryDisplayEntry[]>(
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
      toast.error("Si usas dias, la cantidad maxima es 6.");
      return;
    }
    if (durationUnit === "weeks" && parsedDurationValue > 4) {
      toast.error("Si usas semanas, la cantidad maxima es 4.");
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
      toast.success("Tarea creada.");
    } catch {
      toast.error("No se pudo crear la tarea.");
    }
  }

  async function handleMoveTask(taskId: number, direction: "forward" | "backward") {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const nextTask = moveTaskStatus(currentTask, direction);

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
      if (direction === "backward") {
        toast.success(nextTask.status === "todo" ? "Tarea devuelta a pendientes." : "Tarea devuelta a realizando.");
      } else {
        toast.success(nextTask.status === "in_progress" ? "Tarea movida a realizando." : "Tarea movida a finalizadas.");
      }
    } catch {
      toast.error("No se pudo actualizar la tarea.");
    }
  }

  async function handleDeleteTask(taskId: number) {
    try {
      await requestJson<{ ok: boolean }>(`/scrum/tasks/${taskId}`, { method: "DELETE" });
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      toast.success("Tarea eliminada.");
    } catch {
      toast.error("No se pudo borrar la tarea.");
    }
  }

  async function handleUpdateTaskDuration(taskId: number) {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const parsedDurationValue = Number(editingDurationValue);
    const durationChanged = editingDurationUnit !== currentTask.durationUnit || Math.round(parsedDurationValue) !== currentTask.durationValue;
    const difficultyChanged = editingDifficulty !== currentTask.difficulty;

    if (!durationChanged && !difficultyChanged) {
      setEditingTaskId(null);
      return;
    }

    try {
      if (durationChanged) {
        if (!Number.isFinite(parsedDurationValue) || parsedDurationValue <= 0) {
          toast.error("El plazo tiene que ser mayor a 0.");
          return;
        }
        if (editingDurationUnit === "days" && parsedDurationValue > 6) {
          toast.error("Si usas dias, la cantidad maxima es 6.");
          return;
        }
        if (editingDurationUnit === "weeks" && parsedDurationValue > 4) {
          toast.error("Si usas semanas, la cantidad maxima es 4.");
          return;
        }
      }

      const response = durationChanged
        ? await requestJson<{ ok: boolean; item: ScrumTask }>(`/scrum/tasks/${taskId}/duration`, {
            method: "PATCH",
            body: JSON.stringify({
              durationUnit: editingDurationUnit,
              durationValue: Math.round(parsedDurationValue)
            })
          })
        : await requestJson<{ ok: boolean; item: ScrumTask }>(`/scrum/tasks/${taskId}/difficulty`, {
            method: "PATCH",
            body: JSON.stringify({
              difficulty: editingDifficulty
            })
          });

      setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? response.item : task)));
      setEditingTaskId(null);
      toast.success(durationChanged ? "Plazo actualizado." : "Color actualizado.");
    } catch {
      toast.error(durationChanged ? "No se pudo actualizar el plazo." : "No se pudo actualizar el color.");
    }
  }

  async function handleRegisterClientPayment(clientId: number) {
    try {
      const response = await requestJson<{ ok: boolean; item: ClientBilling }>(`/scrum/clients/${clientId}/payment`, { method: "PATCH" });
      setClients((currentClients) => currentClients.map((client) => (client.id === clientId ? response.item : client)));
      toast.success("Pago registrado.");
    } catch {
      toast.error("No se pudo registrar el pago.");
    }
  }

  async function handleRegisterClientDebtPayment(clientId: number, amountInput: string) {
    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Ingresa un monto valido mayor a 0.");
      return;
    }

    try {
      const response = await requestJson<{ ok: boolean; item: ClientBilling }>(`/scrum/clients/${clientId}/debt-payment`, {
        method: "PATCH",
        body: JSON.stringify({ amount: parsedAmount })
      });
      setClients((currentClients) => currentClients.map((client) => (client.id === clientId ? response.item : client)));
      toast.success("Pago de deuda registrado.");
    } catch {
      toast.error("No se pudo registrar el pago de deuda.");
    }
  }

  async function handleDeleteClient(clientId: number) {
    try {
      await requestJson<{ ok: boolean }>(`/scrum/clients/${clientId}`, { method: "DELETE" });
      setClients((currentClients) => currentClients.filter((client) => client.id !== clientId));
      setExpandedClientId((currentExpandedId) => (currentExpandedId === clientId ? null : currentExpandedId));
      toast.success("Cliente eliminado.");
    } catch {
      toast.error("No se pudo borrar el cliente.");
    }
  }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = clientName.trim();
    const parsedAmount = Number(clientAmount);
    const trimmedDebtAmount = clientDebtAmount.trim();
    const parsedDebtAmount = trimmedDebtAmount ? Number(trimmedDebtAmount) : null;

    if (!normalizedName || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !clientNextPaymentAt) {
      return;
    }
    if (trimmedDebtAmount && (!Number.isFinite(parsedDebtAmount) || (parsedDebtAmount as number) < 0)) {
      toast.error("El monto adeudado tiene que ser un numero valido.");
      return;
    }

    try {
      const response = await requestJson<{ ok: boolean; item: ClientBilling }>("/scrum/clients", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          amount: Math.round(parsedAmount),
          frequency: clientFrequency,
          nextPaymentAt: clientNextPaymentAt,
          debtAmount: parsedDebtAmount !== null ? Math.round(parsedDebtAmount) : undefined
        })
      });

      setClients((currentClients) => [response.item, ...currentClients]);
      setExpandedClientId(response.item.id);
      setClientName("");
      setClientAmount("");
      setClientDebtAmount("");
      setClientFrequency("monthly");
      setClientNextPaymentAt("2026-08-05");
      toast.success("Cliente creado.");
    } catch {
      toast.error("No se pudo crear el cliente.");
    }
  }

  function handleBoardTimerToggle() {
    if (boardTimerState.timerStartedAt) {
      const totalWorkedSeconds = boardTimerState.trackedSeconds + Math.max(0, Math.floor((Date.now() - boardTimerState.timerStartedAt) / 1000));
      setBoardTimerState((currentState) => ({ ...currentState, trackedSeconds: totalWorkedSeconds, timerStartedAt: null }));
      setFeedbackMessage(`Tiempo trabajado total: ${formatTrackedTime(totalWorkedSeconds)}`);
      return;
    }

    setBoardTimerState((currentState) => ({ ...currentState, timerStartedAt: Date.now() }));
    setFeedbackMessage(null);
  }

  function handleOpenEditTask(task: ScrumTask) {
    setEditingTaskId(task.id);
    setEditingDurationUnit(task.durationUnit);
    setEditingDurationValue(String(task.durationValue));
    setEditingDifficulty(task.difficulty);
  }

  return (
    <main style={pageStyle}>
      <ScrumHeader
        boardTimerRunning={Boolean(boardTimerState.timerStartedAt)}
        boardTimerValue={formatTrackedTime(boardElapsedSeconds)}
        feedbackMessage={feedbackMessage}
        onToggleBoardTimer={handleBoardTimerToggle}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {isLoadingWorkspace ? (
        <section style={loadingPanelStyle}>
          <p style={emptyStateStyle}>Cargando tareas y clientes...</p>
        </section>
      ) : null}

      {!isLoadingWorkspace && viewMode === "board" ? (
        <ScrumBoardView
          description={description}
          difficulty={difficulty}
          durationUnit={durationUnit}
          durationValue={durationValue}
          expandedTaskId={expandedTaskId}
        groupedTasks={groupedTasks}
        now={now}
        onAdvanceTask={handleMoveTask}
        onCreateTask={handleCreateTask}
        onDeleteTask={handleDeleteTask}
        onOpenEditTask={handleOpenEditTask}
          setDescription={setDescription}
          setDifficulty={setDifficulty}
          setDurationUnit={setDurationUnit}
          setDurationValue={setDurationValue}
          setExpandedTaskId={setExpandedTaskId}
          setTitle={setTitle}
          title={title}
        />
      ) : null}

      {!isLoadingWorkspace && viewMode === "history" ? (
        <ScrumHistoryView boardElapsedSeconds={boardElapsedSeconds} boardTimerHistory={boardTimerHistory} completedHistory={completedHistory} />
      ) : null}

      {!isLoadingWorkspace && viewMode === "clients" ? (
        <ScrumClientsView
          clientAmount={clientAmount}
          clientDebtAmount={clientDebtAmount}
          clientFrequency={clientFrequency}
          clientName={clientName}
          clientNextPaymentAt={clientNextPaymentAt}
          clients={clients}
          expandedClientId={expandedClientId}
          now={now}
          onCreateClient={handleCreateClient}
          onDeleteClient={handleDeleteClient}
          onRegisterClientDebtPayment={handleRegisterClientDebtPayment}
          onRegisterClientPayment={handleRegisterClientPayment}
          setClientAmount={setClientAmount}
          setClientDebtAmount={setClientDebtAmount}
          setClientFrequency={setClientFrequency}
          setClientName={setClientName}
          setClientNextPaymentAt={setClientNextPaymentAt}
          setExpandedClientId={setExpandedClientId}
        />
      ) : null}

      <ScrumDurationModal
        editingDurationUnit={editingDurationUnit}
        editingDurationValue={editingDurationValue}
        editingDifficulty={editingDifficulty}
        editingTaskId={editingTaskId}
        onClose={() => setEditingTaskId(null)}
        onDelete={handleDeleteTask}
        onSave={handleUpdateTaskDuration}
        setEditingDurationUnit={setEditingDurationUnit}
        setEditingDurationValue={setEditingDurationValue}
        setEditingDifficulty={setEditingDifficulty}
      />
    </main>
  );
}
