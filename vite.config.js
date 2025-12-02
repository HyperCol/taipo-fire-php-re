import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 輸出單一 JS 檔案以方便替換
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: "assets/index.js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
