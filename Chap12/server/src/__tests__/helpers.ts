import request from "supertest";
import app from "../app.js";
import { prisma } from "../db.js";

export async function resetDb() {
  await prisma.refreshToken.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(
  overrides?: Partial<{ email: string; username: string; password: string }>,
) {
  const userData = {
    email: overrides?.email ?? "test@example.com",
    username: overrides?.username ?? "Test User",
    password: overrides?.password ?? "testpassword123",
  };

  const res = await request(app).post("/api/auth/register").send(userData);

  return {
    user: res.body.user as { id: number; email: string; role: string },
    accessToken: res.body.accessToken as string,
    cookies: res.headers["set-cookie"] as unknown as string[],
    credentials: userData,
  };
}

// Tekee käyttäjästä ADMIN/MODERATOR suoraan kantaan ja kirjautuu uudelleen,
// jotta tokenin role-claim päivittyy
export async function createUserWithRole(
  role: "ADMIN" | "MODERATOR",
  email: string,
) {
  const created = await createTestUser({ email, username: role });
  await prisma.user.update({ where: { id: created.user.id }, data: { role } });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: created.credentials.password });
  return {
    user: created.user,
    accessToken: login.body.accessToken as string,
    cookies: login.headers["set-cookie"] as unknown as string[],
  };
}
