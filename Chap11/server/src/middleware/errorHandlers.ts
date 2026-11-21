import type { NextFunction, Request, Response } from "express";
import { AuthError } from "../errors.js";

// Prisma-virheet tunnistetaan koodista, jotta importtina ei tarvita generoitua luokkaa
function isPrismaKnownError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    /^P\d{4}$/.test((err as { code: string }).code)
  );
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
}

export function prismaErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isPrismaKnownError(err)) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "NOT_FOUND", message: "Resource not found" });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({ error: "CONFLICT", message: "Resource already exists" });
      return;
    }
  }
  next(err);
}

export function generalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AuthError) {
    res.status(400).json({ error: "AUTH_ERROR", message: err.message });
    return;
  }

  // body-parser: liian suuri body (413), rikkinäinen JSON (400)
  const status = (err as { status?: number })?.status;
  if (status === 413 || status === 400) {
    res.status(status).json({
      error: status === 413 ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
      message: status === 413 ? "Request body too large" : "Malformed request body",
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "Internal server error" });
}
