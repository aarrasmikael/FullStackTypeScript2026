import { SignJWT } from "jose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../app.js";
import { prisma } from "../db.js";
import { createTestUser, createUserWithRole, resetDb } from "./helpers.js";

// Integraatiotestit käyttävät oikeaa tietokantaa (<nimi>_test)
beforeEach(async () => {
  await resetDb();
});

function refreshCookieValue(cookies: string[]) {
  return cookies.find((c) => c.startsWith("refreshToken="))!;
}

describe("POST /api/auth/register", () => {
  it("rekisteröi, asettaa httpOnly-evästeen eikä vuoda salasanaa", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "new@example.com",
      username: "New User",
      password: "securepassword",
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user.email).toBe("new@example.com");
    expect(res.body.user.role).toBe("USER");
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();

    const cookie = refreshCookieValue(res.headers["set-cookie"] as unknown as string[]);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/api/auth");
  });

  it("tallentaa salasanasta argon2id-hashin", async () => {
    await createTestUser();
    const user = await prisma.user.findFirstOrThrow({
      omit: { password: false },
    });
    expect(user.password).toMatch(/^\$argon2id\$/);
    expect(user.password).not.toContain("testpassword123");
  });

  it("estää saman sähköpostin kaksoisrekisteröinnin", async () => {
    await createTestUser();
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      username: "Other",
      password: "anotherpassword",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("An account with this email already exists");
  });

  it("palauttaa 400 virheellisestä syötteestä kenttäkohtaisilla virheillä", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "ei-sahkoposti",
      username: "x",
      password: "short",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(
      expect.arrayContaining(["email", "username", "password"]),
    );
  });

  it("ei anna käyttäjän asettaa omaa rooliaan", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "sneaky@example.com",
      username: "Sneaky",
      password: "securepassword",
      role: "ADMIN",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("USER");
  });
});

describe("POST /api/auth/login", () => {
  it("kirjaa sisään oikeilla tunnuksilla", async () => {
    const { credentials } = await createTestUser();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("antaa saman virheen väärälle salasanalle ja tuntemattomalle sähköpostille", async () => {
    const { credentials } = await createTestUser();

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrongpassword" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "wrongpassword" });

    expect(wrongPassword.status).toBe(unknownEmail.status);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.message).toBe("Invalid email or password");
  });
});

describe("401 vs 403", () => {
  it("palauttaa 401 ilman tokenia ja 403 ilman oikeaa roolia", async () => {
    const noAuth = await request(app).get("/api/v1/users");
    expect(noAuth.status).toBe(401);
    expect(noAuth.body.error).toBe("UNAUTHORIZED");

    const { accessToken } = await createTestUser();
    const noRole = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(noRole.status).toBe(403);
    expect(noRole.body.error).toBe("FORBIDDEN");
  });

  it("ADMIN pääsee admin-reitille eikä listassa näy salasanoja", async () => {
    const admin = await createUserWithRole("ADMIN", "admin@example.com");
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].password).toBeUndefined();
  });

  it("vain ADMIN voi poistaa käyttäjän", async () => {
    const victim = await createTestUser({ email: "victim@example.com" });
    const mod = await createUserWithRole("MODERATOR", "mod@example.com");
    const admin = await createUserWithRole("ADMIN", "admin@example.com");

    const asMod = await request(app)
      .delete(`/api/v1/users/${victim.user.id}`)
      .set("Authorization", `Bearer ${mod.accessToken}`);
    expect(asMod.status).toBe(403);

    const asAdmin = await request(app)
      .delete(`/api/v1/users/${victim.user.id}`)
      .set("Authorization", `Bearer ${admin.accessToken}`);
    expect(asAdmin.status).toBe(204);
  });
});

describe("access token -tarkistus", () => {
  it("vanhentunut token antaa TOKEN_EXPIRED", async () => {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const expired = await new SignJWT({ role: "USER" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("1")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secret);

    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("TOKEN_EXPIRED");
  });

  it("väärennetty token antaa INVALID_TOKEN", async () => {
    const forged = await new SignJWT({ role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("1")
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode("jokin-aivan-toinen-salaisuus-32-merkkia"));

    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_TOKEN");
  });

  it("/users/me palauttaa oman profiilin tokenin perusteella", async () => {
    const { accessToken, user } = await createTestUser();
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body.password).toBeUndefined();
  });
});

describe("refresh token, rotaatio ja logout", () => {
  it("refresh antaa uuden access tokenin ja rotatoi refresh-tokenin", async () => {
    const { cookies } = await createTestUser();

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf("string");

    const newCookie = refreshCookieValue(res.headers["set-cookie"] as unknown as string[]);
    expect(newCookie).not.toBe(refreshCookieValue(cookies));
    expect(await prisma.refreshToken.count()).toBe(1);
  });

  it("jo käytetty refresh-token hylätään ja kaikki istunnot perutaan (reuse detection)", async () => {
    const { cookies } = await createTestUser();
    const first = await request(app).post("/api/auth/refresh").set("Cookie", cookies);
    expect(first.status).toBe(200);

    const replay = await request(app).post("/api/auth/refresh").set("Cookie", cookies);
    expect(replay.status).toBe(401);
    expect(replay.body.error).toBe("TOKEN_REVOKED");

    // myös rotatoitu uusi token on peruttu
    const newCookies = first.headers["set-cookie"] as unknown as string[];
    const afterReplay = await request(app).post("/api/auth/refresh").set("Cookie", newCookies);
    expect(afterReplay.status).toBe(401);
  });

  it("refresh ilman evästettä antaa 401", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("rikkinäinen refresh-token antaa 401 eikä 500", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("logout mitätöi refresh-tokenin", async () => {
    const { cookies } = await createTestUser();

    const out = await request(app).post("/api/auth/logout").set("Cookie", cookies);
    expect(out.status).toBe(204);
    expect(await prisma.refreshToken.count()).toBe(0);

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookies);
    expect(res.status).toBe(401);
  });

  it("DELETE /api/auth/sessions kirjaa ulos kaikilta laitteilta", async () => {
    const { credentials, accessToken, cookies: deviceA } = await createTestUser();
    const loginB = await request(app).post("/api/auth/login").send({
      email: credentials.email,
      password: credentials.password,
    });
    const deviceB = loginB.headers["set-cookie"] as unknown as string[];
    expect(await prisma.refreshToken.count()).toBe(2);

    const res = await request(app)
      .delete("/api/auth/sessions")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(204);

    expect((await request(app).post("/api/auth/refresh").set("Cookie", deviceA)).status).toBe(401);
    expect((await request(app).post("/api/auth/refresh").set("Cookie", deviceB)).status).toBe(401);
  });
});

describe("postauksen omistajuus ja roolit", () => {
  async function createPost(accessToken: string) {
    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Otsikko", content: "Sisalto" });
    return res.body as { id: number; authorId: number };
  }

  it("lukeminen on julkista, luominen vaatii kirjautumisen", async () => {
    expect((await request(app).get("/api/v1/posts")).status).toBe(200);
    const res = await request(app)
      .post("/api/v1/posts")
      .send({ title: "x", content: "y" });
    expect(res.status).toBe(401);
  });

  it("authorId tulee tokenista, ei bodysta", async () => {
    const a = await createTestUser({ email: "a@example.com" });
    const b = await createTestUser({ email: "b@example.com" });

    const res = await request(app)
      .post("/api/v1/posts")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ title: "T", content: "C", authorId: b.user.id });

    expect(res.status).toBe(201);
    expect(res.body.authorId).toBe(a.user.id);
  });

  it("toisen käyttäjän postausta ei voi muokata tai poistaa (403)", async () => {
    const owner = await createTestUser({ email: "owner@example.com" });
    const other = await createTestUser({ email: "other@example.com" });
    const post = await createPost(owner.accessToken);

    const put = await request(app)
      .put(`/api/v1/posts/${post.id}`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send({ title: "Hakkeroitu" });
    expect(put.status).toBe(403);

    const del = await request(app)
      .delete(`/api/v1/posts/${post.id}`)
      .set("Authorization", `Bearer ${other.accessToken}`);
    expect(del.status).toBe(403);
  });

  it("omistaja voi muokata ja MODERATOR voi poistaa kenen tahansa postauksen", async () => {
    const owner = await createTestUser({ email: "owner@example.com" });
    const mod = await createUserWithRole("MODERATOR", "mod@example.com");
    const post = await createPost(owner.accessToken);

    const put = await request(app)
      .put(`/api/v1/posts/${post.id}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ title: "Paivitetty" });
    expect(put.status).toBe(200);
    expect(put.body.title).toBe("Paivitetty");

    const del = await request(app)
      .delete(`/api/v1/posts/${post.id}`)
      .set("Authorization", `Bearer ${mod.accessToken}`);
    expect(del.status).toBe(204);
  });

  it("tuntematon postaus antaa 404 ja virheellinen id 400", async () => {
    const { accessToken } = await createTestUser();
    expect((await request(app).get("/api/v1/posts/999999")).status).toBe(404);
    expect(
      (await request(app).put("/api/v1/posts/abc").set("Authorization", `Bearer ${accessToken}`).send({ title: "x" })).status,
    ).toBe(400);
  });
});
