import type { NextFunction, Request, Response } from "express";

// Ylemmän asteen funktio: palauttaa middlewaren, joka sallii vain annetut roolit.
// Käytä aina authenticaten jälkeen, koska req.user asetetaan siellä.
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Forbidden" });
      return;
    }
    next();
  };
}
