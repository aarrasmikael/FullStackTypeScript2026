import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/posts.js";

const router = Router();

// Kuka tahansa kirjautunut käyttäjä: oma profiili (id tulee tokenista, ei URL:sta)
router.get("/api/v1/users/me", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
  });
  res.json(user);
});

router.put(
  "/api/v1/users/me",
  authenticate,
  validate(updateProfileSchema),
  async (req: Request, res: Response) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { username: req.body.username },
    });
    res.json(user);
  },
);

// Vain ADMIN
router.get(
  "/api/v1/users",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    res.json(users);
  },
);

router.delete(
  "/api/v1/users/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "INVALID_ID", message: "Invalid id" });
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  },
);

export default router;
