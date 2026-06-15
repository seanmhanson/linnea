import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
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

    describe("when ADMIN_PASSWORD is not set", () => {
      let originalPassword: string | undefined;

      beforeEach(() => {
        originalPassword = process.env.ADMIN_PASSWORD;
        delete process.env.ADMIN_PASSWORD;
      });

      afterEach(() => {
        if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
        else process.env.ADMIN_PASSWORD = originalPassword;
      });

      it("returns null when ADMIN_PASSWORD is not set", () => {
        expect(authorizeAdmin("any-password")).toBeNull();
      });
    });
  });
});
