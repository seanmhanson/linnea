import { vi, describe, it, expect } from "vitest";

// Mock MongoClient to prevent real connection attempts when lib/db is imported
vi.mock("mongodb", async (importOriginal) => {
  const mod = await importOriginal<typeof import("mongodb")>();
  return {
    ...mod,
    MongoClient: class MockMongoClient {
      connect() {
        return Promise.resolve(this);
      }
      db() {
        return {};
      }
    },
  };
});

// Stub env before dynamic import so lib/db does not throw
vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/test");

const { OBSERVATIONS_VALIDATOR } = await import("@/lib/db");
const { $jsonSchema } = OBSERVATIONS_VALIDATOR;

describe("OBSERVATIONS_VALIDATOR", () => {
  it("requires all mandatory fields", () => {
    const expectedRequired = [
      "commonName",
      "scientificName",
      "observedAt",
      "images",
      "cultivated",
      "confidence",
      "locationName",
      "createdAt",
    ];
    for (const field of expectedRequired) {
      expect($jsonSchema.required).toContain(field);
    }
  });

  it("does not require optional fields", () => {
    expect($jsonSchema.required).not.toContain("taxonId");
    expect($jsonSchema.required).not.toContain("identificationNotes");
    expect($jsonSchema.required).not.toContain("description");
    expect($jsonSchema.required).not.toContain("inatTaxonId");
  });

  it("constrains confidence to high | medium | low", () => {
    expect($jsonSchema.properties.confidence.enum).toEqual(["high", "medium", "low"]);
  });

  it("requires images array to have at least one item", () => {
    expect($jsonSchema.properties.images.minItems).toBe(1);
  });
});
