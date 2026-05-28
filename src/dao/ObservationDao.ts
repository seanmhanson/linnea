import type Observation from "@/src/mapper/observation";
import type { ObservationDocument } from "@/src/mapper/observation";
import DatabaseProvider, { CollectionName } from "@/src/provider/DatabaseProvider";
import BaseDao from "./BaseDao";

type DbProvider = typeof DatabaseProvider;

export type CreateObservationInput = Omit<Observation, "createdAt">;

class ObservationDao extends BaseDao<Observation> {
  public collectionName: CollectionName = "observations";

  constructor(dbProvider: DbProvider) {
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
