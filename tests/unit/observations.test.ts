import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

// Mock lib/db entirely to prevent module-level MONGODB_URI check and connection attempt
vi.mock("@/lib/db", () => ({
  default: Promise.resolve({}),
  getObservationsCollection: vi.fn(),
  ensureCollections: vi.fn().mockResolvedValue(undefined),
}));

import { getObservationsCollection } from "@/lib/db";
import { parseObjectId, create, findAll, findOne } from "@/lib/observations";

const mockCollection = {
  insertOne: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getObservationsCollection).mockResolvedValue(mockCollection as never);
});

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

describe("create", () => {
  it("stamps createdAt, inserts the document, and returns it with _id", async () => {
    const insertedId = new ObjectId("507f1f77bcf86cd799439011");
    mockCollection.insertOne.mockResolvedValue({ insertedId });

    const input = {
      commonName: "Common Dandelion",
      scientificName: "Taraxacum officinale",
      locationName: "Central Park",
      observedAt: new Date("2024-06-01T12:00:00Z"),
      cultivated: false,
      images: ["https://example.com/img.jpg"],
      confidence: "high" as const,
    };

    const before = Date.now();
    const result = await create(input);
    const after = Date.now();

    expect(mockCollection.insertOne).toHaveBeenCalledOnce();
    const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
    expect(insertedDoc.createdAt).toBeInstanceOf(Date);
    expect(insertedDoc.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(insertedDoc.createdAt.getTime()).toBeLessThanOrEqual(after);

    expect(result._id).toBe(insertedId);
    expect(result.commonName).toBe(input.commonName);
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});

describe("findAll", () => {
  it("returns all documents sorted by observedAt descending", async () => {
    const docs = [
      { _id: new ObjectId(), commonName: "A", observedAt: new Date("2024-06-02") },
      { _id: new ObjectId(), commonName: "B", observedAt: new Date("2024-06-01") },
    ];
    const mockCursor = { sort: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue(docs) };
    mockCollection.find.mockReturnValue(mockCursor);

    const result = await findAll();

    expect(mockCollection.find).toHaveBeenCalledOnce();
    expect(mockCursor.sort).toHaveBeenCalledWith({ observedAt: -1 });
    expect(result).toBe(docs);
  });
});

describe("findOne", () => {
  it("returns the document when a valid id matches", async () => {
    const doc = { _id: new ObjectId("507f1f77bcf86cd799439011"), commonName: "A" };
    mockCollection.findOne.mockResolvedValue(doc);

    const result = await findOne("507f1f77bcf86cd799439011");

    expect(mockCollection.findOne).toHaveBeenCalledOnce();
    expect(result).toBe(doc);
  });

  it("returns null and does not query for an invalid id", async () => {
    const result = await findOne("not-a-valid-id");

    expect(mockCollection.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
