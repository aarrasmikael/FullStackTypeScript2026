import { ApiError, AuthError } from "./errors";
import { attemptTokenRefresh } from "./refresh";
import { getAccessToken, notifyAuthFailure } from "./token";

export const BASE_URL: string = import.meta.env.VITE_API_URL ?? "/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { body, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string> | undefined),
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
    // lähettää httpOnly refresh token evästeen mukana
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // Vartija: refresh endpointin oma 401 ei saa käynnistää uutta refreshia (ikuinen silmukka)
    if (endpoint === "/auth/refresh") {
      throw new AuthError("Session expired");
    }

    // Yritetään hiljaista refreshia vain kerran per pyyntö
    if (!isRetry && (await attemptTokenRefresh())) {
      return apiClient<T>(endpoint, options, true);
    }

    notifyAuthFailure();
    throw new AuthError("Session expired");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
