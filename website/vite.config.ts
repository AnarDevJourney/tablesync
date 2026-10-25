import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The docs and changelog pages render ../README.md and ../CHANGELOG.md,
// so the site never drifts from the repo's documentation.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // tablesync is the local workspace package: one React / AntD for both
    dedupe: ["react", "react-dom", "antd", "@ant-design/icons", "@dnd-kit/core"],
  },
  server: {
    port: 5180,
    fs: { allow: [".."] },
  },
});
