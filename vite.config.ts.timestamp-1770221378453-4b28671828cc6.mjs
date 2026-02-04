// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => {
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
      hmr: isRemoteTunnel ? false : {
        overlay: false,
        protocol: "ws",
        host: "localhost",
        clientPort: 5173
      },
      // Add CORS headers for development
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gRGV0ZWN0IHJlbW90ZS9yZXN0cmljdGVkIGRldiBlbnZpcm9ubWVudHMgKENvZGVzcGFjZXMsIGdpdGh1Yi5kZXYsIEdpdHBvZClcbiAgY29uc3QgaXNDb2Rlc3BhY2VzID0gISFwcm9jZXNzLmVudi5DT0RFU1BBQ0VfTkFNRTtcbiAgY29uc3QgaXNHaXRodWJEZXYgPSAhIXByb2Nlc3MuZW52LkdJVEhVQl9ERVYgfHwgISFwcm9jZXNzLmVudi5HSVRIVUJfQUNUSU9OUztcbiAgY29uc3QgaXNHaXRwb2QgPSAhIXByb2Nlc3MuZW52LkdJVFBPRF9XT1JLU1BBQ0VfSUQ7XG4gIGNvbnN0IGlzUmVtb3RlVHVubmVsID0gaXNDb2Rlc3BhY2VzIHx8IGlzR2l0aHViRGV2IHx8IGlzR2l0cG9kO1xuXG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIC8vIEluIHJlbW90ZSB0dW5uZWxsaW5nIGVudmlyb25tZW50cyBITVIgd2Vic29ja2V0cyBvZnRlbiBmYWlsIChDT1JTL3Byb3h5KS5cbiAgICAgIC8vIERpc2FibGUgSE1SIHRoZXJlIHRvIGF2b2lkIG5vaXN5IFdlYlNvY2tldC9DT1JTIGVycm9ycy4gTG9jYWxseSwgZW5hYmxlIEhNUlxuICAgICAgLy8gd2l0aCBleHBsaWNpdCBob3N0L2NsaWVudFBvcnQgc28gdGhlIGNsaWVudCBjb25uZWN0cyB0byB0aGUgcmlnaHQgc29ja2V0LlxuICAgICAgaG1yOiBpc1JlbW90ZVR1bm5lbFxuICAgICAgICA/IGZhbHNlXG4gICAgICAgIDoge1xuICAgICAgICAgICAgb3ZlcmxheTogZmFsc2UsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3dzJyxcbiAgICAgICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICAgICAgY2xpZW50UG9ydDogNTE3MyxcbiAgICAgICAgICB9LFxuICAgICAgLy8gQWRkIENPUlMgaGVhZGVycyBmb3IgZGV2ZWxvcG1lbnRcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULCBQT1NULCBQVVQsIERFTEVURSwgT1BUSU9OUycsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSwgQXV0aG9yaXphdGlvbicsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxlQUFlLENBQUMsQ0FBQyxRQUFRLElBQUk7QUFDbkMsUUFBTSxjQUFjLENBQUMsQ0FBQyxRQUFRLElBQUksY0FBYyxDQUFDLENBQUMsUUFBUSxJQUFJO0FBQzlELFFBQU0sV0FBVyxDQUFDLENBQUMsUUFBUSxJQUFJO0FBQy9CLFFBQU0saUJBQWlCLGdCQUFnQixlQUFlO0FBRXRELFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUlaLEtBQUssaUJBQ0QsUUFDQTtBQUFBLFFBQ0UsU0FBUztBQUFBLFFBQ1QsVUFBVTtBQUFBLFFBQ1YsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLE1BQ2Q7QUFBQTtBQUFBLE1BRUosU0FBUztBQUFBLFFBQ1AsK0JBQStCO0FBQUEsUUFDL0IsZ0NBQWdDO0FBQUEsUUFDaEMsZ0NBQWdDO0FBQUEsTUFDbEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDOUUsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
