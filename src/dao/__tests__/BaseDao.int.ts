import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ObjectId } from "mongodb";
import type { Document, OptionalUnlessRequiredId, Sort, SortDirection } from "mongodb";

import { DatabaseProvider } from "@/src/provider/DatabaseProvider";

// subject
import BaseDao from "@/src/dao/BaseDao";

type TestDoc = Document & { _id?: ObjectId; value: string };

class TestDao extends BaseDao<TestDoc> {
  public collectionName = "observations" as const;

  public insert(doc: OptionalUnlessRequiredId<TestDoc>) {
    return this.insertOne(doc);
  }
  public all() {
    return this.findAll();
  }
  public allSorted(sort: Sort, direction?: SortDirection) {
    return this.findAllSorted(sort, direction);
  }
  public one(id: string) {
    return this.findOne(id);
  }
}

describe("src/dao/BaseDao", () => {
  let mongod: MongoMemoryServer;
  let provider: DatabaseProvider;
  let dao: TestDao;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    provider = new DatabaseProvider(mongod.getUri(), "testBaseDao");
    dao = new TestDao(provider);
  });

  afterAll(async () => {
    await provider.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    const collection = await provider.getCollection("observations");
    await collection.deleteMany({});
  });

  describe("#getObjectId", () => {
    it("returns an ObjectId for a valid hex string", () => {
      const id = new ObjectId().toHexString();
      const result = BaseDao.getObjectId(id);
      expect(result).toBeInstanceOf(ObjectId);
      expect(result.toHexString()).toBe(id);
    });

    it("throws for an invalid id string", () => {
      expect(() => BaseDao.getObjectId("not-an-object-id")).toThrow("Invalid ObjectId");
    });
  });

  describe("#insertOne", () => {
    it("inserts a document and returns an insertedId", async () => {
      const result = await dao.insert({ value: "alpha" });
      expect(result.insertedId).toBeInstanceOf(ObjectId);
    });

    it("persists the document to the collection", async () => {
      await dao.insert({ value: "persisted" });
      const collection = await provider.getCollection("observations");
      const doc = await collection.findOne({ value: "persisted" } as never);
      expect(doc).toMatchObject({ value: "persisted" });
    });
  });

  describe("#findAll", () => {
    it("returns an empty array when the collection is empty", async () => {
      expect(await dao.all()).toEqual([]);
    });

    it("returns all documents in the collection", async () => {
      await dao.insert({ value: "alpha" });
      await dao.insert({ value: "beta" });
      const results = await dao.all();
      expect(results).toHaveLength(2);
    });
  });

  describe("#findAllSorted", () => {
    it("returns documents in the specified sort order", async () => {
      await dao.insert({ value: "b" });
      await dao.insert({ value: "a" });
      await dao.insert({ value: "c" });
      const results = await dao.allSorted({ value: 1 });
      expect(results.map((d) => d.value)).toEqual(["a", "b", "c"]);
    });
  });

  describe("#findOne", () => {
    it("retrieves a document by its ObjectId", async () => {
      const { insertedId } = await dao.insert({ value: "findme" });
      const result = await dao.one(insertedId.toHexString());
      expect(result).toMatchObject({ value: "findme" });
    });

    it("returns null when no document matches the id", async () => {
      const result = await dao.one(new ObjectId().toHexString());
      expect(result).toBeNull();
    });

    it("throws for an invalid id string", async () => {
      await expect(dao.one("invalid-id")).rejects.toThrow("Invalid ObjectId");
    });
  });
});
