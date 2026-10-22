export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskDifficulty = "green" | "yellow" | "red" | "blue";
export type TaskDurationUnit = "days" | "weeks" | "months";
// Rediseno 22/10/2026 (pedido explicito): se dejan de usar "historial" y
// "deudas" en la navegacion -- el codigo de esas vistas queda intacto
// (ScrumHistoryView.tsx, ScrumDebtsView.tsx) por si se reactivan.
export type ViewMode = "board" | "clients" | "charts";
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

export type ClientAmountChange = {
  id: number;
  previousAmount: number;
  newAmount: number;
  delta: number;
  description: string;
  changedAt: string;
};

export type ClientBilling = {
  id: number;
  name: string;
  amount: number;
  frequency: BillingFrequency;
  nextPaymentAt: string;
  createdAt: string;
  debtAmount: number | null;
  debtPaidAmount: number;
  debtRemaining: number | null;
  debtPayments: ClientDebtPayment[];
  amountHistory: ClientAmountChange[];
};

export type DebtCharge = {
  id: number;
  amount: number;
  detail: string;
  chargedAt: string;
};

export type DebtPayment = {
  id: number;
  amount: number;
  paidAt: string;
};

export type ScrumDebt = {
  id: number;
  name: string;
  initialAmount: number;
  dueDate: string;
  totalCharged: number;
  totalPaid: number;
  remaining: number;
  charges: DebtCharge[];
  payments: DebtPayment[];
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
export const INITIAL_DEBTS: ScrumDebt[] = [];
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
  // Fondo mas intenso (pedido explicito, 22/10/2026: "ponele el color un
  // poco mas intenso pero sin ese borde lateral llamativo") -- todo el
  // rectangulo de la tarjeta lleva el color, sin la barra lateral de antes.
  green: {
    accent: "#16a34a",
    background: "#c9f2dc",
    text: "#146c37"
  },
  yellow: {
    accent: "#d97706",
    background: "#fbe3ab",
    text: "#92600a"
  },
  red: {
    accent: "#dc2626",
    background: "#fbd0d0",
    text: "#991b1b"
  },
  blue: {
    accent: "#4f46e5",
    background: "#d6d9fb",
    text: "#4338ca"
  }
};

export const CLIENT_ALERT_STYLES: Record<ClientAlertState, { background: string; color: string; border: string; label: string }> =
  {
    white: {
      background: "#ffffff",
      color: "#5c6270",
      border: "#e5e7ef",
      label: "Normal"
    },
    green: {
      background: "#eafaf0",
      color: "#146c37",
      border: "#bfe8cf",
      label: "En mes"
    },
    yellow: {
      background: "#fef6e7",
      color: "#92600a",
      border: "#f6dba8",
      label: "En semana"
    },
    red: {
      background: "#fdecec",
      color: "#991b1b",
      border: "#f6c1c1",
      label: "Vencido"
    }
  };

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: "Mensual",
  semiannual: "Cada 6 meses"
};
