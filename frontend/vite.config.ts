import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig(({ command }) => {
  const environment = loadEnv(command === "serve" ? "development" : "production", rootDirectory, "");
  const mutationToken = environment.ARTSHIELD_MUTATION_TOKEN;
  const mutationRole = environment.ARTSHIELD_MUTATION_ROLE ?? "operator";

  return {
    envDir: rootDirectory,
    plugins: [react()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
      // This development-only proxy keeps the local demo credential on the Vite
      // server. It is not a VITE_ variable and is never bundled for the browser.
      proxy: mutationToken
        ? {
            "/api": {
              target: process.env.LOCAL_BACKEND_URL ?? environment.LOCAL_BACKEND_URL ?? "http://localhost:3000",
              changeOrigin: true,
              headers: {
                authorization: `Bearer ${mutationToken}`,
                "x-artshield-role": mutationRole,
              },
            },
          }
        : undefined,
    },
  };
});
