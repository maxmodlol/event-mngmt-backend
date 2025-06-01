import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export function signJwt(
  payload: object,
  expiresIn: SignOptions["expiresIn"] = "7d"
): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET as Secret, options);
}

export function verifyJwt<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET as Secret) as T;
  } catch {
    return null;
  }
}
