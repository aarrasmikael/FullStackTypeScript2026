import { errors } from "jose";
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Missing or invalid authorization header",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verifyAccessToken(token);
    req.user = {
      id: Number(payload.sub),
      role: String(payload.role),
    };
    next();
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      // frontend yrittää tämän jälkeen hiljaista refreshia
      res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Access token has expired",
      });
      return;
    }
    res.status(401).json({
      error: "INVALID_TOKEN",
      message: "Invalid access token",
    });
  }
}
