import * as argon2 from "argon2";
import { prisma } from "../db.js";
import { AuthError } from "../errors.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.js";
import { daysFromNow } from "../utils/dates.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.js";

async function issueTokens(userId: number, role: string) {
  const accessToken = await createAccessToken(userId, role);
  const refreshToken = await createRefreshToken(userId);

  // refresh-token tallennetaan kantaan, jotta se voidaan perua (logout, rotaatio)
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: daysFromNow(7),
    },
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput) {
  const hashedPassword = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
      },
    });
  } catch (error) {
    // P2002 = unique constraint (sähköposti on jo käytössä)
    if ((error as { code?: string })?.code === "P2002") {
      throw new AuthError("An account with this email already exists");
    }
    throw error;
  }

  const { accessToken, refreshToken } = await issueTokens(user.id, user.role);
  return { user, accessToken, refreshToken };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    omit: { password: false },
  });

  // Sama virheviesti kummassakin tapauksessa, jotta käyttäjätunnuksia ei voi arvailla
  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  const validPassword = await argon2.verify(user.password, input.password);
  if (!validPassword) {
    throw new AuthError("Invalid email or password");
  }

  await cleanupExpiredTokens();

  const { accessToken, refreshToken } = await issueTokens(user.id, user.role);
  const { password: _password, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
}

export async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
