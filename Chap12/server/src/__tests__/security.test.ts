import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { resetDb } from "./helpers.js";

beforeEach(async () => {
  await resetDb();
});

describe("Helmet", () => {
  it("lisää tietoturvaotsikot vastauksiin", async () => {
    const res = await request(createApp({ rateLimiting: false })).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["strict-transport-security"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("Request body -raja", () => {
  it("yli 10 kt body hylätään (413)", async () => {
    const res = await request(createApp({ rateLimiting: false }))
      .post("/api/auth/register")
      .send({ email: "a@example.com", username: "A".repeat(20_000), password: "securepassword" });
    expect(res.status).toBe(413);
  });
});

describe("Rate limiting", () => {
  it("estää kirjautumisen brute forcen: 6. epäonnistunut yritys antaa 429", async () => {
    const app = createApp({ rateLimiting: true });
    const attempt = () =>
      request(app).post("/api/auth/login").send({ email: "x@example.com", password: "wrong-password" });

    for (let i = 0; i < 5; i++) {
      expect((await attempt()).status).toBe(400);
    }
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.headers["ratelimit"] ?? blocked.headers["ratelimit-policy"]).toBeDefined();
  });

  it("onnistuneet pyynnöt eivat kuluta auth-rajaa (skipSuccessfulRequests)", async () => {
    const app = createApp({ rateLimiting: true });
    for (let i = 0; i < 7; i++) {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: `user${i}@example.com`, username: `User${i}`, password: "securepassword" });
      expect(res.status).toBe(201);
    }
  });

  it("kirjautumaton sivun lataus (refresh ilman evästettä) ei kuluta rajaa", async () => {
    const app = createApp({ rateLimiting: true });
    for (let i = 0; i < 25; i++) {
      expect((await request(app).post("/api/auth/refresh")).status).toBe(401);
    }
    // kirjautuminen toimii edelleen
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "x@example.com", password: "wrong-password" });
    expect(login.status).toBe(400);
  });

  it("refresh arvatuilla evästearvoilla estetään 20 yrityksen jälkeen", async () => {
    const app = createApp({ rateLimiting: true });
    for (let i = 0; i < 20; i++) {
      expect(
        (await request(app).post("/api/auth/refresh").set("Cookie", "refreshToken=guess")).status,
      ).toBe(401);
    }
    const blocked = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=guess");
    expect(blocked.status).toBe(429);
  });
});
