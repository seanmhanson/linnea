import type { WithId } from "mongodb";

export type Confidence = "high" | "medium" | "low";

export interface Observation {
  commonName: string;
  scientificName: string;
  taxonId?: number;
  locationName: string;
  observedAt: Date;
  cultivated: boolean;
  images: string[];
  confidence: Confidence;
  identificationNotes?: string;
  description?: string;
  inatTaxonId?: number;
  createdAt: Date;
}

export type ObservationDocument = WithId<Observation>;
