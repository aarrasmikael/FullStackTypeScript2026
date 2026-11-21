import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createPostSchema, updatePostSchema } from "../schemas/posts.js";

const router = Router();

const authorSelect = { select: { id: true, username: true } } as const;

function parseId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "INVALID_ID", message: "Invalid id" });
    return null;
  }
  return id;
}

// Roolitaulukko: ADMIN ja MODERATOR saavat muokata ja poistaa kaikkia, USER vain omiaan
function canModify(user: NonNullable<Request["user"]>, authorId: number) {
  return (
    user.id === authorId || user.role === "ADMIN" || user.role === "MODERATOR"
  );
}

// Julkiset
router.get("/api/v1/posts", async (_req: Request, res: Response) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: authorSelect },
  });
  res.json({ data: posts, total: posts.length });
});

router.get("/api/v1/posts/:id", async (req: Request, res: Response) => {
  const id = parseId(req, res);
  if (id === null) return;

  const post = await prisma.post.findUniqueOrThrow({
    where: { id },
    include: { author: authorSelect },
  });
  res.json(post);
});

// Vaatii kirjautumisen
router.post(
  "/api/v1/posts",
  authenticate,
  validate(createPostSchema),
  async (req: Request, res: Response) => {
    // authorId tulee tokenista, ei clientin lähettämästä bodysta
    const post = await prisma.post.create({
      data: { ...req.body, authorId: req.user!.id },
      include: { author: authorSelect },
    });
    res.status(201).json(post);
  },
);

// Vaatii kirjautumisen + omistajuuden (tai ADMIN/MODERATOR)
router.put(
  "/api/v1/posts/:id",
  authenticate,
  validate(updatePostSchema),
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (id === null) return;

    const post = await prisma.post.findUniqueOrThrow({ where: { id } });
    if (!canModify(req.user!, post.authorId)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Forbidden" });
      return;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: req.body,
      include: { author: authorSelect },
    });
    res.json(updated);
  },
);

router.delete(
  "/api/v1/posts/:id",
  authenticate,
  async (req: Request, res: Response) => {
    const id = parseId(req, res);
    if (id === null) return;

    const post = await prisma.post.findUniqueOrThrow({ where: { id } });
    if (!canModify(req.user!, post.authorId)) {
      res.status(403).json({ error: "FORBIDDEN", message: "Forbidden" });
      return;
    }

    await prisma.post.delete({ where: { id } });
    res.status(204).send();
  },
);

export default router;
