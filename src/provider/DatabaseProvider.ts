import { MongoClient } from "mongodb";
import type { Collection, Db, Document } from "mongodb";
import observationSchema from "@/src/mapper/observation.schema";
import { getConfig } from "@/src/util/Config";

const COLLECTIONS = [{ name: "observations", $jsonSchema: observationSchema }] as const;

export type CollectionName = (typeof COLLECTIONS)[number]["name"];
export const VALID_COLLECTION_NAMES: readonly CollectionName[] = Object.freeze(
  COLLECTIONS.map((c) => c.name)
);

export class DatabaseProvider {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private get uri(): string {
    return this.mongoUri;
  }

  constructor(
    private mongoUri: string = getConfig().mongoUri,
    private dbName: string = getConfig().dbName
  ) {
    if (!this.mongoUri || !this.dbName) {
      throw new Error("MongoDB URI and database name are required");
    }
  }

  async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.info("Connected to MongoDB");
      return this.db;
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  public async isConnected(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.db("admin").admin().ping();
      return true;
    } catch (error) {
      console.error("MongoDB connection check failed:", error);
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.info("MongoDB connection closed");
    }
  }

  public async getCollection<T extends Document>(name: CollectionName): Promise<Collection<T>> {
    const database = await this.connect();
    return database.collection<T>(name);
  }

  public async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Database reset is not allowed in production environment");
    }

    const database = await this.connect();
    try {
      await database.dropDatabase();
      console.info(`Database "${this.dbName}" has been reset`);
    } catch (error) {
      console.error("Failed to reset database:", error);
      throw error;
    }
  }

  public async createCollections(): Promise<void> {
    const database = await this.connect();

    for (const { name, $jsonSchema } of COLLECTIONS) {
      const exists = await database.listCollections({ name }).hasNext();
      if (exists) {
        await database.command({
          collMod: name,
          validator: { $jsonSchema },
          validationAction: "error",
          validationLevel: "strict",
        });
        console.info(`   - Collection '${name}' already exists; validator updated`);
        continue;
      }

      await database.createCollection(name, {
        validator: { $jsonSchema },
        validationAction: "error",
        validationLevel: "strict",
      });
      console.info(`   - Collection '${name}' created successfully`);
    }
    console.info("Collection creation complete");
  }

  public async initDatabase(): Promise<void> {
    try {
      await this.connect();
      await this.createCollections();
      // await this.createIndexes();
      console.info("Database initialization complete");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }
}

export default new DatabaseProvider();

export type IDatabaseProvider = {
  [K in keyof InstanceType<typeof DatabaseProvider>]: InstanceType<typeof DatabaseProvider>[K];
};
