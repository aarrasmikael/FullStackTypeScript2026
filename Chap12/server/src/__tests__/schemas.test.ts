import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "../schemas/auth.js";

describe("registerSchema", () => {
  const valid = {
    email: "a@example.com",
    username: "Matti",
    password: "pitkasalasana",
  };

  it("hyvaksyy kelvollisen syötteen", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("hylkää virheellisen sähköpostin", () => {
    expect(registerSchema.safeParse({ ...valid, email: "ei-sahkoposti" }).success).toBe(false);
  });

  it("hylkää liian lyhyen salasanan mutta ei vaadi erikoismerkkeja", () => {
    expect(registerSchema.safeParse({ ...valid, password: "lyhyt" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "aaaaaaaa" }).success).toBe(true);
  });

  it("hylkää yli 128 merkin salasanan", () => {
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(129) }).success).toBe(false);
  });

  it("trimmaa käyttäjänimen ja poistaa tuntemattomat kentät", () => {
    const result = registerSchema.parse({ ...valid, username: "  Matti  ", role: "ADMIN" });
    expect(result.username).toBe("Matti");
    expect("role" in result).toBe(false);
  });
});

describe("loginSchema", () => {
  it("vaatii salasanan", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "" }).success).toBe(false);
  });
});
