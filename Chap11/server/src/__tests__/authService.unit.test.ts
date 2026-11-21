import { beforeEach, describe, expect, it, vi } from "vitest";

// Yksikkötestit mockaavat tietokannan ja argon2:n, joten ne ovat nopeita
const prismaMock = vi.hoisted(() => ({
  user: { create: vi.fn(), findUnique: vi.fn() },
  refreshToken: { create: vi.fn(), deleteMany: vi.fn() },
}));

vi.mock("../db.js", () => ({ prisma: prismaMock }));
vi.mock("argon2", () => ({
  hash: vi.fn().mockResolvedValue("$argon2id$v=19$mocked-hash"),
  verify: vi.fn(),
  argon2id: 2,
}));

import * as argon2 from "argon2";
import { loginUser, registerUser } from "../services/authService.js";

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.refreshToken.create.mockResolvedValue({});
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("hashaa salasanan ja luo käyttäjän sekä tokenit", async () => {
    prismaMock.user.create.mockResolvedValue({
      id: 1,
      email: "new@example.com",
      username: "New User",
      role: "USER",
    });

    const result = await registerUser({
      email: "new@example.com",
      username: "New User",
      password: "securepassword",
    });

    expect(argon2.hash).toHaveBeenCalledWith("securepassword", { type: argon2.argon2id });
    expect(prismaMock.user.create.mock.calls[0][0].data.password).toBe("$argon2id$v=19$mocked-hash");
    expect(result.user.email).toBe("new@example.com");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(prismaMock.refreshToken.create).toHaveBeenCalledOnce();
  });

  it("varattu sähköposti (P2002) muutetaan AuthErroriksi", async () => {
    prismaMock.user.create.mockRejectedValue({ code: "P2002" });

    await expect(
      registerUser({ email: "dup@example.com", username: "Dup", password: "securepassword" }),
    ).rejects.toThrow("An account with this email already exists");
  });

  it("väärä salasana antaa yleisen virheen eikä paljasta kumpi oli väärin", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1, email: "user@example.com", password: "$argon2id$hash", role: "USER",
    });
    vi.mocked(argon2.verify).mockResolvedValue(false);

    await expect(
      loginUser({ email: "user@example.com", password: "wrong" }),
    ).rejects.toThrow("Invalid email or password");
  });

  it("tuntematon sähköposti antaa saman virheen", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      loginUser({ email: "nobody@example.com", password: "whatever" }),
    ).rejects.toThrow("Invalid email or password");
    expect(argon2.verify).not.toHaveBeenCalled();
  });

  it("onnistunut kirjautuminen ei palauta salasanaa", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1, email: "user@example.com", username: "U", password: "$argon2id$hash", role: "USER",
    });
    vi.mocked(argon2.verify).mockResolvedValue(true);

    const result = await loginUser({ email: "user@example.com", password: "right" });

    expect(result.user).not.toHaveProperty("password");
    expect(result.accessToken).toBeDefined();
  });
});
