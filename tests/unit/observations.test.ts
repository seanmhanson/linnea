import { describe, it, expect, vi } from "vitest";

// Mock lib/db entirely to prevent module-level MONGODB_URI check and connection attempt
vi.mock("@/lib/db", () => ({
  default: Promise.resolve({}),
  getObservationsCollection: vi.fn(),
  ensureCollections: vi.fn().mockResolvedValue(undefined),
}));

import { parseObjectId } from "@/lib/observations";

describe("parseObjectId", () => {
  it("returns an ObjectId for a valid 24-char hex string", () => {
    const result = parseObjectId("507f1f77bcf86cd799439011");
    expect(result).not.toBeNull();
    expect(result?.toHexString()).toBe("507f1f77bcf86cd799439011");
  });

  it("returns null for a non-hex string", () => {
    expect(parseObjectId("not-a-valid-id")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseObjectId("")).toBeNull();
  });

  it("returns null for a string that is too short", () => {
    // 23 chars — one short of the required 24
    expect(parseObjectId("507f1f77bcf86cd7994390a")).toBeNull();
  });

  it("returns null for a string that is too long", () => {
    expect(parseObjectId("507f1f77bcf86cd799439011aa")).toBeNull();
  });
});
