import { ObjectId } from "mongodb";
import { getObservationsCollection } from "@/lib/db";
import type { Observation, ObservationDocument } from "@/types/observation";

export type CreateObservationInput = Omit<Observation, "createdAt">;

export function parseObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function create(input: CreateObservationInput): Promise<ObservationDocument> {
  const collection = await getObservationsCollection();
  const doc: Observation = { ...input, createdAt: new Date() };
  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function findAll(): Promise<ObservationDocument[]> {
  const collection = await getObservationsCollection();
  return collection.find().sort({ observedAt: -1 }).toArray();
}

export async function findOne(id: string): Promise<ObservationDocument | null> {
  const objectId = parseObjectId(id);
  if (!objectId) return null;
  const collection = await getObservationsCollection();
  return collection.findOne({ _id: objectId });
}
