export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskDifficulty = "green" | "yellow" | "red" | "blue";
export type TaskDurationUnit = "days" | "weeks" | "months";
export type ViewMode = "board" | "history" | "clients";
export type BillingFrequency = "monthly" | "semiannual";
export type ClientAlertState = "white" | "green" | "yellow" | "red";

export type ScrumTask = {
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

export type ClientDebtPayment = {
  id: number;
  amount: number;
  paidAt: string;
};

export type ClientBilling = {
  id: number;
  name: string;
  amount: number;
  frequency: BillingFrequency;
  nextPaymentAt: string;
  debtAmount: number | null;
  debtPaidAmount: number;
  debtRemaining: number | null;
  debtPayments: ClientDebtPayment[];
};

export type BoardTimerHistoryEntry = {
  dayKey: string;
  totalSeconds: number;
};

export type BoardTimerHistoryDisplayEntry = BoardTimerHistoryEntry & {
  dateLabel: string;
};

export type BoardTimerSnapshot = {
  dayKey: string;
  trackedSeconds: number;
  timerStartedAt: number | null;
  history: BoardTimerHistoryEntry[];
};

export type CompletedHistoryEntry = {
  dateLabel: string;
  tasks: ScrumTask[];
};

export const INITIAL_TASKS: ScrumTask[] = [];
export const INITIAL_CLIENTS: ClientBilling[] = [];
export const BOARD_TIMER_STORAGE_KEY = "frontend-scrum-board-timer";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Tareas para realizar",
  in_progress: "Realizando",
  done: "Finalizadas"
};

export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  green: "Verde",
  yellow: "Amarillo",
  red: "Rojo",
  blue: "Diaria"
};

export const DIFFICULTY_STYLES: Record<TaskDifficulty, { accent: string; background: string; text: string }> = {
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

export const CLIENT_ALERT_STYLES: Record<ClientAlertState, { background: string; color: string; border: string; label: string }> =
  {
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

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: "Mensual",
  semiannual: "Cada 6 meses"
};
