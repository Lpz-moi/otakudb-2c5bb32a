import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detect remote/restricted dev environments (Codespaces, github.dev, Gitpod)
  const isCodespaces = !!process.env.CODESPACE_NAME;
  const isGithubDev = !!process.env.GITHUB_DEV || !!process.env.GITHUB_ACTIONS;
  const isGitpod = !!process.env.GITPOD_WORKSPACE_ID;
  const isRemoteTunnel = isCodespaces || isGithubDev || isGitpod;

  return {
    server: {
      host: "::",
      port: 5173,
      strictPort: true,
      // In remote tunnelling environments HMR websockets often fail (CORS/proxy).
      // Disable HMR there to avoid noisy WebSocket/CORS errors. Locally, enable HMR
      // with explicit host/clientPort so the client connects to the right socket.
      hmr: isRemoteTunnel
        ? false
        : {
            overlay: false,
            protocol: 'ws',
            host: 'localhost',
            clientPort: 5173,
          },
      // Add CORS headers for development
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
