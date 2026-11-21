import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    // Global omit: salasanan hash ei koskaan pääse mukaan kyselyiden tuloksiin,
    // ellei sitä pyydä erikseen (omit: { password: false }), kuten kirjautumisessa.
    omit: {
      user: {
        password: true,
      },
    },
  });
}

// omit muuttaa paluutyyppiä, joten välimuistin tyyppi johdetaan createPrismaClientista
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
