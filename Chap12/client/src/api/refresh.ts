import { authApi } from "./endpoints";
import { setAccessToken } from "./token";

const REFRESH_TIMEOUT_MS = 10_000;

// Yksi yhteinen käynnissä oleva refresh. Jos usea pyyntö saa 401 yhtäaikaa,
// ne kaikki odottavat samaa promisea. Muuten token rotaatio mitätöisi ensimmäisen
// jälkeen kaikki muut ja palvelin pitäisi niitä varastettuina tokeneina.
let refreshPromise: Promise<boolean> | null = null;

export function attemptTokenRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performRefresh(): Promise<boolean> {
  // Aikaraja, ettei jumittunut refresh jono kaikkia pyyntöjä ikuisesti
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

  try {
    const { accessToken } = await authApi.refresh(controller.signal);
    setAccessToken(accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
