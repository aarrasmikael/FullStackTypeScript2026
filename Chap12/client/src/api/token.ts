// Access token elää vain tämän moduulin muuttujassa eli JavaScriptin muistissa.
// Se ei mene localStorageen tai sessionStorageen, joista XSS hyökkäys voisi lukea sen.
// let on moduulin sisällä, joten se ei päädy window-olioon.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Kun sessio päättyy kesken kaiken (refresh epäonnistuu), API client kertoo siitä
// Reduxille tämän kautta. Store rekisteröi kuuntelijan, joten api-kansio ei tunne Reduxia.
let authFailureHandler: (() => void) | null = null;

export function setAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

export function notifyAuthFailure(): void {
  authFailureHandler?.();
}
