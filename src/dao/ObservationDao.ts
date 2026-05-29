import type { Observation, ObservationDocument } from "@/src/mapper/observation";
import { CollectionName } from "@/src/provider/DatabaseProvider";
import type { IDatabaseProvider } from "@/src/provider/DatabaseProvider";
import BaseDao from "./BaseDao";

export type CreateObservationInput = Omit<Observation, "createdAt">;

class ObservationDao extends BaseDao<Observation> {
  public collectionName: CollectionName = "observations";

  constructor(dbProvider: IDatabaseProvider) {
    super(dbProvider);
  }

  public async createObservation(input: CreateObservationInput): Promise<ObservationDocument> {
    const doc: Observation = { ...input, createdAt: new Date() };
    const result = await this.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  public async getAllObservations(): Promise<ObservationDocument[]> {
    return this.findAllSorted({ observedAt: -1 }, "desc");
  }

  public async getObservationById(id: string): Promise<ObservationDocument | null> {
    return this.findOne(id);
  }
}

export default ObservationDao;
