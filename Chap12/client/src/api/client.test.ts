import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { AuthError, ApiError } from "./errors";
import { getAccessToken, setAccessToken, setAuthFailureHandler } from "./token";

type FetchMock = ReturnType<typeof vi.fn>;

function json(status: number, body: unknown = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function authHeader(call: unknown[]): string | undefined {
  const init = call[1] as RequestInit;
  return (init.headers as Record<string, string>)["Authorization"];
}

describe("apiClient", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken(null);
    setAuthFailureHandler(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("liittää access tokenin Authorization-otsikkoon ja lähettää evästeet", async () => {
    setAccessToken("abc");
    fetchMock.mockResolvedValue(json(200, { ok: true }));

    await apiClient("/v1/posts");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/posts");
    expect(init.credentials).toBe("include");
    expect(authHeader(fetchMock.mock.calls[0])).toBe("Bearer abc");
  });

  it("heittää ApiError statuksella ja palvelimen viestillä", async () => {
    fetchMock.mockResolvedValue(json(409, { message: "Conflict!" }));

    await expect(apiClient("/v1/posts")).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "Conflict!",
    });
    await expect(apiClient("/v1/posts")).rejects.toBeInstanceOf(ApiError);
  });

  it("palauttaa undefined kun vastaus on 204", async () => {
    fetchMock.mockResolvedValue(json(204));
    await expect(apiClient("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("401: uusii tokenin hiljaa ja yrittää alkuperäistä pyyntöä uudelleen", async () => {
    setAccessToken("old");
    fetchMock
      .mockResolvedValueOnce(json(401, { error: "TOKEN_EXPIRED" })) // alkuperäinen
      .mockResolvedValueOnce(json(200, { accessToken: "new" })) // refresh
      .mockResolvedValueOnce(json(200, { id: 1 })); // uusinta

    const result = await apiClient<{ id: number }>("/v1/users/me");

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(authHeader(fetchMock.mock.calls[2])).toBe("Bearer new");
    expect(getAccessToken()).toBe("new");
  });

  it("401 ja refresh epäonnistuu: heittää AuthError ja ilmoittaa kuuntelijalle", async () => {
    const onFailure = vi.fn();
    setAuthFailureHandler(onFailure);
    setAccessToken("old");
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(json(401)); // refresh hylätään

    await expect(apiClient("/v1/users/me")).rejects.toBeInstanceOf(AuthError);
    expect(onFailure).toHaveBeenCalledOnce();
    expect(getAccessToken()).toBeNull();
  });

  it("refresh-endpointin oma 401 ei käynnistä uutta refreshia (ei silmukkaa)", async () => {
    fetchMock.mockResolvedValue(json(401));

    await expect(apiClient("/auth/refresh", { method: "POST" })).rejects.toBeInstanceOf(
      AuthError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("usea yhtäaikainen 401 johtaa vain yhteen refresh-kutsuun", async () => {
    setAccessToken("old");

    let refreshCalls = 0;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url === "/api/auth/refresh") {
        refreshCalls++;
        await new Promise((r) => setTimeout(r, 20)); // refresh kestää hetken
        return json(200, { accessToken: "new" });
      }
      const header = (init.headers as Record<string, string>)["Authorization"];
      return header === "Bearer new" ? json(200, { url }) : json(401);
    });

    const results = await Promise.all([
      apiClient<{ url: string }>("/v1/a"),
      apiClient<{ url: string }>("/v1/b"),
      apiClient<{ url: string }>("/v1/c"),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results.map((r) => r.url)).toEqual([
      "/api/v1/a",
      "/api/v1/b",
      "/api/v1/c",
    ]);
  });
});
