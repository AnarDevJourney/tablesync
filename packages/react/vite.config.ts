import { defineConfig } from "vitest/config";

// Library build: one ES module + one stylesheet. React, AntD and dnd-kit
// are peer dependencies and stay external.
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^antd($|\/)/,
        /^@ant-design\//,
        /^@dnd-kit\//,
      ],
      output: {
        // the components use hooks: mark the bundle for React Server Components
        banner: '"use client";',
      },
    },
    minify: false, // readable in users' devtools; their bundler minifies
    sourcemap: true,
    emptyOutDir: true,
  },
  css: {
    modules: {
      // stable, readable class names users can target
      generateScopedName: "ts-[local]-[hash:base64:5]",
    },
  },
  test: {
    environment: "jsdom",
  },
});
