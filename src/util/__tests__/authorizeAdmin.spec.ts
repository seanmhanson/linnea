import { describe, it, expect, afterEach, vi } from "vitest";
import { authorizeAdmin } from "@/src/util/authorizeAdmin";

describe("src/util/authorizeAdmin.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("#authorizeAdmin", () => {
    it("returns the admin user when the password matches", () => {
      vi.stubEnv("ADMIN_PASSWORD", "correct-password");
      expect(authorizeAdmin("correct-password")).toEqual({ id: "admin", name: "Admin" });
    });

    it("returns null when the password does not match", () => {
      vi.stubEnv("ADMIN_PASSWORD", "correct-password");
      expect(authorizeAdmin("wrong-password")).toBeNull();
    });

    it("returns null when the password is undefined", () => {
      vi.stubEnv("ADMIN_PASSWORD", "correct-password");
      expect(authorizeAdmin(undefined)).toBeNull();
    });

    it("returns null when ADMIN_PASSWORD is not set", () => {
      delete process.env.ADMIN_PASSWORD;
      expect(authorizeAdmin("any-password")).toBeNull();
    });
  });
});
