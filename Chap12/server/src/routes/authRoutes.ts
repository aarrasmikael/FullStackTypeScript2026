import { Router, type Request, type Response } from "express";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import { loginUser, registerUser } from "../services/authService.js";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../utils/cookies.js";
import { daysFromNow } from "../utils/dates.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const router = Router();

router.post(
  "/api/auth/register",
  validate(registerSchema),
  async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await registerUser(req.body);
    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  },
);

router.post(
  "/api/auth/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await loginUser(req.body);
    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ user, accessToken });
  },
);

// Refresh: tarkista allekirjoitus -> tarkista kanta (peruutus) -> rotaatio transaktiossa
router.post("/api/auth/refresh", async (req: Request, res: Response) => {
  const oldToken = req.cookies?.refreshToken as string | undefined;

  if (!oldToken) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "No refresh token" });
    return;
  }

  try {
    const payload = await verifyRefreshToken(oldToken);
    const userId = Number(payload.sub);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!storedToken) {
      // Allekirjoitus on aito mutta tokenia ei löydy: se on jo käytetty (rotaatio) tai peruttu.
      // Mahdollinen varastettu token, joten perutaan käyttäjän kaikki istunnot varmuuden vuoksi.
      await prisma.refreshToken.deleteMany({ where: { userId } });
      clearRefreshTokenCookie(res);
      res.status(401).json({ error: "TOKEN_REVOKED", message: "Refresh token revoked" });
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      clearRefreshTokenCookie(res);
      res.status(401).json({ error: "TOKEN_REVOKED", message: "Refresh token expired" });
      return;
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const accessToken = await createAccessToken(user.id, user.role);
    const newRefreshToken = await createRefreshToken(user.id);

    // Rotaatio: vanha pois ja uusi sisään joko kokonaan tai ei lainkaan
    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({ where: { id: storedToken.id } });
      await tx.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: daysFromNow(7),
        },
      });
    });

    setRefreshTokenCookie(res, newRefreshToken);
    res.json({ accessToken });
  } catch {
    // vanhentunut tai virheellinen allekirjoitus (jose heittää) -> 401, ei 500
    clearRefreshTokenCookie(res);
    res.status(401).json({ error: "INVALID_TOKEN", message: "Invalid refresh token" });
  }
});

router.post("/api/auth/logout", async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;

  if (token) {
    // deleteMany ei heita, vaikka tokenia ei enää olisi
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  clearRefreshTokenCookie(res);
  res.status(204).send();
});

// Kirjaa ulos kaikilta laitteilta
router.delete(
  "/api/auth/sessions",
  authenticate,
  async (req: Request, res: Response) => {
    await prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } });
    clearRefreshTokenCookie(res);
    res.status(204).send();
  },
);

export default router;
