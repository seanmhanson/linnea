import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "unit",
          include: ["src/**/__tests__/*.spec.ts", "src/**/__tests__/*.spec.tsx"],
          environment: "node",
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "integration",
          include: ["src/**/__tests__/*.int.ts", "src/**/__tests__/*.int.tsx"],
          environment: "node",
        },
      },
    ],
  },
});
