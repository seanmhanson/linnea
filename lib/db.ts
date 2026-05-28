import { MongoClient } from "mongodb";
import type { Collection, Db } from "mongodb";
import type { Observation } from "@/types/observation";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Missing environment variable: "MONGODB_URI"');
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientPromise: Promise<MongoClient> =
  process.env.NODE_ENV === "development"
    ? (globalThis._mongoClientPromise ??= new MongoClient(uri).connect())
    : new MongoClient(uri).connect();

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export const OBSERVATIONS_VALIDATOR = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "commonName",
      "scientificName",
      "observedAt",
      "images",
      "cultivated",
      "confidence",
      "locationName",
      "createdAt",
    ],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      commonName: { bsonType: "string" },
      scientificName: { bsonType: "string" },
      taxonId: { bsonType: ["double", "int", "long"] },
      locationName: { bsonType: "string" },
      observedAt: { bsonType: "date" },
      cultivated: { bsonType: "bool" },
      images: {
        bsonType: "array",
        items: { bsonType: "string" },
        minItems: 1,
      },
      confidence: { bsonType: "string", enum: ["high", "medium", "low"] },
      identificationNotes: { bsonType: "string" },
      description: { bsonType: "string" },
      inatTaxonId: { bsonType: ["double", "int", "long"] },
      createdAt: { bsonType: "date" },
    },
  },
};

let schemaSetupPromise: Promise<void> | null = null;

async function setupCollections(): Promise<void> {
  const db = await getDb();
  const existing = await db.listCollections({ name: "observations" }).toArray();
  if (existing.length === 0) {
    await db.createCollection("observations", { validator: OBSERVATIONS_VALIDATOR });
  } else {
    await db.command({ collMod: "observations", validator: OBSERVATIONS_VALIDATOR });
  }
}

export function ensureCollections(): Promise<void> {
  if (!schemaSetupPromise) {
    schemaSetupPromise = setupCollections().catch((err) => {
      schemaSetupPromise = null;
      throw err;
    });
  }
  return schemaSetupPromise;
}

export async function getObservationsCollection(): Promise<Collection<Observation>> {
  await ensureCollections();
  const db = await getDb();
  return db.collection<Observation>("observations");
}
