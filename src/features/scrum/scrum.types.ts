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

export type ClientEquipment = {
  installmentAmount: number;
  months: number;
  total: number;
  paid: number;
  remaining: number;
  installmentsLeft: number;
  payments: ClientDebtPayment[];
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
  // Comision: % del monto que se le da a quien vendio (0 = sin comision).
  commissionPercent?: number;
  // Materiales/equipo cobrados aparte (no suman a la ganancia mensual).
  equipment?: ClientEquipment | null;
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
  // Modo oscuro (31/10/2026): fondo translucido del color + texto en la
  // version clara/neon del mismo tono, en vez del pastel solido de antes.
  green: {
    accent: "#34d399",
    background: "rgba(52, 211, 153, 0.16)",
    text: "#6ee7b7"
  },
  yellow: {
    accent: "#fbbf24",
    background: "rgba(251, 191, 36, 0.16)",
    text: "#fcd34d"
  },
  red: {
    accent: "#fb4570",
    background: "rgba(251, 69, 112, 0.16)",
    text: "#ff8aa3"
  },
  blue: {
    accent: "#818cf8",
    background: "rgba(129, 140, 248, 0.18)",
    text: "#a5b4fc"
  }
};

export const CLIENT_ALERT_STYLES: Record<ClientAlertState, { background: string; color: string; border: string; label: string }> =
  {
    white: {
      background: "#121728",
      color: "#9aa3c0",
      border: "#232a44",
      label: "Normal"
    },
    green: {
      background: "rgba(52, 211, 153, 0.14)",
      color: "#6ee7b7",
      border: "rgba(52, 211, 153, 0.4)",
      label: "En mes"
    },
    yellow: {
      background: "rgba(251, 191, 36, 0.14)",
      color: "#fcd34d",
      border: "rgba(251, 191, 36, 0.4)",
      label: "En semana"
    },
    red: {
      background: "rgba(251, 69, 112, 0.14)",
      color: "#ff8aa3",
      border: "rgba(251, 69, 112, 0.4)",
      label: "Vencido"
    }
  };

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: "Mensual",
  semiannual: "Cada 6 meses"
};
