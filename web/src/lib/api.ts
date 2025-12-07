//web\src\lib\api.ts
import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = (await supabase.auth.getSession()).data.session;
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
