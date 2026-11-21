import "dotenv/config";
import * as argon2 from "argon2";
import { prisma } from "../src/db.js";

const password = await argon2.hash("password123", { type: argon2.argon2id });

const users = [
  { email: "admin@example.com", username: "Admin", role: "ADMIN" as const },
  { email: "mod@example.com", username: "Moderator", role: "MODERATOR" as const },
  { email: "user@example.com", username: "User", role: "USER" as const },
];

for (const u of users) {
  const user = await prisma.user.upsert({
    where: { email: u.email },
    update: {},
    create: { ...u, password },
  });

  const count = await prisma.post.count({ where: { authorId: user.id } });
  if (count === 0) {
    await prisma.post.create({
      data: {
        title: `Hello from ${u.username}`,
        content: `Ensimmäinen postaus käyttäjältä ${u.username} (rooli ${u.role}).`,
        authorId: user.id,
      },
    });
  }
}

console.log("Seed valmis: admin@example.com / mod@example.com / user@example.com (salasana: password123)");
await prisma.$disconnect();
