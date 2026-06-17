import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// subject
import { Config, defaults, getConfig, resetConfig } from "@/src/util/Config";

type configProperty = {
  configKey: keyof Config;
  envKey: string;
  defaultValue: unknown;
};

type requiredProperty = {
  configKey: keyof Config;
  envKey: string;
};

const configProperties: configProperty[] = [
  { configKey: "mongoUri", envKey: "MONGODB_URI", defaultValue: defaults.MONGODB_URI },
  { configKey: "dbName", envKey: "DB_NAME", defaultValue: defaults.DB_NAME },
];

const requiredProperties: requiredProperty[] = [
  { configKey: "cloudinaryCloudName", envKey: "CLOUDINARY_CLOUD_NAME" },
  { configKey: "cloudinaryApiKey", envKey: "CLOUDINARY_API_KEY" },
  { configKey: "cloudinaryApiSecret", envKey: "CLOUDINARY_API_SECRET" },
];

describe("src/util/Config", () => {
  beforeEach(() => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "test-api-key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetConfig();
  });

  describe("#getConfig", () => {
    it("returns a Config instance", () => {
      expect(getConfig()).toBeInstanceOf(Config);
    });

    it("returns the same instance on repeated calls", () => {
      expect(getConfig()).toBe(getConfig());
    });

    it("returns a new instance after reset", () => {
      const first = getConfig();
      resetConfig();
      expect(getConfig()).not.toBe(first);
    });
  });

  describe("when reading configuration properties", () => {
    const properties = configProperties;

    properties.forEach(({ configKey, envKey, defaultValue }) => {
      const testValue = `test-${configKey}`;

      it(`returns the ${configKey} property from the environment`, () => {
        vi.stubEnv(envKey, testValue);
        expect(getConfig()[configKey]).toBe(testValue);
      });

      describe("and the environment variable is unset", () => {
        let savedEnvValue: string | undefined;

        beforeEach(() => {
          savedEnvValue = process.env[envKey];
          delete process.env[envKey];
        });

        afterEach(() => {
          if (savedEnvValue !== undefined) {
            process.env[envKey] = savedEnvValue;
          }
        });

        it(`returns the default value for ${configKey}`, () => {
          expect(getConfig()[configKey]).toBe(defaultValue);
        });
      });
    });
  });

  describe("when reading required configuration properties", () => {
    requiredProperties.forEach(({ configKey, envKey }) => {
      const testValue = `test-${configKey}`;

      it(`returns the ${configKey} property from the environment`, () => {
        vi.stubEnv(envKey, testValue);
        expect(getConfig()[configKey]).toBe(testValue);
      });

      describe(`and ${envKey} is unset`, () => {
        let savedEnvValue: string | undefined;

        beforeEach(() => {
          savedEnvValue = process.env[envKey];
          delete process.env[envKey];
        });

        afterEach(() => {
          if (savedEnvValue !== undefined) {
            process.env[envKey] = savedEnvValue;
          }
        });

        it(`throws when ${configKey} is missing`, () => {
          expect(() => getConfig()[configKey]).toThrow(
            `Missing required configuration for ${envKey}`
          );
        });
      });
    });
  });
});
