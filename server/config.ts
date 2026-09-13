import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "dev-secret-change-in-production"
    : (() => {
        console.error("FATAL ERROR: JWT_SECRET environment variable is not set in production mode");
        process.exit(1);
      })());

export function getJwtSecret(): string {
  return JWT_SECRET;
}

export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
  } catch {
    return null;
  }
}
