import { WithId } from "mongodb";

type ConfidenceLevel = "high" | "medium" | "low";

type Observation = {
  commonName: string;
  scientificName: string;
  taxonId?: number;
  locationName: string;
  observedAt: Date;
  cultivated: boolean;
  images: string[];
  confidence: ConfidenceLevel;
  identificationNotes?: string;
  description?: string;
  inatTaxonId?: number;
  createdAt: Date;
};

type ObservationDocument = WithId<Observation>;

export type { ConfidenceLevel, Observation, ObservationDocument };
