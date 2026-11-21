import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import {
  generalErrorHandler,
  notFoundHandler,
  prismaErrorHandler,
} from "./middleware/errorHandlers.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";

export interface AppOptions {
  rateLimiting?: boolean;
}

export function createApp({ rateLimiting = true }: AppOptions = {}): Express {
  const app = express();

  // 1. Tietoturvaotsikot ensimmäisenä, jotta ne tulevat kaikkiin vastauksiin
  app.use(helmet());

  // CORS: selain sallii frontendin (eri portti = eri origin) lukea vastaukset.
  // credentials: true tarvitaan, jotta refresh token eväste kulkee pyyntöjen mukana.
  // Wildcard (*) ei käy credentialsin kanssa, joten origin on aina nimetty.
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    }),
  );

  // 2. Rate limiting ennen bodyn parsimista: liialliset pyynnöt hylätään ajoissa
  if (rateLimiting) {
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    });
    // Tiukka raja kirjautumiselle ja rekisteröinnille: vain epäonnistuneet yritykset lasketaan.
    // Kummallakin oma laskuri, jotta toinen ei kuluta toisen rajaa.
    const strictLimiter = () =>
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        skipSuccessfulRequests: true,
      });
    // Refresh on yhtä arkaluontoinen (varastettua tokenia voi yrittää), mutta kirjautumaton
    // käyttäjä kutsuu sitä jokaisella sivun latauksella ilman evästettä. Evästeettömät pyynnöt
    // ohitetaan, koska niillä ei ole tokenia arvattavaksi.
    const refreshLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      skip: (req) => !req.headers.cookie?.includes("refreshToken="),
    });

    app.use("/api", apiLimiter);
    app.use("/api/auth/login", strictLimiter());
    app.use("/api/auth/register", strictLimiter());
    app.use("/api/auth/refresh", refreshLimiter);
  }

  // 3. Bodyn parsiminen kokorajalla ja evästeet
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  // 4. Reitit (jokainen reitti määrittelee itse tarvitsevatko ne authenticate/authorize)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use(authRoutes);
  app.use(userRoutes);
  app.use(postRoutes);

  // 5. Virheenkäsittely viimeisenä
  app.use(notFoundHandler);
  app.use(prismaErrorHandler);
  app.use(generalErrorHandler);

  return app;
}

// Oletusinstanssi (testit tuovat tämän): rate limiting pois testiajossa
const app = createApp({ rateLimiting: process.env.NODE_ENV !== "test" });
export default app;
