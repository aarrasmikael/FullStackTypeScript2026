import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

describe("JWT utils", () => {
  it("access token sisältää sub-, role- ja exp-claimit", async () => {
    const token = await createAccessToken(42, "ADMIN");
    const payload = await verifyAccessToken(token);

    expect(payload.sub).toBe("42");
    expect(payload.role).toBe("ADMIN");
    expect(payload.jti).toBeDefined();
    expect(payload.exp! - payload.iat!).toBe(15 * 60);
  });

  it("refresh token sisältää vain käyttäjän id:n ja kestää 7 päivää", async () => {
    const token = await createRefreshToken(7);
    const payload = await verifyRefreshToken(token);

    expect(payload.sub).toBe("7");
    expect(payload.role).toBeUndefined();
    expect(payload.exp! - payload.iat!).toBe(7 * 24 * 60 * 60);
  });

  it("samalle käyttäjälle luodut tokenit ovat uniikkeja (jti)", async () => {
    const a = await createRefreshToken(1);
    const b = await createRefreshToken(1);
    expect(a).not.toBe(b);
  });

  it("access ja refresh -tokenia ei voi vaihtaa keskenaan (eri salaisuudet)", async () => {
    const access = await createAccessToken(1, "USER");
    const refresh = await createRefreshToken(1);

    await expect(verifyRefreshToken(access)).rejects.toThrow();
    await expect(verifyAccessToken(refresh)).rejects.toThrow();
  });

  it("muokattu payload hylätään allekirjoituksen takia", async () => {
    const token = await createAccessToken(1, "USER");
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "1", role: "ADMIN", exp: 9999999999 }),
    ).toString("base64url");

    await expect(
      verifyAccessToken(`${header}.${forgedPayload}.${signature}`),
    ).rejects.toThrow();
  });

  it("vanhentunut token hylätään", async () => {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const expired = await new SignJWT({ role: "USER" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("1")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secret);

    await expect(verifyAccessToken(expired)).rejects.toMatchObject({
      code: "ERR_JWT_EXPIRED",
    });
  });
});
