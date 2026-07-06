import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../shared/config/api";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskDifficulty = "green" | "yellow" | "red" | "blue";
type ViewMode = "board" | "history" | "clients";
type BillingFrequency = "monthly" | "semiannual";
type ClientAlertState = "white" | "green" | "yellow" | "red";

type ScrumTask = {
  id: number;
  title: string;
  description?: string | null;
  estimatedMinutes: number;
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

const INITIAL_TASKS: ScrumTask[] = [];

const INITIAL_CLIENTS: ClientBilling[] = [];

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
  const currentDayKey = getMontevideoDateKey(now);

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

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      in_progress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done")
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

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      return;
    }

    try {
      const response = await requestJson<{ ok: boolean; item: ScrumTask }>("/scrum/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: normalizedTitle,
          description: description.trim() || undefined,
          difficulty
        })
      });

      setTasks((currentTasks) => [response.item, ...currentTasks]);
      setTitle("");
      setDescription("");
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

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <h1 style={titleStyle}>Scrum</h1>
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
                        <strong style={taskTitleStyle}>{task.title}</strong>
                      </button>

                      {expanded ? (
                        <div style={taskDetailsStyle}>
                          <div style={taskHeaderStyle}>
                            <div style={{ display: "grid", gap: 6 }}>
                              {task.description ? <span style={taskDescriptionStyle}>{task.description}</span> : null}
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
  gridTemplateColumns: "minmax(220px, 2fr) minmax(220px, 2fr) minmax(180px, 1fr) auto",
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
