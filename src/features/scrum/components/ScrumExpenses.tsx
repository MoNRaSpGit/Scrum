import { useCallback, useEffect, useState } from "react";
import { requestJson } from "../scrum.api";
import {
  deleteButtonStyle,
  fichaBigStyle,
  fichaHeaderStyle,
  fichaLabelStyle,
  fichaLinkButtonStyle,
  fichaRowStrongStyle,
  fichaRowStyle,
  fichaSubStyle,
  fieldGroupStyle,
  inputStyle,
  labelStyle,
  modalCardStyle,
  modalCloseButtonStyle,
  modalHeaderStyle,
  modalOverlayStyle,
  primaryButtonStyle
} from "../scrum.styles";
import { formatCurrency } from "../scrum.utils";

export type ScrumExpense = { id: number; description: string; amount: number };
type ExpensesResponse = { ok: boolean; items: ScrumExpense[] };

// Gastos mensuales (14/11/2026, pedido explicito): lo que cuesta mantener el
// negocio (Claude, servidor, YouTube Premium...). Cada gasto es un monto POR
// MES y se descuenta de la ganancia mensual para dar la ganancia neta.
export function useScrumExpenses() {
  const [expenses, setExpenses] = useState<ScrumExpense[]>([]);

  useEffect(() => {
    let cancelled = false;
    requestJson<ExpensesResponse>("/scrum/expenses")
      .then((response) => {
        if (!cancelled) setExpenses(response.items);
      })
      .catch(() => {
        // Sin gastos cargados si falla: la ganancia neta queda igual a la bruta.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (expense: { id?: number; description: string; amount: number }) => {
    const body = JSON.stringify({ description: expense.description, amount: expense.amount });
    const response = expense.id
      ? await requestJson<ExpensesResponse>(`/scrum/expenses/${expense.id}`, { method: "PATCH", body })
      : await requestJson<ExpensesResponse>("/scrum/expenses", { method: "POST", body });
    setExpenses(response.items);
  }, []);

  const remove = useCallback(async (expenseId: number) => {
    const response = await requestJson<ExpensesResponse>(`/scrum/expenses/${expenseId}`, { method: "DELETE" });
    setExpenses(response.items);
  }, []);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return { expenses, total, save, remove };
}

// Modal para agregar o editar un gasto.
export function ExpenseModal({
  expense,
  onClose,
  onSave,
  onDelete
}: {
  expense: ScrumExpense | null;
  onClose: () => void;
  onSave: (expense: { id?: number; description: string; amount: number }) => Promise<void>;
  onDelete: (expenseId: number) => Promise<void>;
}) {
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    const parsedAmount = Number(amount);
    if (!description.trim()) {
      setMessage("Poné una descripción (ej: Servidor).");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage("Poné un monto mayor a 0.");
      return;
    }
    setBusy(true);
    try {
      await onSave({ id: expense?.id, description: description.trim(), amount: parsedAmount });
      onClose();
    } catch {
      setMessage("No se pudo guardar. Probá de nuevo.");
      setBusy(false);
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <strong style={{ fontSize: 18 }}>{expense ? "Editar gasto" : "Agregar gasto"}</strong>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle}>
            Cerrar
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: "#9aa3c0" }}>El monto es por mes y se descuenta de la ganancia mensual.</p>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="expense-description">
            Descripción
          </label>
          <input id="expense-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej: Servidor, Claude, YouTube Premium" maxLength={180} style={inputStyle} />
        </div>

        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="expense-amount">
            Monto por mes
          </label>
          <input id="expense-amount" type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ej: 500" style={inputStyle} />
        </div>

        {message ? <span style={fichaSubStyle}>{message}</span> : null}

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
          {expense ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`¿Borrar el gasto "${expense.description}"?`)) {
                  setBusy(true);
                  onDelete(expense.id)
                    .then(onClose)
                    .catch(() => {
                      setMessage("No se pudo borrar. Probá de nuevo.");
                      setBusy(false);
                    });
                }
              }}
              style={deleteButtonStyle}
            >
              Borrar
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={() => void submit()} disabled={busy} style={{ ...primaryButtonStyle, minWidth: 120 }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// Lista de gastos (se despliega al tocar la tarjeta Gastos).
export function ExpensesList({
  expenses,
  total,
  onAdd,
  onEdit
}: {
  expenses: ScrumExpense[];
  total: number;
  onAdd: () => void;
  onEdit: (expense: ScrumExpense) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10, padding: 14, boxSizing: "border-box", borderRadius: 12, border: "1px solid #232a44", background: "#0d111e" }}>
      <div style={fichaHeaderStyle}>
        <span style={fichaLabelStyle}>Gastos del mes</span>
        <button type="button" onClick={onAdd} style={fichaLinkButtonStyle}>
          + Agregar gasto
        </button>
      </div>
      <div style={fichaBigStyle}>{formatCurrency(total)}</div>
      {expenses.length === 0 ? (
        <span style={fichaSubStyle}>Todavía no cargaste gastos. Tocá "+ Agregar gasto" (ej: servidor, Claude, YouTube Premium).</span>
      ) : (
        <div style={{ display: "grid", gap: 0 }}>
          {expenses.map((expense) => (
            <button
              key={expense.id}
              type="button"
              onClick={() => onEdit(expense)}
              style={{ ...fichaRowStyle, background: "transparent", border: "none", borderTop: "1px solid #232a44", width: "100%", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <span>{expense.description}</span>
              <span>{formatCurrency(expense.amount)}</span>
            </button>
          ))}
          <div style={fichaRowStrongStyle}>
            <span>Total por mes</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
