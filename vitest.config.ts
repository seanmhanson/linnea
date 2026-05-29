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
          name: "unit",
          include: ["src/**/__tests__/*.spec.ts", "src/**/__tests__/*.spec.tsx"],
          environment: "node",
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
        },
      },
    ],
  },
});
