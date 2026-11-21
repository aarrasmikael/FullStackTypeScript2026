// Virheet, jotka halutaan näyttää asiakkaalle (esim. väärät tunnukset tai varattu sähköposti).
// generalErrorHandler muuttaa näiden vastauksen koodiksi 400.
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
