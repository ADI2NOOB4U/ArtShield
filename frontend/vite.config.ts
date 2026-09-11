import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const frontendDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(frontendDirectory, "..");

export default defineConfig(({ command }) => {
  const environment = loadEnv(command === "serve" ? "development" : "production", repositoryDirectory, "");
  const protectionToken = environment.ARTSHIELD_PROTECTION_TOKEN;
  const registryToken = environment.ARTSHIELD_REGISTRY_TOKEN;
  const ownershipToken = environment.ARTSHIELD_OWNERSHIP_TOKEN;
  const mutationRole = environment.ARTSHIELD_MUTATION_ROLE ?? "operator";
  const target = process.env.LOCAL_BACKEND_URL ?? environment.LOCAL_BACKEND_URL ?? "http://localhost:3000";
  const headersFor = (token?: string) => token ? { authorization: `Bearer ${token}`, "x-artshield-role": mutationRole } : undefined;
  const proxyEntry = (token?: string) => ({ target, changeOrigin: true, headers: headersFor(token) });

  return {
    envDir: frontendDirectory,
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
      proxy: {
        "/api/protection": proxyEntry(protectionToken),
        "/api/verification": proxyEntry(protectionToken),
        "/api/security": proxyEntry(protectionToken),
        "/api/certificates": proxyEntry(registryToken),
        "/api/artworks/register": proxyEntry(registryToken),
        "/api/artworks/transfer": proxyEntry(ownershipToken),
        "/api/rights": proxyEntry(ownershipToken),
        "/api": proxyEntry(),
      },
    },
  };
});
