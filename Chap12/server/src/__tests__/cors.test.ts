import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("CORS", () => {
  const app = createApp({ rateLimiting: false });

  it("sallii frontendin originin ja evästeet (credentials)", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("ei salli tuntematonta originia", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://evil.example.com");

    expect(res.headers["access-control-allow-origin"]).not.toBe("http://evil.example.com");
  });

  it("vastaa preflight pyyntöön (OPTIONS) Authorization otsikolla", async () => {
    const res = await request(app)
      .options("/api/v1/posts")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });
});
