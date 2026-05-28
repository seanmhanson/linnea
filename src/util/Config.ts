import dotenv from "dotenv";
dotenv.config({ quiet: true });

const defaults: Record<string, string> = {
  MONGODB_URI: "mongodb://localhost:27017",
  DB_NAME: "linnea",
} as const;

export class Config {
  private static instance: Config | null = null;
  public static defaults = defaults;

  public readonly mongoUri: string;
  public readonly dbName: string;

  private constructor() {
    this.mongoUri = this.getEnvOrDefault("MONGODB_URI");
    this.dbName = this.getEnvOrDefault("DB_NAME");
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
