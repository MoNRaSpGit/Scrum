import { API_BASE_URL } from "../../shared/config/api";

export async function requestJson<T>(path: string, init?: RequestInit) {
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
