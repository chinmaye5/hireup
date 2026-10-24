/**
 * Typed API Client for HireUp Backend.
 *
 * What this file is for:
 * Centralizes all HTTP communication with the FastAPI backend.
 * Automatically attaches Clerk Bearer tokens and extracts clear error messages.
 */

const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  token: string | null = null,
  body: unknown = null
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method: method,
    headers: headers,
  };

  if (body !== null && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err: unknown) {
    const errorText = err instanceof Error ? err.message : "Network error";
    throw new Error(`Failed to reach server: ${errorText}`);
  }

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson && typeof errorJson.detail === "string") {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Body was not JSON
    }
    throw new Error(errorDetail);
  }

  const resultData = (await response.json()) as T;
  return resultData;
}
