import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// subject
import { Config, defaults, getConfig, resetConfig } from "@/src/util/Config";

type configProperty = {
  configKey: keyof Config;
  envKey: string;
  defaultValue: unknown;
};

const configProperties: configProperty[] = [
  { configKey: "mongoUri", envKey: "MONGODB_URI", defaultValue: defaults.MONGODB_URI },
  { configKey: "dbName", envKey: "DB_NAME", defaultValue: defaults.DB_NAME },
];

describe("src/util/Config", () => {
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
});
