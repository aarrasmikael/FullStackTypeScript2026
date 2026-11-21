import type { Response } from "express";

const REFRESH_COOKIE = "refreshToken";

const baseOptions = () =>
  ({
    // JavaScript ei näe evästettä, joten XSS ei voi varastaa tokenia
    httpOnly: true,
    // tuotannossa eväste kulkee vain HTTPS:n yli
    secure: process.env.NODE_ENV === "production",
    // evästettä ei lähetetä toisilta sivustoilta tulevien pyyntöjen mukana (CSRF)
    sameSite: "strict",
    // eväste lähtee vain auth-endpointeille
    path: "/api/auth",
  }) as const;

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions());
}
