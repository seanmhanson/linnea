import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ObjectId } from "mongodb";
import { DatabaseProvider } from "@/src/provider/DatabaseProvider";
import ObservationDao, { type CreateObservationInput } from "@/src/dao/ObservationDao";

const baseInput: CreateObservationInput = {
  commonName: "Northern Cardinal",
  scientificName: "Cardinalis cardinalis",
  locationName: "Backyard",
  observedAt: new Date("2025-06-01"),
  cultivated: false,
  images: ["https://example.com/cardinal.jpg"],
  confidence: "high",
};

let mongod: MongoMemoryServer;
let provider: DatabaseProvider;
let dao: ObservationDao;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  provider = new DatabaseProvider(mongod.getUri(), "test-observations");
  dao = new ObservationDao(provider);
});

afterAll(async () => {
  await provider.close();
  await mongod.stop();
});

beforeEach(async () => {
  const collection = await provider.getCollection("observations");
  await collection.deleteMany({});
});

describe("ObservationDao", () => {
  describe("createObservation", () => {
    it("returns a document with an _id and createdAt", async () => {
      const result = await dao.createObservation(baseInput);
      expect(result._id).toBeInstanceOf(ObjectId);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("persists the observation to the collection", async () => {
      const { _id } = await dao.createObservation(baseInput);
      const found = await dao.getObservationById(_id.toHexString());
      expect(found).toMatchObject({ commonName: "Northern Cardinal" });
    });
  });

  describe("getAllObservations", () => {
    it("returns an empty array when there are no observations", async () => {
      expect(await dao.getAllObservations()).toEqual([]);
    });

    it("returns all observations sorted by observedAt descending", async () => {
      await dao.createObservation({ ...baseInput, observedAt: new Date("2025-01-01") });
      await dao.createObservation({ ...baseInput, observedAt: new Date("2025-06-01") });
      await dao.createObservation({ ...baseInput, observedAt: new Date("2025-03-01") });

      const results = await dao.getAllObservations();
      const dates = results.map((r) => r.observedAt.toISOString());
      expect(dates).toEqual([...dates].sort().reverse());
    });
  });

  describe("getObservationById", () => {
    it("returns the matching observation", async () => {
      const { _id } = await dao.createObservation(baseInput);
      const result = await dao.getObservationById(_id.toHexString());
      expect(result).toMatchObject({ commonName: "Northern Cardinal" });
    });

    it("returns null when no observation matches the id", async () => {
      const result = await dao.getObservationById(new ObjectId().toHexString());
      expect(result).toBeNull();
    });
  });
});
