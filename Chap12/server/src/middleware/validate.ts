import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: details[0]?.message ?? "Validation failed",
        details,
      });
      return;
    }

    // korvataan body validoidulla datalla (esim. trim ja tuntemattomat kentät pois)
    req.body = result.data;
    next();
  };
}
