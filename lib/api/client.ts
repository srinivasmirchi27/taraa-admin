const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export const TOKEN_KEY = "taraa_admin_token";
export const REFRESH_TOKEN_KEY = "taraa_admin_refresh_token";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public path?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  _retried?: boolean;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, _retried = false, headers = {}, ...rest } = options;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!json.success) {
    // Auto-refresh on 401 — retry once
    if (res.status === 401 && auth && !_retried) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshJson = await refreshRes.json();
          if (refreshJson.success) {
            setTokens(refreshJson.data.accessToken);
            return request<T>(path, { ...options, _retried: true });
          }
        } catch {
          // refresh call itself failed
        }
      }
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
    throw new ApiError(
      res.status,
      json.message ?? "Request failed",
      json.path,
    );
  }

  return json.data as T;
}

export async function formRequest<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: form,
  });

  const json = await res.json();
  if (!json.success) throw new ApiError(res.status, json.message ?? "Request failed");
  return json.data as T;
}

export async function patchFormRequest<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers,
    body: form,
  });

  const json = await res.json();
  if (!json.success) throw new ApiError(res.status, json.message ?? "Request failed");
  return json.data as T;
}

export async function uploadFile(
  path: string,
  file: File,
): Promise<unknown> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: form,
  });

  const json = await res.json();
  if (!json.success) throw new ApiError(res.status, json.message ?? "Upload failed");
  return json.data;
}
