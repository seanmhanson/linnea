import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: "unit-node",
          include: [
            "src/**/__tests__/*.spec.ts",
            "src/**/__tests__/*.spec.tsx",
            "lib/**/__tests__/*.spec.ts",
            "lib/**/__tests__/*.spec.tsx",
          ],
          environment: "node",
          alias: {
            "server-only": "@/src/util/__mocks__/server-only.ts",
          },
        },
      },
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: "unit-dom",
          include: ["components/**/__tests__/*.spec.ts", "components/**/__tests__/*.spec.tsx"],
          environment: "jsdom",
          alias: {
            "server-only": "@/src/util/__mocks__/server-only.ts",
          },
        },
      },
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: "integration",
          include: ["src/**/__tests__/*.int.ts", "src/**/__tests__/*.int.tsx"],
          environment: "node",
          alias: {
            "server-only": "@/src/util/__mocks__/server-only.ts",
          },
        },
      },
    ],
  },
});
