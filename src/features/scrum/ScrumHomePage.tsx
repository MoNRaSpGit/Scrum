import { useEffect, useMemo, useState } from "react";
import { BuildMetaCard } from "../../shared/components/BuildMetaCard";
import { API_BASE_URL } from "../../shared/config/api";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskDifficulty = "green" | "yellow" | "red";

type ScrumTask = {
  id: number;
  title: string;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  startedAt: number | null;
};

const INITIAL_TASKS: ScrumTask[] = [
  {
    id: 1,
    title: "Definir primer flujo Scrum",
    estimatedMinutes: 240,
    difficulty: "yellow",
    status: "todo",
    startedAt: null
  }
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Tareas para realizar",
  in_progress: "Realizando",
  done: "Finalizadas"
};

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  green: "Verde",
  yellow: "Amarillo",
  red: "Rojo"
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
  }
};

function formatRemainingTime(task: ScrumTask, now: number) {
  if (task.status !== "in_progress" || !task.startedAt) {
    return formatMinutes(task.estimatedMinutes);
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - task.startedAt) / 1000));
  const remainingSeconds = Math.max(0, task.estimatedMinutes * 60 - elapsedSeconds);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return `${String(hours)}h:${String(minutes).padStart(2, "0")}m:${String(seconds).padStart(2, "0")}s`;
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h:${String(minutes).padStart(2, "0")}m`;
}

function moveTaskStatus(task: ScrumTask): ScrumTask {
  if (task.status === "todo") {
    return {
      ...task,
      status: "in_progress",
      startedAt: Date.now()
    };
  }

  if (task.status === "in_progress") {
    return {
      ...task,
      status: "done"
    };
  }

  return task;
}

export function ScrumHomePage() {
  const [tasks, setTasks] = useState<ScrumTask[]>(INITIAL_TASKS);
  const [title, setTitle] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("4");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("green");
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      in_progress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done")
    }),
    [tasks]
  );

  function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const parsedHours = Number(estimatedHours);
    if (!normalizedTitle || !Number.isFinite(parsedHours) || parsedHours <= 0) {
      return;
    }

    const nextTask: ScrumTask = {
      id: tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1,
      title: normalizedTitle,
      estimatedMinutes: Math.round(parsedHours * 60),
      difficulty,
      status: "todo",
      startedAt: null
    };

    setTasks((currentTasks) => [nextTask, ...currentTasks]);
    setTitle("");
    setEstimatedHours("4");
    setDifficulty("green");
  }

  function handleAdvanceTask(taskId: number) {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? moveTaskStatus(task) : task)));
  }

  async function handleFetchSample() {
    setLoading(true);
    setConnectionMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/scrum/sample`);
      if (!response.ok) {
        throw new Error("No se pudo consultar Scrum");
      }

      const payload = (await response.json()) as {
        ok: boolean;
        item: {
          id: number;
          sprint: string;
          task: string;
          status: string;
          owner: string;
          createdAt: string;
        } | null;
      };

      if (!payload.item) {
        setConnectionMessage("La conexion funciona, pero no devolvio registros.");
        return;
      }

      setConnectionMessage(
        `BDD conectada: ${payload.item.sprint} | ${payload.item.task} | ${payload.item.status} | ${payload.item.owner}`
      );
    } catch (error) {
      setConnectionMessage(error instanceof Error ? error.message : "Fallo la consulta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <span style={eyebrowStyle}>SaaSPro</span>
          <h1 style={titleStyle}>Scrum</h1>
          <p style={bodyStyle}>Tablero inicial con alta de tareas, semaforo de dificultad y cronometro activo cuando una tarea pasa a realizando.</p>
        </div>
        <BuildMetaCard />
      </section>

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
            <label style={labelStyle} htmlFor="task-hours">
              Tiempo estimado
            </label>
            <input
              id="task-hours"
              type="number"
              min="0.25"
              step="0.25"
              value={estimatedHours}
              onChange={(event) => setEstimatedHours(event.target.value)}
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
            </select>
          </div>

          <div style={formActionsStyle}>
            <button type="submit" style={primaryButtonStyle}>
              Crear tarea
            </button>
            <button type="button" onClick={handleFetchSample} disabled={loading} style={secondaryButtonStyle}>
              {loading ? "Consultando..." : "Probar BDD"}
            </button>
          </div>
        </form>

        {connectionMessage ? <p style={feedbackStyle}>{connectionMessage}</p> : null}
      </section>

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
                      ? "Corriendo con tiempo descontando"
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

                return (
                  <article
                    key={task.id}
                    style={{
                      ...taskCardStyle,
                      borderLeft: `5px solid ${difficultyStyle.accent}`,
                      background: difficultyStyle.background
                    }}
                  >
                    <div style={taskHeaderStyle}>
                      <strong style={taskTitleStyle}>{task.title}</strong>
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

                    <div style={taskMetaGridStyle}>
                      <span style={metaChipStyle}>Estimado: {formatMinutes(task.estimatedMinutes)}</span>
                      <span style={metaChipStyle}>Reloj: {formatRemainingTime(task, now)}</span>
                    </div>

                    <div style={taskFooterStyle}>
                      <span style={statusPillStyle(task.status)}>
                        {task.status === "todo" ? "Pendiente" : task.status === "in_progress" ? "En curso" : "Finalizada"}
                      </span>

                      {canAdvance ? (
                        <button type="button" onClick={() => handleAdvanceTask(task.id)} style={advanceButtonStyle}>
                          {task.status === "todo" ? "Mover a realizando >" : "Mover a finalizadas >"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </section>
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
  alignItems: "start"
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  color: "#3056d3"
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 44px)",
  lineHeight: 1.05
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 700,
  lineHeight: 1.6,
  color: "#53627c"
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
  gridTemplateColumns: "minmax(220px, 2fr) minmax(140px, 0.7fr) minmax(160px, 0.8fr) auto",
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
  flexWrap: "wrap"
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

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "0 16px",
  border: "1px solid #cfd8e6",
  borderRadius: 8,
  background: "#f8fbff",
  color: "#234051",
  fontWeight: 700,
  cursor: "pointer"
};

const feedbackStyle: React.CSSProperties = {
  margin: 0,
  padding: "12px 14px",
  border: "1px solid #dbe4f3",
  borderRadius: 8,
  background: "#f7faff",
  color: "#234051",
  fontSize: 14,
  lineHeight: 1.5
};

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

const taskTitleStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.45
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

const taskMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 8
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
