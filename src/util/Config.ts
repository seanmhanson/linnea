import dotenv from "dotenv";
dotenv.config({ quiet: true });

const defaults: Record<string, string> = {
  MONGODB_URI: "mongodb://localhost:27017",
  DB_NAME: "linnea",
} as const;

const requiredKeys = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;
type RequiredKey = (typeof requiredKeys)[number];

export class Config {
  private static instance: Config | null = null;
  public static defaults = defaults;

  public readonly mongoUri: string;
  public readonly dbName: string;
  public readonly cloudinaryCloudName: string;
  public readonly cloudinaryApiKey: string;
  public readonly cloudinaryApiSecret: string;

  private constructor() {
    this.mongoUri = this.getEnvOrDefault("MONGODB_URI");
    this.dbName = this.getEnvOrDefault("DB_NAME");
    this.cloudinaryCloudName = this.getRequired("CLOUDINARY_CLOUD_NAME");
    this.cloudinaryApiKey = this.getRequired("CLOUDINARY_API_KEY");
    this.cloudinaryApiSecret = this.getRequired("CLOUDINARY_API_SECRET");
  }

  private getRequired(key: RequiredKey): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required configuration for ${key}`);
    }
    return value;
  }

  private getEnvOrDefault(key: keyof typeof Config.defaults): string {
    const value = process.env[key] ?? Config.defaults[key];
    if (!value && value !== "") {
      throw new Error(`Missing required configuration for ${key}`);
    }
    return value;
  }

  public static getInstance(): Config {
    Config.instance ??= new Config();
    return Config.instance;
  }

  public static resetInstance(): void {
    Config.defaults = { ...defaults };
    Config.instance = null;
  }
}

const getConfig = () => Config.getInstance();

const resetConfig = () => Config.resetInstance();

export { defaults, getConfig, resetConfig };
