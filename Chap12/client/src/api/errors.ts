// Sessio on loppu (refresh epäonnistui): käyttäjä pitää ohjata kirjautumaan uudelleen
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Kaikki muut pyyntövirheet, mukana HTTP status
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
