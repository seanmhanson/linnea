import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { DatabaseProvider } from "@/src/provider/DatabaseProvider";

describe("DatabaseProvider", () => {
  let mongod: MongoMemoryServer;
  let provider: DatabaseProvider;

  function setupProvider(dbName: string) {
    provider = new DatabaseProvider(mongod.getUri(), dbName);
    return provider;
  }

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await mongod.stop();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await provider?.close();
  });

  describe("constructor", () => {
    it("throws when mongoUri is empty", () => {
      expect(() => new DatabaseProvider("", "testdb")).toThrow(
        "MongoDB URI and database name are required"
      );
    });

    it("throws when dbName is empty", () => {
      expect(() => new DatabaseProvider(mongod.getUri(), "")).toThrow(
        "MongoDB URI and database name are required"
      );
    });
  });

  describe("#connect", () => {
    it("connects to the database and returns a Db instance", async () => {
      setupProvider("connect-test");
      await expect(provider.connect()).resolves.toBeDefined();
    });

    it("returns the same Db instance on repeated calls", async () => {
      setupProvider("connect-cached");

      const first = await provider.connect();
      const second = await provider.connect();
      expect(first).toBe(second);
    });
  });

  describe("#isConnected", () => {
    it("returns false before connecting", async () => {
      setupProvider("connected-false");
      expect(await provider.isConnected()).toBe(false);
    });

    it("returns true after connecting", async () => {
      setupProvider("connected-true");
      await provider.connect();
      expect(await provider.isConnected()).toBe(true);
    });

    it("returns false after closing", async () => {
      setupProvider("connected-closed");
      await provider.connect();
      await provider.close();
      expect(await provider.isConnected()).toBe(false);
    });
  });

  describe("#close", () => {
    it("does not throw when called before connecting", async () => {
      setupProvider("close-never-connected");
      await expect(provider.close()).resolves.toBeUndefined();
    });
  });

  describe("#getCollection", () => {
    it("returns a collection that supports insert and query", async () => {
      setupProvider("getcollection-test");
      const collection = await provider.getCollection("observations");
      await collection.insertOne({ name: "test" } as never);
      const result = await collection.findOne({ name: "test" } as never);
      expect(result).toMatchObject({ name: "test" });
    });
  });

  describe("#createCollections", () => {
    it("creates the observations collection", async () => {
      setupProvider("create-collections-test");
      await provider.createCollections();
      const db = await provider.connect();
      const names = await db.listCollections().toArray();
      expect(names.map((c) => c.name)).toContain("observations");
    });
  });

  describe("#resetDatabase", () => {
    it("throws in production environment", async () => {
      vi.stubEnv("NODE_ENV", "production");
      setupProvider("reset-prod-test");
      await expect(provider.resetDatabase()).rejects.toThrow(
        "Database reset is not allowed in production environment"
      );
    });

    it("drops all collections in non-production", async () => {
      setupProvider("reset-test");
      const collection = await provider.getCollection("observations");
      await collection.insertOne({ name: "to-be-dropped" } as never);
      await provider.resetDatabase();
      const db = await provider.connect();
      const collections = await db.listCollections().toArray();
      expect(collections).toHaveLength(0);
    });
  });
});
