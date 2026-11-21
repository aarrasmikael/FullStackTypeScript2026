import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

// Salaisuudet luetaan vasta kun niitä tarvitaan, jotta dotenv ehtii ladata ne ensin.
// Access- ja refresh-tokenille on omat salaisuutensa: jos toinen vuotaa, toinen on turvassa.
function getSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET") {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set and at least 32 characters long`);
  }
  return new TextEncoder().encode(value);
}

export async function createAccessToken(
  userId: number,
  role: string,
): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret("JWT_ACCESS_SECRET"));
}

export async function createRefreshToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    // jti tekee jokaisesta tokenista uniikin, vaikka ne luotaisiin samalla sekunnilla
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret("JWT_REFRESH_SECRET"));
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret("JWT_ACCESS_SECRET"), {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret("JWT_REFRESH_SECRET"), {
    algorithms: ["HS256"],
  });
  return payload;
}
