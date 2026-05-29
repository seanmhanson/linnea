import type {
  Filter,
  WithId,
  OptionalUnlessRequiredId,
  InsertOneResult,
  Document,
  SortDirection,
  Sort,
} from "mongodb";
import { ObjectId } from "mongodb";
import { CollectionName } from "@/src/provider/DatabaseProvider";
import type { IDatabaseProvider } from "@/src/provider/DatabaseProvider";

type FilterId<T> = Filter<T>["_id"];

abstract class BaseDao<T extends Document & { _id?: ObjectId }> {
  public abstract collectionName: CollectionName;
  protected dbProvider: IDatabaseProvider;

  constructor(dbProvider: IDatabaseProvider) {
    this.dbProvider = dbProvider;
  }

  public static getObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new ObjectId(id);
  }

  protected async getCollection() {
    return this.dbProvider.getCollection<T>(this.collectionName);
  }

  protected async insertOne(doc: OptionalUnlessRequiredId<T>): Promise<InsertOneResult<T>> {
    const collection = await this.getCollection();
    return await collection.insertOne(doc);
  }

  protected async findAll(): Promise<WithId<T>[]> {
    const collection = await this.getCollection();
    return collection.find().toArray();
  }

  protected async findAllSorted(sort: Sort, direction?: SortDirection): Promise<WithId<T>[]> {
    const collection = await this.getCollection();
    return collection.find().sort(sort, direction).toArray();
  }

  protected async findOne(id: string): Promise<WithId<T> | null> {
    const objectId: FilterId<T> = BaseDao.getObjectId(id);
    const collection = await this.getCollection();
    return collection.findOne({ _id: objectId });
  }
}

export default BaseDao;
