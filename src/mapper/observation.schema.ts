const observationSchema = {
  bsonType: "object",
  required: [
    "commonName",
    "scientificName",
    "observedAt",
    "image",
    "cultivated",
    "confidence",
    "locationName",
    "createdAt",
  ],
  additionalProperties: true,
  properties: {
    commonName: { bsonType: "string" },
    scientificName: { bsonType: "string" },
    taxonId: { bsonType: ["double", "int", "long"] },
    locationName: { bsonType: "string" },
    observedAt: { bsonType: "date" },
    cultivated: { bsonType: "bool" },
    image: { bsonType: "string", minLength: 1 },
    confidence: { bsonType: "string", enum: ["high", "medium", "low"] },
    identificationNotes: { bsonType: "string" },
    description: { bsonType: "string" },
    inatTaxonId: { bsonType: ["double", "int", "long"] },
    createdAt: { bsonType: "date" },
  },
};

export default observationSchema;
