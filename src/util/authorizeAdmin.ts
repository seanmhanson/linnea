import "server-only";
import { createHash, timingSafeEqual } from "crypto";

type AdminUser = { id: string; name: string };

function authorizeAdmin(password: string | undefined): AdminUser | null {
  if (!simplePasswordCheck(password)) {
    return null;
  }
  return { id: "admin", name: "Admin" };
}

/**
 * This is a very simple password check for MVP purposes.
 * TODO: replace with a more robust auth mechanism (multi-user, rate limiting) and store a *hashed* password (e.g., argon2/bcrypt) rather than a plaintext env var.
 *
 * @param password - the password to check against the expected admin password
 * @returns boolean indicating if the password is correct
 */
function simplePasswordCheck(password: string | undefined) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!password || !expectedPassword) {
    return false;
  }

  const hashedPassword = createHash("sha256").update(password).digest();
  const hashedExpectedPassword = createHash("sha256").update(expectedPassword).digest();
  return timingSafeEqual(hashedPassword, hashedExpectedPassword);
}

export { authorizeAdmin };
export type { AdminUser };
