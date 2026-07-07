import { ENV } from "../config/env";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;

  try {
    res = await fetch(`${ENV.apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
      0,
    );
  }

  const responseText = await res.text().catch(() => "");

  if (!res.ok) {
    let message = responseText;

    try {
      const data = JSON.parse(responseText) as {
        detail?: unknown;
        message?: unknown;
      };

      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (typeof data.message === "string") {
        message = data.message;
      } else if (Array.isArray(data.detail)) {
        message = JSON.stringify(data);
      }
    } catch {
      // JSON 응답이 아니면 기존 문자열 사용
    }

    throw new ApiError(
      message || `요청이 실패했습니다 (HTTP ${res.status})`,
      res.status,
    );
  }

  if (res.status === 204 || responseText.length === 0) {
    return undefined as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new ApiError(
      "서버 응답 형식이 올바르지 않습니다.",
      res.status,
    );
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};